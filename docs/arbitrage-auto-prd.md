# ArbitrageAuto AI — Product Requirements Document (PRD)

> **Purpose:** Complete specification for Claude Code to plan and build ArbitrageAuto AI.
> **Related docs:** [concept.md](./arbitrage-auto-concept.md) | [technical.md](./arbitrage-auto-technical.md)

---

## 1. Project Overview

**What:** A car market intelligence platform that combines real-time price scraping with a RAG-powered AI advisor.

**Pitch:** "ArbitrageAuto AI treats a car purchase like a $50,000 investment. We use high-frequency scraping to find math-based deals and RAG-powered AI to handle human-based negotiation, turning every buyer into a professional car trader."

**Key Differentiator:** No one else combines real-time scraped pricing data + RAG-powered AI that can query it. Users get both the Bloomberg terminal AND the financial advisor.

---

## 2. System Architecture

### Three Microservices

```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  SCRAPER SERVICE  │  │  NEXUS AI SERVICE │  │   API GATEWAY    │
│  (NestJS)         │  │  (Python/FastAPI)  │  │   (NestJS)       │
│                   │  │                    │  │                  │
│  • Playwright     │  │  • Quivr RAG       │  │  • REST API      │
│  • Cron jobs      │  │  • LLM (Claude)    │  │  • WebSocket     │
│  • Proxy rotation │  │  • DB query tools  │  │  • Auth           │
│  • Data pipeline  │  │  • Knowledge base  │  │  • Rate limiting  │
└────────┬─────────┘  └────────┬───────────┘  └────────┬─────────┘
         │                     │                        │
         └─────────┬───────────┘                        │
                   ▼                                    │
         ┌──────────────────┐                           │
         │   PostgreSQL +   │◄──────────────────────────┘
         │   TimescaleDB    │
         └──────────────────┘
                   │
                   ▼
         ┌──────────────────────────────────────────┐
         │           ANGULAR FRONTEND                │
         │  ┌────────────────┐ ┌──────────────────┐ │
         │  │ Charts (D3.js) │ │ Chat (Socket.io) │ │
         │  └────────────────┘ └──────────────────┘ │
         └──────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Why |
|---|---|---|
| API Gateway | NestJS (Express) | TypeScript, modular, WebSocket support |
| Scraper | NestJS + Playwright | Headless browser for JS-heavy sites |
| AI Service | Python FastAPI + Quivr | Already built in Nexus, RAG-ready |
| LLM | Anthropic Claude | Already integrated in Nexus |
| Database | PostgreSQL + TimescaleDB | Time-series price data, relational queries |
| Vector Store | Quivr (Faiss → pgvector later) | Knowledge retrieval for AI advisor |
| Frontend | Angular + D3.js | Dashboard-heavy "trading desk" UI |
| Real-time | Socket.io | Chat, deal alerts, price ticker |
| Proxy | ScrapingBee or Bright Data | Anti-blocking for scrapers |
| Infra | Docker Compose → AWS/K8s | Start local, scale later |

---

## 3. Database Schema

### Table: `listings` (current state of every known car)

```sql
CREATE TABLE listings (
    vin             VARCHAR(17) PRIMARY KEY,
    make            VARCHAR(50) NOT NULL,
    model           VARCHAR(100) NOT NULL,
    year            SMALLINT NOT NULL,
    trim            VARCHAR(100),
    trim_normalized VARCHAR(50),        -- canonical: "M_SPORT", "BASE", "LIMITED"
    price           INTEGER NOT NULL,    -- current asking price in cents
    mileage         INTEGER NOT NULL,    -- odometer reading
    location_city   VARCHAR(100),
    location_state  VARCHAR(50),
    location_zip    VARCHAR(10),
    latitude        DECIMAL(9,6),
    longitude       DECIMAL(9,6),
    condition       VARCHAR(20),         -- 'new', 'used', 'cpo'
    title_status    VARCHAR(20) DEFAULT 'clean',
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

CREATE INDEX idx_listings_make_model ON listings (make, model);
CREATE INDEX idx_listings_year ON listings (year);
CREATE INDEX idx_listings_price ON listings (price);
CREATE INDEX idx_listings_location ON listings (location_state, location_zip);
CREATE INDEX idx_listings_active ON listings (is_active) WHERE is_active = TRUE;
```

### Table: `price_snapshots` (TimescaleDB hypertable — historical tracking)

```sql
CREATE TABLE price_snapshots (
    id              BIGSERIAL,
    vin             VARCHAR(17) NOT NULL REFERENCES listings(vin),
    price           INTEGER NOT NULL,
    mileage         INTEGER,
    source          VARCHAR(50),
    snapshot_date   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, snapshot_date)
);

SELECT create_hypertable('price_snapshots', 'snapshot_date');
CREATE INDEX idx_snapshots_vin ON price_snapshots (vin, snapshot_date DESC);
```

### Table: `market_aggregates` (pre-computed daily stats)

```sql
CREATE TABLE market_aggregates (
    id              BIGSERIAL,
    make            VARCHAR(50) NOT NULL,
    model           VARCHAR(100) NOT NULL,
    year            SMALLINT NOT NULL,
    trim_normalized VARCHAR(50),
    region          VARCHAR(50),         -- state or 'national'
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
CREATE INDEX idx_aggregates_lookup ON market_aggregates (make, model, year, computed_date DESC);
```

### Table: `sold_listings` (auction results — true market value)

```sql
CREATE TABLE sold_listings (
    id              BIGSERIAL PRIMARY KEY,
    vin             VARCHAR(17),
    make            VARCHAR(50) NOT NULL,
    model           VARCHAR(100) NOT NULL,
    year            SMALLINT NOT NULL,
    trim_normalized VARCHAR(50),
    sold_price      INTEGER NOT NULL,
    mileage         INTEGER,
    location_state  VARCHAR(50),
    source          VARCHAR(50) NOT NULL,
    source_url      TEXT,
    sold_date       TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Table: `user_watchlists` (alert subscriptions)

```sql
CREATE TABLE user_watchlists (
    id              BIGSERIAL PRIMARY KEY,
    user_id         UUID NOT NULL,
    make            VARCHAR(50) NOT NULL,
    model           VARCHAR(100) NOT NULL,
    year_min        SMALLINT,
    year_max        SMALLINT,
    price_max       INTEGER,
    mileage_max     INTEGER,
    location_state  VARCHAR(50),
    radius_miles    INTEGER,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Upsert Logic (on every scrape)

```sql
-- Upsert listing by VIN
INSERT INTO listings (vin, make, model, year, trim, price, mileage, location_state, source, source_url)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
ON CONFLICT (vin) DO UPDATE SET
    price = EXCLUDED.price,
    mileage = EXCLUDED.mileage,
    last_seen_at = NOW(),
    updated_at = NOW(),
    days_on_market = EXTRACT(DAY FROM NOW() - listings.first_seen_at);

-- Insert price snapshot only if price actually changed
INSERT INTO price_snapshots (vin, price, mileage, source)
SELECT $1, $6, $7, $9
WHERE NOT EXISTS (
    SELECT 1 FROM price_snapshots
    WHERE vin = $1 AND price = $6 AND snapshot_date > NOW() - INTERVAL '1 day'
);
```

---

## 4. Feature Specifications

### 4A. The Quantitative View (Charts)

#### Scatter Plot — Arbitrage Detector (MOST IMPORTANT)

- **X-Axis:** Mileage | **Y-Axis:** Price
- Each dot = a real listing, color-coded by trim level
- **Linear regression line** = "Fair Market Value"
- **1.5 sigma band** = price boundary
- Dots below the band = mathematically underpriced = **deal flag**
- Click a deal dot → sidebar shows deal score, profit potential, listing link
- **Math:** `dealScore = clamp((expectedPrice - actualPrice) / stdDev * 33, -100, 100)`

#### Volatility Chart — Buy/Hold/Wait Signal

- **X-Axis:** Time (90 days) | **Y-Axis:** Average price
- 10-day Moving Average vs 50-day Moving Average
- **Golden cross** (10d crosses above 50d) = market heating up → BUY
- **Death cross** (10d crosses below 50d) = prices dropping → WAIT
- Neither = HOLD

#### Depreciation Curve

- **X-Axis:** Age (years) | **Y-Axis:** % of MSRP retained
- Highlights the "sweet spot" where depreciation flattens (usually year 3-4)
- **Comparison mode:** overlay two models side by side

#### Geographic Heatmap

- Average price by state, color scale green (cheap) → red (expensive)
- **Shipping calculator overlay:** if (remote price + shipping) < local price → geographic arbitrage
- Use Leaflet.js for map rendering

#### Market Volume / Liquidity

- Bar chart: new listings vs sold listings per week
- High sold / low new = seller's market (prices will rise)
- Low sold / high new = buyer's market (negotiate hard)

### 4B. The AI Advisor (Nexus Integration)

The AI is a persistent chat sidebar connected to the live car database via callable tool functions.

#### AI Tool Functions (the AI can call these)

```typescript
// These are the functions the LLM can invoke to query live data

interface AITools {
  // Search listings with natural language parsed to structured query
  search_cars(params: {
    make?: string;
    model?: string;
    yearMin?: number;
    yearMax?: number;
    priceMax?: number;
    mileageMax?: number;
    state?: string;
    condition?: string;
  }): Promise<Listing[]>;

  // Get deal score and valuation for a specific car
  get_deal_score(vin: string): Promise<{
    fairMarketValue: number;
    dealScore: number;       // -100 to +100
    priceRange: { low: number; mid: number; high: number };
    percentile: number;
    comparables: Listing[];
  }>;

  // Get market trend / volatility for a model
  get_market_trend(params: {
    make: string;
    model: string;
    year?: number;
    days?: number;
  }): Promise<{
    ma10: number;
    ma50: number;
    signal: 'BUY' | 'HOLD' | 'WAIT';
    priceChange7d: number;
    priceChange30d: number;
  }>;

  // Get depreciation data
  get_depreciation(params: {
    make: string;
    model: string;
    trim?: string;
  }): Promise<{
    curves: { year: number; avgPrice: number; retainedPct: number }[];
    sweetSpotYear: number;
  }>;

  // Search knowledge base for mechanical issues, reviews
  search_knowledge(query: string): Promise<{
    issues: string[];
    sources: string[];
  }>;

  // Create a watchlist for the user
  create_watchlist(params: {
    make: string;
    model: string;
    priceMax: number;
    yearMin?: number;
    yearMax?: number;
  }): Promise<{ id: string }>;
}
```

#### AI Use Cases (with example conversations)

**1. Smart Search (Natural Language → SQL)**
```
User: "I have $25,000 and want a reliable SUV, not white, good resale value"
AI:   Calls search_cars({priceMax: 25000, condition: 'used'})
      + get_depreciation for top SUV models
      → "I found 23 SUVs under $25k. The best value is a 2021 Toyota RAV4 XLE —
         it retains 72% of its value after 5 years. There are 3 listings below
         fair market value in your area."
```

**2. Market Interpretation**
```
User: "Is now a good time to buy a Tesla Model 3?"
AI:   Calls get_market_trend({make: 'tesla', model: 'model-3'})
      → "Prices dropped 5% in the last 14 days. The 10-day MA just crossed below
         the 50-day MA — historically this means prices continue falling.
         I recommend waiting 2 more weeks. Want me to set an alert?"
```

**3. Negotiation Coach**
```
User: "I found a 2018 Ford Focus for $14,000. Good deal?"
AI:   Calls get_deal_score(vin)
      + search_knowledge("2018 Ford Focus common problems")
      → "This car has been listed for 47 days (avg is 21). The seller is likely
         motivated. Also, this model has known dual-clutch transmission issues —
         ask if the TCM was replaced. Fair price is $11,800. Here's a
         negotiation script: [...]"
```

**4. Proactive Alerts**
```
AI:   [unprompted] "A 2021 Porsche Macan just hit the market in Texas for $5k
      below the moving average. The listing says 'moving next week' — motivated
      seller signal. Matches your watchlist. Want me to draft an offer email?"
```

**5. Total Cost of Ownership**
```
User: "Compare RAV4 vs CR-V total cost for 3 years"
AI:   Calls get_depreciation for both + search_knowledge for maintenance costs
      → Shows table: purchase price, depreciation, insurance, fuel, maintenance,
         total 3-year cost for each
```

#### Knowledge Base (What to Index into Nexus RAG Brains)

| Brain Name | Content | Source |
|---|---|---|
| `mechanical-issues` | Common failures by make/model/year, recall data | NHTSA, Reddit r/MechanicAdvice, car forums |
| `expert-reviews` | Reliability ratings, pros/cons, buying guides | Consumer Reports, Edmunds, Car and Driver |
| `negotiation` | Dealer tactics, negotiation scripts, timing strategies | Expert articles, dealer playbooks |
| `maintenance-costs` | Average repair costs by model, scheduled maintenance | RepairPal, YourMechanic |
| `insurance-data` | Average insurance rates by model/state/age | Rate comparison data |

---

## 5. API Endpoints

### Market Data
```
GET  /api/v1/market-data              # Filtered listings + stats
GET  /api/v1/market-data/:vin         # Single listing details
```

### Charts
```
GET  /api/v1/charts/scatter           # Scatter plot data + regression
GET  /api/v1/charts/depreciation      # Depreciation curves
GET  /api/v1/charts/volatility        # Moving averages + signal
GET  /api/v1/charts/heatmap           # Geographic price map
GET  /api/v1/charts/volume            # Inventory turnover
```

### Valuations
```
GET  /api/v1/valuations/:vin          # Fair value for a specific car
GET  /api/v1/valuations/estimate      # Estimate by make/model/year/mileage
```

### Watchlists & Alerts
```
POST   /api/v1/watchlists             # Create watchlist
GET    /api/v1/watchlists             # List user's watchlists
DELETE /api/v1/watchlists/:id         # Remove watchlist
GET    /api/v1/alerts                 # Get triggered deal alerts
```

### Chat (WebSocket)
```
WS   /ws/chat                         # Real-time AI chat connection
POST /api/v1/chat/message             # Fallback REST for chat
GET  /api/v1/chat/history             # Conversation history
```

---

## 6. Scraper Specifications

### Per-Site Job Structure

Each website gets its own isolated scraper class/strategy:

```
scraper/
├── jobs/
│   ├── autotrader.job.ts        # Cron: 1:00 AM
│   ├── cargurus.job.ts          # Cron: 2:00 AM
│   ├── cars-com.job.ts          # Cron: 3:00 AM
│   ├── ebay-motors.job.ts       # Cron: 4:00 AM
│   ├── bring-a-trailer.job.ts   # Cron: 4:30 AM
│   └── aggregate.job.ts         # Cron: 6:00 AM (after all scrapers)
├── services/
│   ├── browser.service.ts       # Playwright browser pool (max 3)
│   ├── proxy.service.ts         # Proxy rotation
│   └── rate-limiter.service.ts  # Per-site throttling
├── parsers/
│   ├── price.parser.ts          # "$23,500" → 23500
│   ├── mileage.parser.ts        # "45,200 mi" → 45200
│   ├── trim.parser.ts           # "M-Sport" / "MSport" → "M_SPORT"
│   └── vin.parser.ts            # VIN validation (17 chars, check digit)
└── pipeline/
    ├── validator.ts             # VIN format, price > 0, mileage >= 0
    ├── deduplicator.ts          # VIN-based ON CONFLICT upsert
    ├── normalizer.ts            # Trim canonical mapping
    ├── outlier-filter.ts        # MAD (Median Absolute Deviation), threshold 3.5
    └── sentiment.ts             # Regex-based: "motivated seller", "must sell", "obo"
```

### Job Lifecycle

```
1. Acquire browser from pool + attach proxy
2. Navigate to search results (waitUntil: 'domcontentloaded')
3. Wait for listing card selector (NOT networkidle)
4. Paginate up to MAX_PAGES (default 50)
5. Per page: $$eval to extract all listing cards
6. Parse: price, mileage, VIN, location, trim, title
7. Validate → Normalize → Filter outliers
8. Upsert to PostgreSQL (VIN as primary key)
9. If price changed → insert price_snapshot row
10. Release browser, log metrics (count, errors, duration)
11. Random delay between pages: 2-5 seconds
```

### Mandatory Data Points Per Listing

| Field | Type | Required | Purpose |
|---|---|---|---|
| `vin` | VARCHAR(17) | Yes | Deduplication key |
| `price` | INTEGER | Yes | The core data point |
| `mileage` | INTEGER | Yes | For scatter plot X-axis |
| `make` | VARCHAR | Yes | Filtering |
| `model` | VARCHAR | Yes | Filtering |
| `year` | SMALLINT | Yes | Filtering |
| `trim` | VARCHAR | No | Accuracy (M-Sport vs Base) |
| `location_state` | VARCHAR | No | Geographic arbitrage |
| `days_on_market` | INTEGER | Computed | Desperate seller signal |
| `source` | VARCHAR | Yes | Track which site |
| `source_url` | TEXT | Yes | Link to original listing |

---

## 7. Computation Logic

### Linear Regression (Fair Market Value)

```
price = slope * mileage + intercept
R² = goodness of fit (> 0.7 = reliable)
```

### Deal Score

```
expectedPrice = slope * mileage + intercept
deviation = expectedPrice - actualPrice  (positive = good deal)
dealScore = clamp((deviation / stdDev) * 33, -100, 100)

Score interpretation:
  +60 to +100  = Steal (rare, act fast)
  +30 to +59   = Good deal (below market)
  -29 to +29   = Fair price
  -59 to -30   = Overpriced
  -100 to -60  = Way overpriced
```

### Outlier Filtering (MAD)

```
1. Sort all prices for a make/model/year
2. Find median
3. Compute deviations from median
4. MAD = median of deviations
5. Modified Z-score = 0.6745 * (price - median) / (1.4826 * MAD)
6. If |Z-score| > 3.5 → outlier → exclude
```

### Moving Average Signal

```
If 10-day MA crosses ABOVE 50-day MA → BUY (golden cross)
If 10-day MA crosses BELOW 50-day MA → WAIT (death cross)
Otherwise → HOLD
```

---

## 8. Frontend Layout — "The Command Center"

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ArbitrageAuto AI                                    [Alerts 3] [Profile]│
├──────────────────────────────────────────────┬───────────────────────────┤
│                                              │                           │
│  LEFT ~65% — THE "QUANT" VIEW                │  RIGHT ~35% — AI ADVISOR  │
│                                              │                           │
│  ┌────────────────────────────────────────┐  │  ┌───────────────────────┐│
│  │  🔍 Filters: Make/Model/Year/State     │  │  │ AI: I found 4 deals  ││
│  └────────────────────────────────────────┘  │  │ below fair value.     ││
│                                              │  │ The best one is a     ││
│  ┌────────────────────────────────────────┐  │  │ 2021 XLE in           ││
│  │         SCATTER PLOT                   │  │  │ Sacramento...         ││
│  │    $35k ·                              │  │  │                       ││
│  │         · ·  ·                         │  │  │ ⚠️ This model has    ││
│  │    $30k ·  ·───────── regression       │  │  │ known oil consumption ││
│  │         ·  · ·  ·  ·                   │  │  │ issues. Ask about it. ││
│  │    $25k    · ·  ·  ·  ·               │  │  │                       ││
│  │         ⭐·    ·  ·  ·  (deal!)       │  │  │ ────────────────────  ││
│  │    $20k          ·  ·                  │  │  │                       ││
│  │         20k  40k  60k  80k  mileage    │  │  │ You: Is the Camry     ││
│  └────────────────────────────────────────┘  │  │ reliable at 80k mi?   ││
│                                              │  │                       ││
│  ┌──────────────┐ ┌──────────────────────┐  │  │ [Type a message...]   ││
│  │ DEPRECIATION │ │    VOLATILITY        │  │  └───────────────────────┘│
│  │   CURVE      │ │  MA10 vs MA50        │  │                           │
│  │  ────╲       │ │  Signal: WAIT        │  │                           │
│  │       ╲──────│ │                      │  │                           │
│  └──────────────┘ └──────────────────────┘  │                           │
│                                              │                           │
│  📊 TICKER: Model 3 ↓2.3% | F-150 ↑0.8%   │                           │
└──────────────────────────────────────────────┴───────────────────────────┘
```

---

## 9. Cron Job Schedule

| Time | Job | Purpose | Depends On |
|---|---|---|---|
| 1:00 AM | Autotrader Scraper | Scrape listings | - |
| 2:00 AM | CarGurus Scraper | Scrape listings | - |
| 3:00 AM | Cars.com Scraper | Scrape listings | - |
| 4:00 AM | eBay Motors Scraper | Scrape sold prices | - |
| 4:30 AM | Bring a Trailer | Scrape auction results | - |
| 5:00 AM | Mobile.de Scraper | EU market listings | - |
| 6:00 AM | Daily Aggregation | Compute market stats | All scrapers |
| 7:00 AM | Deal Detector | Match watchlists → alerts | Aggregation |
| 8:00 AM | Stale Detector | Deactivate old listings | - |

---

## 10. NestJS Module Structure

```
src/
├── app.module.ts
├── scraper/
│   ├── scraper.module.ts
│   ├── jobs/                    # Per-site scraper cron jobs
│   ├── services/                # Browser pool, proxy, rate limiter
│   ├── parsers/                 # Price, mileage, trim, VIN parsers
│   └── pipeline/                # Validator, deduplicator, outlier filter
├── market-data/
│   ├── market-data.module.ts
│   ├── market-data.controller.ts
│   ├── market-data.service.ts
│   └── dto/                     # Query/response DTOs with Zod
├── charts/
│   ├── charts.module.ts
│   ├── charts.controller.ts
│   └── services/                # Regression, volatility, depreciation, heatmap
├── valuations/
│   ├── valuations.module.ts
│   ├── valuations.controller.ts
│   └── valuations.service.ts
├── alerts/
│   ├── alerts.module.ts
│   ├── alerts.controller.ts
│   ├── watchlist.controller.ts
│   └── services/                # Deal detector, notification sender
├── chat/
│   ├── chat.module.ts
│   ├── chat.gateway.ts          # WebSocket gateway
│   └── chat.service.ts          # Bridges to Nexus AI service
├── common/
│   ├── filters/                 # Outlier filter
│   ├── validators/              # Listing validator
│   └── enrichment/              # Sentiment analysis
└── database/
    ├── database.module.ts
    ├── repositories/            # One per table
    └── migrations/              # SQL migration files
```

---

## 11. Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/arbitrage_auto
TIMESCALEDB_ENABLED=true

# Scraping
PROXY_PROVIDER=scrapingbee
SCRAPINGBEE_API_KEY=
MAX_CONCURRENT_BROWSERS=3
SCRAPE_MAX_PAGES=50
SCRAPE_DELAY_MIN_MS=2000
SCRAPE_DELAY_MAX_MS=5000

# API
PORT=3000
API_RATE_LIMIT=100
CORS_ORIGIN=http://localhost:4200

# Nexus AI Service
NEXUS_SERVICE_URL=http://localhost:8000
ANTHROPIC_API_KEY=

# Alerts
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# Auth (future)
JWT_SECRET=
JWT_EXPIRY=7d
```

---

## 12. Business Model

| Tier | Price | Features |
|---|---|---|
| **Basic** | Free | Search, average price, 3 AI questions/day |
| **Pro** | $29/mo | Unlimited AI chat, deal alerts, historical charts, watchlists, negotiation coaching |
| **Enterprise** | $199/mo | API access, inventory gap analysis, bulk data export |
| **Concierge** | $99 one-time | AI analyzes a specific listing: fair price, risks, negotiation script, TCO |

---

## 13. Development Roadmap

### Month 1 — Data Foundation
- PostgreSQL + TimescaleDB schema + migrations
- Single scraper (Autotrader) with full pipeline
- REST API for market data queries
- Angular scaffold with scatter plot

### Month 2 — Charts & Alerts
- Add 3-5 more scrapers
- Depreciation, volatility, volume charts
- Watchlist + deal detection
- WebSocket price ticker

### Month 3 — AI Advisor (Nexus Integration)
- Connect Nexus to PostgreSQL (tool functions)
- Chat sidebar in Angular (Socket.io)
- AI tools: search_cars, get_deal_score, get_market_trend
- Natural language search + market interpretation

### Month 4 — Knowledge & Negotiation
- Index knowledge bases into Nexus RAG brains
- Negotiation coaching feature
- Total cost of ownership calculator
- Proactive deal alerts via chat
- Geographic heatmap

### Month 5 — Launch
- Auth + user accounts
- Stripe billing
- Concierge flow
- Landing page
- Beta launch

---

## 14. Technical Rules for Implementation

1. **Zod for all validation** — scraped data must pass strict schemas before DB
2. **Modular scrapers** — each site is its own class/strategy, easy to add more
3. **VIN is the primary key** — handles cross-site deduplication automatically
4. **No `any` types** — strict TypeScript throughout
5. **WebSocket for chat** — must feel real-time, not click-and-wait
6. **Simplicity first** — clean patterns, avoid over-engineering
7. **Async/await everywhere** — no blocking operations
8. **MAD for outliers** — not simple min/max, use Median Absolute Deviation
9. **Price in cents** — avoid floating point issues
10. **Staggered cron jobs** — don't spike resources, spread across hours

---

*Complete PRD for ArbitrageAuto AI — February 2026*
