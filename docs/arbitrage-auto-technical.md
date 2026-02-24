# ArbitrageAuto - Technical Architecture

> Implementation guide for the car market intelligence data pipeline.
> For business concept, see [arbitrage-auto-concept.md](./arbitrage-auto-concept.md)

---

## System Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                         SCRAPING LAYER                                 │
│                                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │  Autotrader   │  │  Cars.com    │  │  eBay Motors  │  ...more       │
│  │  Scraper Job  │  │  Scraper Job │  │  Scraper Job  │                │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                 │
│         │                  │                  │                         │
│         └──────────────────┼──────────────────┘                        │
│                            ▼                                           │
│                   ┌────────────────┐                                   │
│                   │  Raw Listings  │                                   │
│                   │    Queue       │                                   │
│                   └───────┬────────┘                                   │
└───────────────────────────┼────────────────────────────────────────────┘
                            │
┌───────────────────────────┼────────────────────────────────────────────┐
│                     DATA PIPELINE                                      │
│                            ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  1. Deduplication  →  VIN-based unique constraint               │   │
│  │  2. Normalization  →  trim names, price/mileage parsing         │   │
│  │  3. Outlier Filter →  MAD (Median Absolute Deviation)           │   │
│  │  4. Enrichment     →  AI sentiment, VIN decoding                │   │
│  │  5. Snapshot        →  daily price snapshot for time-series      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                            │                                           │
│                            ▼                                           │
│                ┌───────────────────────┐                               │
│                │  PostgreSQL +         │                               │
│                │  TimescaleDB          │                               │
│                └───────────┬───────────┘                               │
└────────────────────────────┼───────────────────────────────────────────┘
                             │
┌────────────────────────────┼───────────────────────────────────────────┐
│                       API LAYER (NestJS)                               │
│                            ▼                                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  /market-data        →  filtered listings + stats                │  │
│  │  /market-data/chart  →  pre-computed chart data                  │  │
│  │  /alerts             →  user watchlists & deal notifications     │  │
│  │  /valuations         →  fair market value for a specific car     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────┼───────────────────────────────────────────┘
                             │
┌────────────────────────────┼───────────────────────────────────────────┐
│                    FRONTEND (Angular)                                   │
│                            ▼                                           │
│  ┌─────────────┐ ┌──────────────┐ ┌────────────┐ ┌────────────────┐   │
│  │ Scatter Plot │ │ Depreciation │ │  Heatmap   │ │ Volume / DoM   │   │
│  │  (D3.js)    │ │   Curve      │ │  (Leaflet) │ │  Bar Chart     │   │
│  └─────────────┘ └──────────────┘ └────────────┘ └────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Scraping Jobs

### Job Architecture

Each scraper is a standalone NestJS service that runs on a cron schedule. Jobs are isolated per source site so a failure on one site doesn't block others.

```
scraper/
├── jobs/
│   ├── autotrader.job.ts       # Site-specific scraper
│   ├── cargurus.job.ts
│   ├── ebay-motors.job.ts
│   ├── mobile-de.job.ts        # EU market
│   └── bring-a-trailer.job.ts  # Auction data (sold prices)
├── services/
│   ├── browser.service.ts      # Playwright browser pool management
│   ├── proxy.service.ts        # Proxy rotation (ScrapingBee/Bright Data)
│   └── rate-limiter.service.ts # Per-site request throttling
├── parsers/
│   ├── price.parser.ts         # "$23,500" → 23500
│   ├── mileage.parser.ts       # "45,200 mi" → 45200
│   ├── trim.parser.ts          # "M-Sport" / "MSport" → "M_SPORT"
│   └── vin.parser.ts           # VIN validation (17 chars, check digit)
└── dto/
    └── raw-listing.dto.ts      # Raw scraped data shape
```

### Cron Schedule

```typescript
// Each job runs at a staggered time to avoid resource spikes
@Cron('0 1 * * *')   // 1:00 AM  — Autotrader
@Cron('0 2 * * *')   // 2:00 AM  — CarGurus
@Cron('0 3 * * *')   // 3:00 AM  — Cars.com
@Cron('0 4 * * *')   // 4:00 AM  — eBay Motors
@Cron('30 4 * * *')  // 4:30 AM  — Bring a Trailer
@Cron('0 5 * * *')   // 5:00 AM  — Mobile.de
```

### Scraper Job Lifecycle

```
1. INIT
   ├── Acquire browser instance from pool
   ├── Attach proxy (rotate per request or per session)
   └── Set user-agent rotation

2. CRAWL
   ├── Navigate to search results page
   ├── Wait for listing cards (DOM selector, NOT networkidle)
   ├── Paginate: follow "Next" up to MAX_PAGES (default: 50)
   └── Per page: extract all listing cards

3. PARSE (per listing)
   ├── Extract: title, price, mileage, location, VIN, trim, year, make, model
   ├── Parse strings to typed values (price.parser, mileage.parser)
   ├── Validate VIN format (17 chars, no I/O/Q)
   └── Output: RawListingDto

4. STORE
   ├── Upsert by VIN (INSERT ON CONFLICT UPDATE)
   ├── If price changed → create price_snapshot row
   └── Log: listings scraped, new vs updated, errors

5. CLEANUP
   ├── Release browser instance back to pool
   └── Report job metrics (duration, count, error rate)
```

### Browser Pool Service

```typescript
// browser.service.ts — manages reusable browser instances
@Injectable()
export class BrowserService {
  private pool: Browser[] = [];
  private readonly MAX_POOL_SIZE = 3;

  async acquireBrowser(): Promise<Browser> {
    if (this.pool.length > 0) {
      return this.pool.pop();
    }
    return chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    });
  }

  async releaseBrowser(browser: Browser): Promise<void> {
    if (this.pool.length < this.MAX_POOL_SIZE) {
      this.pool.push(browser);
    } else {
      await browser.close();
    }
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all(this.pool.map(b => b.close()));
  }
}
```

### Proxy Rotation Service

```typescript
// proxy.service.ts
@Injectable()
export class ProxyService {
  private readonly proxies: string[];
  private currentIndex = 0;

  constructor(private config: ConfigService) {
    // Load from env: PROXY_LIST=host1:port1,host2:port2,...
    // Or use ScrapingBee/Bright Data SDK
    this.proxies = config.get<string>('PROXY_LIST').split(',');
  }

  getNext(): { server: string } {
    const proxy = this.proxies[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.proxies.length;
    return { server: proxy };
  }
}
```

### Scraper Job Example (Autotrader)

```typescript
// autotrader.job.ts
@Injectable()
export class AutotraderJob {
  private readonly logger = new Logger(AutotraderJob.name);
  private readonly BASE_URL = 'https://www.autotrader.com/cars-for-sale';
  private readonly MAX_PAGES = 50;

  constructor(
    private browser: BrowserService,
    private proxy: ProxyService,
    private listings: ListingsRepository,
    private priceParser: PriceParser,
    private mileageParser: MileageParser,
  ) {}

  @Cron('0 1 * * *')
  async run(): Promise<void> {
    const browser = await this.browser.acquireBrowser();
    const context = await browser.newContext({
      proxy: this.proxy.getNext(),
      userAgent: this.getRandomUserAgent(),
    });

    try {
      let page = 1;
      let totalScraped = 0;

      while (page <= this.MAX_PAGES) {
        const pageInstance = await context.newPage();
        const url = `${this.BASE_URL}?page=${page}`;

        await pageInstance.goto(url, { waitUntil: 'domcontentloaded' });
        await pageInstance.waitForSelector('[data-cmp="listingCard"]', {
          timeout: 10_000,
        });

        const rawListings = await this.extractListings(pageInstance);
        await this.processAndStore(rawListings);

        totalScraped += rawListings.length;
        await pageInstance.close();

        // Rate limiting: 2-5 second random delay between pages
        await this.sleep(2000 + Math.random() * 3000);
        page++;
      }

      this.logger.log(`Autotrader job complete: ${totalScraped} listings`);
    } catch (error) {
      this.logger.error(`Autotrader job failed: ${error.message}`);
    } finally {
      await context.close();
      await this.browser.releaseBrowser(browser);
    }
  }

  private async extractListings(page: Page): Promise<RawListingDto[]> {
    return page.$$eval('[data-cmp="listingCard"]', (cards) =>
      cards.map((card) => ({
        title: card.querySelector('.title')?.textContent?.trim() ?? '',
        priceRaw: card.querySelector('.price')?.textContent?.trim() ?? '',
        mileageRaw: card.querySelector('.mileage')?.textContent?.trim() ?? '',
        location: card.querySelector('.location')?.textContent?.trim() ?? '',
        vin: card.getAttribute('data-vin') ?? '',
        sourceUrl: card.querySelector('a')?.getAttribute('href') ?? '',
        source: 'autotrader',
        scrapedAt: new Date().toISOString(),
      })),
    );
  }

  private async processAndStore(raw: RawListingDto[]): Promise<void> {
    for (const listing of raw) {
      const parsed: ParsedListing = {
        vin: listing.vin,
        title: listing.title,
        price: this.priceParser.parse(listing.priceRaw),
        mileage: this.mileageParser.parse(listing.mileageRaw),
        location: listing.location,
        source: listing.source,
        sourceUrl: listing.sourceUrl,
        scrapedAt: new Date(listing.scrapedAt),
      };

      // Skip invalid entries
      if (!parsed.vin || !parsed.price || !parsed.mileage) continue;

      await this.listings.upsert(parsed);
    }
  }

  private getRandomUserAgent(): string {
    const agents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
    ];
    return agents[Math.floor(Math.random() * agents.length)];
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
```

---

## 2. Database Schema (PostgreSQL + TimescaleDB)

### Core Tables

```sql
-- Enable TimescaleDB
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- ============================================================
-- LISTINGS: current state of every known car
-- ============================================================
CREATE TABLE listings (
    vin             VARCHAR(17) PRIMARY KEY,
    make            VARCHAR(50) NOT NULL,
    model           VARCHAR(100) NOT NULL,
    year            SMALLINT NOT NULL,
    trim            VARCHAR(100),
    trim_normalized VARCHAR(50),       -- canonical: "M_SPORT", "BASE", "LIMITED"
    price           INTEGER NOT NULL,   -- current asking price in cents
    mileage         INTEGER NOT NULL,   -- odometer reading
    location_city   VARCHAR(100),
    location_state  VARCHAR(50),
    location_zip    VARCHAR(10),
    latitude        DECIMAL(9,6),
    longitude       DECIMAL(9,6),
    condition       VARCHAR(20),        -- 'new', 'used', 'cpo'
    title_status    VARCHAR(20) DEFAULT 'clean', -- 'clean', 'salvage', 'rebuilt'
    source          VARCHAR(50) NOT NULL,
    source_url      TEXT,
    days_on_market  INTEGER,
    description     TEXT,
    first_seen_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common filter queries
CREATE INDEX idx_listings_make_model ON listings (make, model);
CREATE INDEX idx_listings_year ON listings (year);
CREATE INDEX idx_listings_price ON listings (price);
CREATE INDEX idx_listings_location ON listings (location_state, location_zip);
CREATE INDEX idx_listings_active ON listings (is_active) WHERE is_active = TRUE;

-- ============================================================
-- PRICE_SNAPSHOTS: historical price tracking (TimescaleDB hypertable)
-- ============================================================
CREATE TABLE price_snapshots (
    id              BIGSERIAL,
    vin             VARCHAR(17) NOT NULL REFERENCES listings(vin),
    price           INTEGER NOT NULL,
    mileage         INTEGER,
    source          VARCHAR(50),
    snapshot_date   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, snapshot_date)
);

-- Convert to TimescaleDB hypertable for efficient time-series queries
SELECT create_hypertable('price_snapshots', 'snapshot_date');

CREATE INDEX idx_snapshots_vin ON price_snapshots (vin, snapshot_date DESC);

-- ============================================================
-- MARKET_AGGREGATES: pre-computed daily stats per make/model/year
-- ============================================================
CREATE TABLE market_aggregates (
    id              BIGSERIAL,
    make            VARCHAR(50) NOT NULL,
    model           VARCHAR(100) NOT NULL,
    year            SMALLINT NOT NULL,
    trim_normalized VARCHAR(50),
    region          VARCHAR(50),        -- state or 'national'
    avg_price       INTEGER NOT NULL,
    median_price    INTEGER NOT NULL,
    min_price       INTEGER,
    max_price       INTEGER,
    std_dev         DECIMAL(10,2),
    listing_count   INTEGER NOT NULL,
    avg_mileage     INTEGER,
    avg_days_on_market INTEGER,
    computed_date   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, computed_date)
);

SELECT create_hypertable('market_aggregates', 'computed_date');

CREATE INDEX idx_aggregates_lookup
    ON market_aggregates (make, model, year, computed_date DESC);

-- ============================================================
-- SOLD_LISTINGS: auction/sold data for true market value
-- ============================================================
CREATE TABLE sold_listings (
    id              BIGSERIAL PRIMARY KEY,
    vin             VARCHAR(17),
    make            VARCHAR(50) NOT NULL,
    model           VARCHAR(100) NOT NULL,
    year            SMALLINT NOT NULL,
    trim_normalized VARCHAR(50),
    sold_price      INTEGER NOT NULL,   -- actual transaction price
    mileage         INTEGER,
    location_state  VARCHAR(50),
    source          VARCHAR(50) NOT NULL,  -- 'bring_a_trailer', 'ebay_motors'
    source_url      TEXT,
    sold_date       TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sold_make_model ON sold_listings (make, model, year);
CREATE INDEX idx_sold_date ON sold_listings (sold_date DESC);

-- ============================================================
-- USER_WATCHLISTS: alert subscriptions
-- ============================================================
CREATE TABLE user_watchlists (
    id              BIGSERIAL PRIMARY KEY,
    user_id         UUID NOT NULL,
    make            VARCHAR(50) NOT NULL,
    model           VARCHAR(100) NOT NULL,
    year_min        SMALLINT,
    year_max        SMALLINT,
    price_max       INTEGER,            -- alert if listing below this
    mileage_max     INTEGER,
    location_state  VARCHAR(50),
    radius_miles    INTEGER,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Upsert Logic

```sql
-- When a scraper finds a listing, upsert by VIN
INSERT INTO listings (vin, make, model, year, trim, price, mileage, location_state, source, source_url)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
ON CONFLICT (vin) DO UPDATE SET
    price = EXCLUDED.price,
    mileage = EXCLUDED.mileage,
    source = EXCLUDED.source,
    source_url = EXCLUDED.source_url,
    last_seen_at = NOW(),
    updated_at = NOW(),
    days_on_market = EXTRACT(DAY FROM NOW() - listings.first_seen_at);

-- If the price changed, also insert a snapshot
INSERT INTO price_snapshots (vin, price, mileage, source)
SELECT $1, $6, $7, $9
WHERE NOT EXISTS (
    SELECT 1 FROM price_snapshots
    WHERE vin = $1
    AND price = $6
    AND snapshot_date > NOW() - INTERVAL '1 day'
);
```

---

## 3. Data Pipeline

### Pipeline Steps

```
RAW SCRAPE → VALIDATE → DEDUPLICATE → NORMALIZE → FILTER OUTLIERS → ENRICH → STORE → AGGREGATE
```

### Step 1: Validation

```typescript
// validators/listing.validator.ts
interface ValidationResult {
  valid: boolean;
  reason?: string;
}

function validateListing(raw: RawListingDto): ValidationResult {
  // VIN must be exactly 17 alphanumeric chars (no I, O, Q)
  if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(raw.vin)) {
    return { valid: false, reason: 'invalid_vin' };
  }

  // Price must be parseable and > 0
  const price = parseInt(raw.priceRaw.replace(/[^0-9]/g, ''), 10);
  if (isNaN(price) || price <= 0) {
    return { valid: false, reason: 'invalid_price' };
  }

  // Mileage must be parseable and >= 0
  const mileage = parseInt(raw.mileageRaw.replace(/[^0-9]/g, ''), 10);
  if (isNaN(mileage) || mileage < 0) {
    return { valid: false, reason: 'invalid_mileage' };
  }

  return { valid: true };
}
```

### Step 2: Deduplication

VIN as primary key handles cross-source deduplication automatically via `ON CONFLICT`. Same car on Autotrader and CarGurus → single row, latest price wins.

### Step 3: Trim Normalization

```typescript
// parsers/trim.parser.ts
const TRIM_MAP: Record<string, string[]> = {
  'M_SPORT':    ['m-sport', 'm sport', 'msport', 'm-sport package'],
  'BASE':       ['base', 'standard', 'core'],
  'LIMITED':    ['limited', 'ltd'],
  'SPORT':      ['sport', 'sport package', 's-line', 'sline'],
  'PREMIUM':    ['premium', 'premium plus', 'prestige'],
  'TOURING':    ['touring', 'tour'],
  'SE':         ['se', 'special edition'],
  'XLE':        ['xle'],
  'TRD':        ['trd', 'trd off-road', 'trd sport', 'trd pro'],
};

function normalizeTrim(rawTrim: string): string | null {
  const lower = rawTrim.toLowerCase().trim();
  for (const [canonical, variants] of Object.entries(TRIM_MAP)) {
    if (variants.some(v => lower.includes(v))) {
      return canonical;
    }
  }
  return null; // unknown trim
}
```

### Step 4: Outlier Filtering (MAD)

```typescript
// filters/outlier.filter.ts

// Median Absolute Deviation — robust outlier detection
// Better than mean/std for skewed price distributions

function medianAbsoluteDeviation(values: number[]): {
  median: number;
  mad: number;
} {
  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];

  const deviations = sorted.map(v => Math.abs(v - median));
  deviations.sort((a, b) => a - b);
  const mad = deviations[Math.floor(deviations.length / 2)];

  return { median, mad };
}

function filterOutliers(
  listings: ParsedListing[],
  threshold = 3.5, // how many MADs away = outlier
): ParsedListing[] {
  const prices = listings.map(l => l.price);
  const { median, mad } = medianAbsoluteDeviation(prices);

  if (mad === 0) return listings; // all same price, no outliers

  const CONSISTENCY_CONSTANT = 1.4826; // for normal distribution
  return listings.filter(l => {
    const modifiedZScore =
      (0.6745 * (l.price - median)) / (CONSISTENCY_CONSTANT * mad);
    return Math.abs(modifiedZScore) <= threshold;
  });
}
```

### Step 5: AI Enrichment

```typescript
// enrichment/sentiment.service.ts

interface ListingSignals {
  motivatedSeller: boolean;
  mechanicSpecial: boolean;
  priceNegotiable: boolean;
  urgentSale: boolean;
  keywords: string[];
}

const SIGNAL_PATTERNS: Record<string, RegExp> = {
  motivatedSeller: /motivat|must sell|need gone|priced to sell/i,
  mechanicSpecial: /mechanic special|needs work|as.is|project car/i,
  priceNegotiable: /obo|or best offer|negotiable|make.?offer/i,
  urgentSale: /moving|relocat|deploy|divorce|urgent/i,
};

function analyzeDescription(description: string): ListingSignals {
  const signals: ListingSignals = {
    motivatedSeller: false,
    mechanicSpecial: false,
    priceNegotiable: false,
    urgentSale: false,
    keywords: [],
  };

  for (const [signal, pattern] of Object.entries(SIGNAL_PATTERNS)) {
    const match = description.match(pattern);
    if (match) {
      signals[signal] = true;
      signals.keywords.push(match[0]);
    }
  }

  return signals;
}
```

### Step 6: Daily Aggregation Job

```typescript
// jobs/aggregate.job.ts
// Runs after all scrapers finish — computes daily market stats

@Cron('0 6 * * *') // 6:00 AM — after all scrapers complete
async computeDailyAggregates(): Promise<void> {
  await this.db.query(`
    INSERT INTO market_aggregates
      (make, model, year, trim_normalized, region,
       avg_price, median_price, min_price, max_price, std_dev,
       listing_count, avg_mileage, avg_days_on_market)
    SELECT
      make, model, year, trim_normalized, location_state,
      AVG(price)::int,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price)::int,
      MIN(price),
      MAX(price),
      STDDEV(price),
      COUNT(*),
      AVG(mileage)::int,
      AVG(days_on_market)::int
    FROM listings
    WHERE is_active = TRUE
      AND title_status = 'clean'
    GROUP BY make, model, year, trim_normalized, location_state
  `);
}
```

---

## 4. API Endpoints

### Market Data

```
GET /api/v1/market-data
  Query params:
    make        (required)  string    "toyota"
    model       (required)  string    "camry"
    year        (optional)  number    2020
    year_min    (optional)  number    2018
    year_max    (optional)  number    2023
    trim        (optional)  string    "XLE"
    state       (optional)  string    "CA"
    zip         (optional)  string    "90210"
    radius      (optional)  number    100 (miles)
    price_min   (optional)  number    10000
    price_max   (optional)  number    30000
    clean_only  (optional)  boolean   true (exclude salvage)
    sort        (optional)  string    "price_asc" | "price_desc" | "mileage_asc" | "deal_score"
    page        (optional)  number    1
    limit       (optional)  number    50 (max 200)

  Response: {
    data: Listing[],
    meta: {
      total: number,
      page: number,
      pages: number,
      avgPrice: number,
      medianPrice: number,
    }
  }
```

### Chart Data

```
GET /api/v1/charts/scatter
  Query: make, model, year, state?, trim?
  Response: {
    points: { vin, price, mileage, trim, dealScore }[],
    regression: { slope, intercept, r2 },
    stdDevBand: { upper: number[], lower: number[] }
  }

GET /api/v1/charts/depreciation
  Query: make, model, trim?
  Response: {
    curves: {
      year: number,
      avgPrice: number,
      msrp: number,
      retainedPct: number,
    }[]
  }

GET /api/v1/charts/volatility
  Query: make, model, year, days? (default 90)
  Response: {
    daily: { date, avgPrice, volume }[],
    ma10: number[],
    ma50: number[],
    signal: 'BUY' | 'HOLD' | 'WAIT'
  }

GET /api/v1/charts/heatmap
  Query: make, model, year?
  Response: {
    regions: {
      state: string,
      avgPrice: number,
      listingCount: number,
      lat: number,
      lng: number,
    }[]
  }

GET /api/v1/charts/volume
  Query: make, model, year?, weeks? (default 12)
  Response: {
    weekly: {
      week: string,
      newListings: number,
      soldListings: number,
      avgDoM: number,
      marketType: 'BUYER' | 'SELLER' | 'NEUTRAL'
    }[]
  }
```

### Valuations

```
GET /api/v1/valuations/:vin
  Response: {
    vin: string,
    fairMarketValue: number,
    confidence: number,       // 0-1, based on sample size
    priceRange: { low, mid, high },
    percentile: number,       // where this car sits vs market
    dealScore: number,        // -100 (overpriced) to +100 (steal)
    comparables: Listing[],   // 5 closest matches
  }

GET /api/v1/valuations/estimate
  Query: make, model, year, mileage, trim?, state?
  Response: same as above (without VIN-specific data)
```

### Alerts / Watchlists

```
POST /api/v1/watchlists
  Body: { make, model, yearMin?, yearMax?, priceMax, mileageMax?, state? }
  Response: { id, ...watchlist }

GET /api/v1/watchlists
  Response: Watchlist[]

DELETE /api/v1/watchlists/:id

GET /api/v1/alerts
  Query: unread? (boolean)
  Response: {
    alerts: {
      id, watchlistId, listing: Listing, dealScore, triggeredAt
    }[]
  }
```

---

## 5. Chart Computation Logic

### Scatter Plot — Regression & Deal Score

```typescript
// services/regression.service.ts

interface RegressionResult {
  slope: number;
  intercept: number;
  r2: number; // goodness of fit
}

// Simple linear regression: price = slope * mileage + intercept
function linearRegression(
  points: { mileage: number; price: number }[],
): RegressionResult {
  const n = points.length;
  const sumX = points.reduce((s, p) => s + p.mileage, 0);
  const sumY = points.reduce((s, p) => s + p.price, 0);
  const sumXY = points.reduce((s, p) => s + p.mileage * p.price, 0);
  const sumX2 = points.reduce((s, p) => s + p.mileage ** 2, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX ** 2);
  const intercept = (sumY - slope * sumX) / n;

  // R² calculation
  const meanY = sumY / n;
  const ssRes = points.reduce(
    (s, p) => s + (p.price - (slope * p.mileage + intercept)) ** 2, 0,
  );
  const ssTot = points.reduce((s, p) => s + (p.price - meanY) ** 2, 0);
  const r2 = 1 - ssRes / ssTot;

  return { slope, intercept, r2 };
}

// Deal Score: how far below the regression line (in std devs)
function computeDealScore(
  price: number,
  mileage: number,
  regression: RegressionResult,
  stdDev: number,
): number {
  const expectedPrice = regression.slope * mileage + regression.intercept;
  const deviation = expectedPrice - price; // positive = below line = good deal
  const score = Math.round((deviation / stdDev) * 33); // scale to ~-100..+100
  return Math.max(-100, Math.min(100, score));
}
```

### Moving Averages — Buy/Hold/Wait Signal

```typescript
// services/volatility.service.ts

function movingAverage(data: number[], window: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < window - 1) {
      result.push(null);
      continue;
    }
    const slice = data.slice(i - window + 1, i + 1);
    result.push(slice.reduce((a, b) => a + b, 0) / window);
  }
  return result;
}

type Signal = 'BUY' | 'HOLD' | 'WAIT';

function computeSignal(ma10: number[], ma50: number[]): Signal {
  const latest10 = ma10[ma10.length - 1];
  const prev10 = ma10[ma10.length - 2];
  const latest50 = ma50[ma50.length - 1];
  const prev50 = ma50[ma50.length - 2];

  if (!latest10 || !latest50) return 'HOLD';

  // Golden cross: short MA crosses above long MA → market heating up
  if (prev10 <= prev50 && latest10 > latest50) return 'BUY';
  // Death cross: short MA crosses below long MA → prices dropping
  if (prev10 >= prev50 && latest10 < latest50) return 'WAIT';

  return 'HOLD';
}
```

---

## 6. Alert System

### Deal Detection Job

```typescript
// jobs/deal-detector.job.ts
// Runs after scrapers + aggregation

@Cron('0 7 * * *') // 7:00 AM
async detectDeals(): Promise<void> {
  // 1. Get all active watchlists
  const watchlists = await this.watchlistRepo.findActive();

  for (const watchlist of watchlists) {
    // 2. Find listings matching watchlist criteria
    const matches = await this.listingsRepo.findMatching({
      make: watchlist.make,
      model: watchlist.model,
      yearMin: watchlist.yearMin,
      yearMax: watchlist.yearMax,
      priceMax: watchlist.priceMax,
      mileageMax: watchlist.mileageMax,
      state: watchlist.locationState,
    });

    // 3. Compute deal scores for matches
    const regression = await this.regressionService.getForModel(
      watchlist.make, watchlist.model,
    );

    for (const listing of matches) {
      const dealScore = computeDealScore(
        listing.price, listing.mileage, regression, regression.stdDev,
      );

      // 4. If deal score > threshold, create alert
      if (dealScore >= 30) { // 30+ = good deal
        await this.alertsRepo.create({
          watchlistId: watchlist.id,
          userId: watchlist.userId,
          listingVin: listing.vin,
          dealScore,
        });

        // 5. Send notification (email, push, websocket)
        await this.notifications.send(watchlist.userId, {
          type: 'deal_alert',
          listing,
          dealScore,
        });
      }
    }
  }
}
```

---

## 7. Stale Listing Detection

```typescript
// jobs/stale-detector.job.ts
// Mark listings as inactive if not seen for 3+ days

@Cron('0 8 * * *') // 8:00 AM
async markStaleListings(): Promise<void> {
  await this.db.query(`
    UPDATE listings
    SET is_active = FALSE, updated_at = NOW()
    WHERE last_seen_at < NOW() - INTERVAL '3 days'
      AND is_active = TRUE
  `);
}
```

---

## 8. NestJS Module Structure

```
src/
├── app.module.ts
├── scraper/
│   ├── scraper.module.ts
│   ├── jobs/
│   │   ├── autotrader.job.ts
│   │   ├── cargurus.job.ts
│   │   ├── ebay-motors.job.ts
│   │   └── aggregate.job.ts
│   ├── services/
│   │   ├── browser.service.ts
│   │   ├── proxy.service.ts
│   │   └── rate-limiter.service.ts
│   └── parsers/
│       ├── price.parser.ts
│       ├── mileage.parser.ts
│       ├── trim.parser.ts
│       └── vin.parser.ts
├── market-data/
│   ├── market-data.module.ts
│   ├── market-data.controller.ts
│   ├── market-data.service.ts
│   └── dto/
│       ├── market-query.dto.ts
│       └── market-response.dto.ts
├── charts/
│   ├── charts.module.ts
│   ├── charts.controller.ts
│   └── services/
│       ├── regression.service.ts
│       ├── volatility.service.ts
│       ├── depreciation.service.ts
│       └── heatmap.service.ts
├── valuations/
│   ├── valuations.module.ts
│   ├── valuations.controller.ts
│   └── valuations.service.ts
├── alerts/
│   ├── alerts.module.ts
│   ├── alerts.controller.ts
│   ├── watchlist.controller.ts
│   └── services/
│       ├── deal-detector.service.ts
│       └── notification.service.ts
├── common/
│   ├── filters/
│   │   └── outlier.filter.ts
│   ├── validators/
│   │   └── listing.validator.ts
│   └── enrichment/
│       └── sentiment.service.ts
└── database/
    ├── database.module.ts
    ├── repositories/
    │   ├── listings.repository.ts
    │   ├── snapshots.repository.ts
    │   ├── aggregates.repository.ts
    │   ├── sold-listings.repository.ts
    │   ├── watchlists.repository.ts
    │   └── alerts.repository.ts
    └── migrations/
        └── 001_initial_schema.sql
```

---

## 9. Environment Variables

```bash
# .env.example (NEVER commit actual .env)

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/arbitrage_auto
TIMESCALEDB_ENABLED=true

# Scraping
PROXY_PROVIDER=scrapingbee        # or "brightdata", "custom"
SCRAPINGBEE_API_KEY=your_key_here
PROXY_LIST=                        # comma-separated if using custom proxies
MAX_CONCURRENT_BROWSERS=3
SCRAPE_MAX_PAGES=50
SCRAPE_DELAY_MIN_MS=2000
SCRAPE_DELAY_MAX_MS=5000

# API
PORT=3000
API_RATE_LIMIT=100                 # requests per minute per user
CORS_ORIGIN=http://localhost:4200

# Alerts
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=alerts@arbitrageauto.com
SMTP_PASS=your_smtp_password

# AI Enrichment (optional, for advanced sentiment)
ANTHROPIC_API_KEY=your_key_here
```

---

## 10. Job Schedule Summary

| Time | Job | Purpose | Depends On |
|---|---|---|---|
| 1:00 AM | Autotrader Scraper | Scrape listings | - |
| 2:00 AM | CarGurus Scraper | Scrape listings | - |
| 3:00 AM | Cars.com Scraper | Scrape listings | - |
| 4:00 AM | eBay Motors Scraper | Scrape sold prices | - |
| 4:30 AM | Bring a Trailer Scraper | Scrape auction results | - |
| 5:00 AM | Mobile.de Scraper | EU market listings | - |
| 6:00 AM | Daily Aggregation | Compute market stats | All scrapers |
| 7:00 AM | Deal Detector | Match watchlists, send alerts | Aggregation |
| 8:00 AM | Stale Detector | Deactivate old listings | - |

---

*Technical companion to [arbitrage-auto-concept.md](./arbitrage-auto-concept.md)*
