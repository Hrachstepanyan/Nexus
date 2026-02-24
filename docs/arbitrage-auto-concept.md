# ArbitrageAuto AI - Startup Concept

> **Tagline:** The data of a trader. The wisdom of an expert. The mouth of a negotiator.

> **Pitch:** "ArbitrageAuto AI is the first platform that treats a car purchase like a $50,000 investment. We use high-frequency scraping to find the math-based 'deals' and RAG-powered AI to handle the human-based 'negotiation,' turning every buyer into a professional car trader."

A hybrid intelligence platform that combines **quantitative market data** (scrapers, charts, deal detection) with a **conversational AI advisor** (Nexus RAG engine) — giving users both the numbers and the expertise to never overpay for a car.

---

## The Problem

In 2026, the car market is more volatile than ever. EV prices fluctuate wildly, interest rates shift, and "asking prices" on listing sites rarely match actual "sold prices." Buyers and small dealers are making $5,000+ mistakes because they lack real-time, aggregated data. And even when they find a good deal, they don't know how to negotiate or spot hidden risks.

## The Solution

A **dual-brain platform** that combines:
1. **The Quant Side** — High-frequency scraping + statistical analysis to find mathematically underpriced cars
2. **The Advisor Side** — RAG-powered AI chat (built on Nexus) that interprets data, coaches negotiations, and spots hidden mechanical risks

Most platforms give you **information** (listings). This platform gives you **Alpha** (an edge).

---

## Core Architecture

### 1. Data Engine (Backend - NestJS)

#### Data Sources
| Source Type | Examples | Data Provided |
|---|---|---|
| Classified Sites | Autotrader, Cars.com, CarGurus, Mobile.de | Asking prices, days on market |
| Auction Sites | eBay Motors, Bring a Trailer | Final "sold" prices (actual market value) |
| APIs | MarketCheck API, CarAPI | Historical data, technical specs |

#### Scraping Strategy
- **Tool:** Playwright/Puppeteer within NestJS microservices
- **Proxy Rotation:** ScrapingBee or Apify to avoid IP blocks
- **Frequency:** Nightly cron jobs (~5,000 listings/run)
- **Data Points:** Price, Mileage, Trim, VIN, Location/ZIP, Days on Market, Date Listed

#### Data Pipeline
1. **Scrape** raw listings from multiple sources
2. **Normalize** data (match "2020 BMW 330i" across sites)
3. **Clean** remove junk (salvage titles, $1 scams, duplicates, outliers)
4. **Enrich** with AI sentiment analysis on descriptions
5. **Store** in TimescaleDB for time-series queries

#### AI Layer
- Scan descriptions for keywords: "motivated seller," "moving soon," "mechanic special"
- Flag cars as "High-Value Trade" before price officially drops
- Predict 6-month price trends based on historical data

---

## Market Intelligence Pipeline

### Overview

This is a **Market Intelligence Tool**, not a transaction platform. The core value is in the **data pipeline**: scrape -> clean -> visualize -> alert.

### Data Sources (Target "Places")

To get a full picture of the market, scrape/integrate with three tiers:

**Classified Sites (Asking Prices):**
- **US:** Autotrader, Cars.com, CarGurus
- **Europe:** Mobile.de, AutoScout24
- Shows what sellers *want* — the "ask" side of the market

**Auction Sites (Market Heat / Sold Prices):**
- eBay Motors, Bring a Trailer, Copart
- Shows what buyers actually *paid* — the "bid" side of the market
- Critical for calculating true Fair Market Value

**APIs (The Easier Way):**
- **MarketCheck API** — massive historical car listing data, structured and ready to use
- **CarAPI** — technical specs (engine, trim packages, options) to make filters more accurate
- Preferred over scraping when available; more reliable, less maintenance

### Scraping Tech Stack

```
NestJS Microservice (Scraper Worker)
  ├── Playwright / Puppeteer  →  renders JS-heavy listing pages
  ├── ScrapingBee / Apify     →  proxy rotation (anti-blocking)
  └── Cron Scheduler          →  runs nightly, ~5,000 listings/run
```

### Smart Filtering (Beyond Basic Search)

Three filters that separate this from a generic search:

**1. The "Clean" Filter**
- Exclude salvage titles and accident-history cars
- Keeps price data "fair" — a wrecked car at $8k shouldn't drag down the average for clean ones
- Source: VIN decoding + listing description parsing

**2. The "Trim" Matcher**
- A BMW 3-Series with M-Sport package is worth significantly more than a base model
- Scraper must extract trim levels to prevent messy, misleading charts
- Maps raw listing text ("M Sport," "M-Sport," "MSport") to canonical trim names

**3. Location Adjuster**
- Prices in New York =/= prices in Texas
- Users filter by Radius/ZIP to see local market conditions
- Enables geographic arbitrage discovery (buy where it's cheap, sell where it's expensive)

### Simple Architecture Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    NIGHTLY CRON JOB                         │
│                                                             │
│  1. Scrape 5,000 listings from target sites                 │
│  2. Data Cleaner:                                           │
│     - Remove duplicates (same car on two sites via VIN)     │
│     - Remove outliers ($1 car, $1M Corolla)                 │
│     - Normalize trim names                                  │
│  3. Store in PostgreSQL + TimescaleDB                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    API ENDPOINT                              │
│                                                             │
│  GET /market-data?make=toyota&model=camry&year=2020         │
│  GET /market-data/depreciation?make=bmw&model=3-series      │
│  GET /market-data/heatmap?make=ford&model=f150              │
│  GET /market-data/volume?make=tesla&model=model-3           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                 ANGULAR DASHBOARD                            │
│                                                             │
│  Calls API → Renders interactive charts (Chart.js / D3.js)  │
│  User applies filters → Charts update in real-time          │
└─────────────────────────────────────────────────────────────┘
```

### MVP Charts (The Essential Three)

These are the three most important charts for a "trading" feel, using **Chart.js or D3.js**:

#### A. Price vs. Mileage (Scatter Plot) — *Most Important*

The single most valuable chart for any car buyer.

- **X-Axis:** Mileage
- **Y-Axis:** Price
- **Trend Line:** Linear regression showing "Fair Price" at any mileage
- **The Signal:** Any dot significantly **below** the trend line = **potential deal**
- Every buyer's first question: "Is this price fair for this mileage?" — this chart answers it instantly

#### B. Depreciation Curve (Line Chart)

Shows how much value a model loses per year.

- **X-Axis:** Age of Car (Years)
- **Y-Axis:** Average Price
- **The Insight:** Helps users see the "sweet spot" to buy — usually after the 3-year steep depreciation drop
- Buyers learn: don't buy new, buy at the curve's inflection point

#### C. Market Volume (Bar Chart)

Shows supply dynamics — how many of a given car are actually for sale.

- **High Volume** = many options, easier to negotiate, buyer has leverage
- **Low Volume** = fewer options, seller's market, harder to find deals
- Pairs with the scatter plot: a "deal" dot in a high-volume market is a stronger signal

---

## Advanced Charts & Visualizations (Frontend - Angular)

### Chart 1: Arbitrage Scatter Plot (Main Trading View)

The platform's most powerful tool — identifies "undervalued" assets.

| Property | Value |
|---|---|
| **X-Axis** | Mileage (Odometer) |
| **Y-Axis** | Price ($) |
| **Data Points** | Each dot = a real car listing |
| **Color Coding** | Trim levels (e.g., M-Sport vs Base) |

**Trading Signals:**
- **Regression Line** = "Fair Market Value"
- **Standard Deviation Band** (1.5 sigma) = price boundary
- Any dot **below** the band = mathematically underpriced = **BUY ALERT**
- Click a "Deal" dot -> sidebar shows "Profit Potential" (e.g., "$2,400 below market average")

```typescript
// D3.js in Angular Component
const x = d3.scaleLinear().domain([0, maxMileage]).range([0, width]);
const y = d3.scaleLinear().domain([0, maxPrice]).range([height, 0]);

const line = d3.line()
  .x(d => x(d.mileage))
  .y(d => y(regressionLine(d.mileage)));
```

---

### Chart 2: Market Volatility & Momentum (Line Chart)

Modeled after stock market Moving Average charts.

| Property | Value |
|---|---|
| **X-Axis** | Time (Last 90 Days) |
| **Y-Axis** | Average Market Price |

**Trading Signals:**
- **50-Day Moving Average (MA):** Long-term trend
- **10-Day MA:** Current market heat
- 10-day MA crosses **below** 50-day MA -> Prices crashing -> **WAIT**
- 10-day MA crosses **above** 50-day MA -> Market heating up -> **BUY NOW**

---

### Chart 3: Depreciation Floor (Curve Chart)

Shows when a car stops losing money.

| Property | Value |
|---|---|
| **X-Axis** | Age of Car (Years) |
| **Y-Axis** | % of Original MSRP Retained |

**Features:**
- Curved line that flattens out over time
- "Sweet Spot" highlight (usually Year 3-4 where the steep drop ends)
- **Comparison Mode:** Overlay two models (e.g., Tesla Model 3 vs Toyota Camry)
  - Tesla drops 50% in 2 years, Camry drops only 20%

---

### Chart 4: Geographic Arbitrage (Regional Heatmap)

Prices vary significantly by location.

| Property | Value |
|---|---|
| **Data Points** | Average price by ZIP/State |
| **Color Scale** | Green (cheapest) -> Red (most expensive) |

**Features:**
- Identify price gaps across regions (e.g., trucks $4,000 cheaper in Texas vs California)
- **Shipping Calculator overlay:** If (remote price + shipping) < local price -> **GEOGRAPHIC ARBITRAGE** deal

---

### Chart 5: Liquidity / Inventory Turnover (Bar Chart)

Shows market supply/demand dynamics.

| Property | Value |
|---|---|
| **Metric** | Days on Market (DoM) |
| **Visualization** | Sold listings vs New listings per week |

**Signals:**
- Sold > New = **Seller's Market** (prices will rise)
- Inventory piling up = **Buyer's Market** (negotiate hard)

---

## Data Requirements per Chart

| Feature | Data Points Needed | Scraper Priority |
|---|---|---|
| Scatter Plot | Mileage, Price, Trim, VIN | Critical (High Frequency) |
| Volatility | Historic Price, Date Listed | High (Daily snapshots) |
| Heatmap | Location/ZIP, Price | Medium |
| Depreciation | Original MSRP (static), Current Price | Low (Monthly updates) |
| Liquidity | Days on Market, Sold Date | Medium |

---

## Filtering Capabilities

- **Make / Model / Year / Trim** - standard filters
- **"Clean" Filter** - exclude salvage titles, accident history
- **Trim Matcher** - distinguish M-Sport from base (significant price impact)
- **Location / Radius / ZIP** - regional price comparison
- **Price Range / Mileage Range** - narrow down results
- **Condition** - new, used, certified pre-owned

---

## The Nexus AI Advisor (RAG-Powered Chat)

### What Makes This Different

Traditional car sites have search bars. ArbitrageAuto AI has a **persistent chat sidebar** — an AI advisor that doesn't just wait for questions but **proactively alerts** users about opportunities.

The AI connects directly to your live car database + scraped knowledge base (repair guides, forum discussions, expert reviews). It combines **numbers** (from PostgreSQL) with **knowledge** (from Nexus RAG).

### AI Feature 1: Smart Search (Natural Language Filtering)

Instead of clicking 20 filter dropdowns, users just type:

> "I have $25,000 and I want a reliable SUV with a sunroof that isn't white and has a high resale value in 3 years."

**How it works:**
- Nexus parses the intent using the LLM
- Translates to structured DB query (price < 25000, type = SUV, color != white)
- Cross-references with depreciation data for "high resale value"
- Returns top matches ranked by deal score

### AI Feature 2: Market Interpreter (Chart Reading)

The AI can "read" your charts and explain them in plain language.

> **User:** "Is now a good time to buy a Tesla Model 3?"
>
> **AI:** "Our volatility chart shows a 5% price drop in the last 14 days. The 10-day moving average just crossed below the 50-day average, which historically means prices continue falling. I recommend waiting 2 more weeks. Want me to set a watchlist alert?"

**How it works:**
- AI has tool access to `/api/v1/charts/volatility` endpoint
- Queries real-time moving averages and computes signal
- Translates technical indicators into actionable advice

### AI Feature 3: Negotiation Coach

Users are often intimidated by dealerships. The AI becomes their negotiation strategist.

> **User:** "I found a 2018 Ford Focus for $14,000. Is this a good deal?"
>
> **AI:** "This car has been on the market for 47 days (average is 21 days for this model). Our data shows the seller is likely motivated. Also, this model has known dual-clutch transmission issues — check if the TCM has been replaced. Based on market data, a fair price is $11,800. Here's a negotiation script you can use..."

**How it works:**
- Queries listing data: days on market, price vs fair value, deal score
- RAG retrieves known mechanical issues from knowledge base (repair forums, recalls, expert reviews)
- Generates personalized negotiation strategy with specific talking points

### AI Feature 4: Proactive Deal Alerts

The AI doesn't wait for questions — it reaches out.

> **AI:** "Hrach, a 2021 Porsche Macan just hit the market in Texas for $5k below the moving average. The listing says 'moving next week' — this is a motivated seller signal. Based on your watchlist preferences, this matches your criteria. Should I draft a negotiation email for you?"

**How it works:**
- Deal Detector job (7 AM cron) finds matches
- AI enriches alerts with context from RAG (model reliability, common issues)
- Sends via WebSocket to the chat sidebar

### AI Feature 5: Total Cost of Ownership Bot

Price isn't everything. The AI calculates the **real cost** of owning a car.

> **User:** "Compare the total cost of owning a Toyota RAV4 vs Honda CR-V for 3 years"
>
> **AI:** Shows comparison table with purchase price, insurance estimate, fuel costs, expected maintenance, depreciation, and total 3-year cost

**How it works:**
- Purchase price: from your market data
- Depreciation: from your depreciation curves
- Insurance/fuel/maintenance: scraped from comparison sites or API data
- LLM formats into clear comparison

### Knowledge Base (What Nexus RAG Indexes)

Feed these documents into Nexus brains for the AI to reference:

| Knowledge Category | Sources | Purpose |
|---|---|---|
| Mechanical Issues | Reddit r/MechanicAdvice, car forums, NHTSA recalls | Warn about model-specific problems |
| Expert Reviews | Car and Driver, Edmunds, Consumer Reports | Reliability ratings, pros/cons |
| Negotiation Guides | Expert articles, dealer playbooks | Negotiation strategies |
| Insurance Data | Rate comparison sites | Total cost calculations |
| Maintenance Costs | RepairPal, YourMechanic | Predict repair expenses |

---

## The "Command Center" UI Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ArbitrageAuto AI                                    [Alerts 3] [Profile]│
├──────────────────────────────────────────────┬───────────────────────────┤
│                                              │                           │
│  THE "QUANT" VIEW (Left ~65%)                │  THE "ADVISOR" (Right ~35%)│
│                                              │                           │
│  ┌────────────────────────────────────────┐  │  ┌───────────────────────┐│
│  │  🔍 Toyota Camry 2020-2023 | CA | <$30k│  │  │ AI: Based on your    ││
│  └────────────────────────────────────────┘  │  │ filters, I see 23     ││
│                                              │  │ listings. 4 are below ││
│  ┌────────────────────────────────────────┐  │  │ fair value. The best  ││
│  │         SCATTER PLOT                   │  │  │ deal is a 2021 XLE in ││
│  │    $35k ·                              │  │  │ Sacramento — $3,200   ││
│  │         · ·  ·                         │  │  │ below market.         ││
│  │    $30k ·  ·───────── regression       │  │  │                       ││
│  │         ·  · ·  ·  ·                   │  │  │ ⚠️ Note: This model  ││
│  │    $25k    · ·  ·  ·  ·               │  │  │ year has a known oil  ││
│  │         ⭐·    ·  ·  ·                │  │  │ consumption issue.    ││
│  │    $20k          ·  ·                  │  │  │ Ask the seller about  ││
│  │         20k  40k  60k  80k  mileage    │  │  │ it.                   ││
│  └────────────────────────────────────────┘  │  │                       ││
│                                              │  │ ─────────────────────-││
│  ┌──────────────┐ ┌──────────────────────┐  │  │                       ││
│  │ DEPRECIATION │ │    VOLATILITY        │  │  │ You: Is the Camry     ││
│  │   CURVE      │ │  MA10 vs MA50        │  │  │ reliable at 80k mi?   ││
│  │              │ │                      │  │  │                       ││
│  │  ────╲       │ │  ──── Signal: WAIT   │  │  │ [Type a message...]   ││
│  │       ╲──────│ │                      │  │  └───────────────────────┘│
│  └──────────────┘ └──────────────────────┘  │                           │
│                                              │                           │
│  📊 TICKER: Model 3 ↓2.3% | F-150 ↑0.8% | RAV4 ↓1.1%                 │
└──────────────────────────────────────────────┴───────────────────────────┘
```

---

## Hybrid Architecture (Scraper + Nexus)

```
┌──────────────────────────────────────────────────────────────────┐
│                    MICROSERVICES                                  │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │  SCRAPER SERVICE  │  │  NEXUS AI SERVICE │  │  API GATEWAY  │  │
│  │  (NestJS)         │  │  (Python/FastAPI)  │  │  (NestJS)     │  │
│  │                   │  │                    │  │               │  │
│  │  • Playwright     │  │  • Quivr RAG       │  │  • REST API   │  │
│  │  • Cron jobs      │  │  • Brain per topic  │  │  • WebSocket  │  │
│  │  • Proxy rotation │  │  • LLM (Claude)    │  │  • Auth       │  │
│  │  • Data pipeline  │  │  • DB query tools  │  │  • Rate limit │  │
│  └────────┬─────────┘  └────────┬───────────┘  └───────┬───────┘  │
│           │                     │                       │          │
│           └─────────┬───────────┘                       │          │
│                     ▼                                   │          │
│           ┌──────────────────┐                          │          │
│           │   PostgreSQL +   │◄─────────────────────────┘          │
│           │   TimescaleDB    │                                     │
│           └──────────────────┘                                     │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                    ANGULAR FRONTEND                               │
│  ┌───────────────────────────┐  ┌────────────────────────────┐   │
│  │  Charts Dashboard (D3.js) │  │  AI Chat Sidebar (Socket)  │   │
│  └───────────────────────────┘  └────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### How Nexus Connects to Market Data

The AI needs **tools** to query the car database. In Nexus, these become callable functions:

| AI Tool | What It Does | Endpoint Called |
|---|---|---|
| `search_cars` | Find listings matching natural language criteria | `GET /api/v1/market-data` |
| `get_deal_score` | Check if a specific car is a deal | `GET /api/v1/valuations/:vin` |
| `get_market_trend` | Read volatility/moving averages for a model | `GET /api/v1/charts/volatility` |
| `get_depreciation` | How much value a model retains | `GET /api/v1/charts/depreciation` |
| `get_comparables` | Find similar cars in the market | `GET /api/v1/valuations/estimate` |
| `search_issues` | RAG search for known mechanical problems | Nexus brain query |
| `create_watchlist` | Set up deal alerts for the user | `POST /api/v1/watchlists` |

---

## Business Model

| Tier | Price | Target | Features |
|---|---|---|---|
| **Basic** | Free | Casual Buyers | Simple search, current average price, 3 AI questions/day |
| **Pro** | $29/mo | Enthusiasts / Flippers | Unlimited AI chat, deal alerts, historical charts, watchlists, negotiation coaching |
| **Enterprise** | $199/mo | Independent Dealers | API access, inventory gap analysis, bulk data export |
| **Concierge** | $99 one-time | Any buyer | AI analyzes a specific listing: fair price, mechanical risks, negotiation script, total cost of ownership |

---

## Tech Stack

| Component | Technology | Purpose |
|---|---|---|
| Frontend | Angular | "Command Center" dashboard + chat sidebar |
| Charts | D3.js or Highcharts | High-performance data visualization |
| API Gateway | NestJS (Express) | REST API, WebSocket, auth, rate limiting |
| Scraper Service | NestJS + Playwright | Cron jobs, data collection, proxy rotation |
| AI Service (Nexus) | Python FastAPI + Quivr | RAG engine, LLM chat, knowledge retrieval |
| Real-time | Socket.io / WebSocket | Live chat, deal alerts, price ticker |
| Database | PostgreSQL + TimescaleDB | Listings, price history, aggregates |
| Vector Store | Quivr (Faiss/pgvector) | Mechanical issues, expert reviews, guides |
| LLM Provider | Anthropic Claude | Chat intelligence, intent parsing |
| Scraping | Playwright / Puppeteer | Data collection from listing sites |
| Proxy | ScrapingBee / Bright Data | IP rotation, anti-blocking |
| Infra | AWS / Kubernetes | Scalable workers |

---

## Development Roadmap

### Month 1 - Data Foundation
- [ ] Set up PostgreSQL + TimescaleDB schema
- [ ] Build single NestJS scraper for one high-volume site (Autotrader)
- [ ] Data pipeline: validation, deduplication, outlier filtering
- [ ] Basic REST API for market data queries
- [ ] Angular scaffold with scatter plot for one model (e.g., Toyota Camry)

### Month 2 - The Charts
- [ ] Add 3-5 more data sources
- [ ] Depreciation curve and volatility charts
- [ ] Watchlist feature with deal detection
- [ ] Price ticker (WebSocket)

### Month 3 - The AI Advisor (Nexus Integration)
- [ ] Connect Nexus FastAPI service to PostgreSQL (tool functions)
- [ ] Build chat sidebar in Angular (Socket.io)
- [ ] AI tools: `search_cars`, `get_deal_score`, `get_market_trend`
- [ ] Natural language search ("reliable SUV under $25k")
- [ ] Market interpretation ("Is now a good time to buy?")

### Month 4 - Knowledge & Negotiation
- [ ] Index mechanical issue databases into Nexus RAG brains
- [ ] Negotiation coaching feature (days on market + known issues = strategy)
- [ ] Total cost of ownership calculator
- [ ] Proactive deal alerts via chat
- [ ] Geographic heatmap view

### Month 5 - Launch
- [ ] Authentication & user accounts
- [ ] Subscription billing (Stripe)
- [ ] Concierge one-time purchase flow
- [ ] Landing page & pitch deck
- [ ] Beta launch with car enthusiast communities

---

## Competitive Advantage

| vs Competitor | Their Approach | Our Edge |
|---|---|---|
| **CarGurus / Autotrader** | Funded by dealers, show ads | We're buyer-side, data-first |
| **Carvana / Vroom** | Transaction-focused, fixed pricing | We expose the real market, user negotiates |
| **KBB / Edmunds** | Static valuations, updated monthly | Real-time fair value from live scraping |
| **ChatGPT / Generic AI** | No market data, generic answers | RAG with live DB access, specific to the car market |

**The moat:** No one else combines **real-time scraped pricing data** + **RAG-powered AI that can query it**. A user gets both the Bloomberg terminal AND the financial advisor in one product.

---

## What Nexus Brings to This

| Nexus Feature (Already Built) | ArbitrageAuto Use |
|---|---|
| FastAPI backend | AI service layer, ready to deploy |
| Quivr RAG engine | Index repair guides, reviews, recalls for AI retrieval |
| Brain management | Separate brains per topic: "mechanical issues", "negotiation", "market trends" |
| Document upload | Upload expert guides, recall databases, forum archives |
| Streaming (SSE) | Real-time chat responses in the sidebar |
| Conversation history | Persistent chat sessions per user |
| Brain templates | Pre-configured advisor personalities (Negotiator, Analyst, Mechanic) |

---

*Source: Gemini + Claude brainstorming sessions, February 2026*
