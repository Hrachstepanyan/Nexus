# ArbitrageAuto AI - API Reference

Base URL: `http://localhost:4000`

## Health Check

### GET /health

Returns service health status.

```bash
curl http://localhost:4000/health
```

Response:
```json
{ "status": "ok" }
```

---

## Market Data

### GET /api/v1/market-data

Returns filtered, paginated car listings with market statistics.

**Query Parameters:**

| Parameter | Type   | Default    | Description                           |
|-----------|--------|------------|---------------------------------------|
| make      | string | -          | Filter by make (e.g., "Toyota")       |
| model     | string | -          | Filter by model (e.g., "Camry")       |
| yearMin   | number | -          | Minimum year filter                   |
| yearMax   | number | -          | Maximum year filter                   |
| priceMin  | number | -          | Minimum price in cents                |
| priceMax  | number | -          | Maximum price in cents                |
| state     | string | -          | Filter by US state (e.g., "CA")       |
| page      | number | 1          | Page number                           |
| limit     | number | 25         | Items per page (max 100)              |
| sortBy    | string | createdAt  | Sort field: price, year, mileage, daysOnMarket, createdAt |
| sortOrder | string | desc       | Sort direction: asc, desc             |

```bash
curl "http://localhost:4000/api/v1/market-data?make=Toyota&model=Camry&yearMin=2020"
```

Response:
```json
{
  "listings": [
    {
      "vin": "1HGBH41JXMN109186",
      "make": "Toyota",
      "model": "Camry",
      "year": 2022,
      "trim": "SE",
      "trimNormalized": "SE",
      "price": 2800000,
      "mileage": 35000,
      "city": "Los Angeles",
      "state": "CA",
      "condition": "Good",
      "titleStatus": "Clean",
      "source": "MOCK",
      "daysOnMarket": 15,
      "isActive": true,
      "createdAt": "2026-02-24T00:00:00.000Z",
      "updatedAt": "2026-02-24T00:00:00.000Z"
    }
  ],
  "stats": {
    "avgPrice": 2900000,
    "medianPrice": 2850000,
    "minPrice": 2200000,
    "maxPrice": 3800000,
    "stdDev": 350000,
    "count": 42
  },
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 42,
    "totalPages": 2
  }
}
```

---

## Valuations

### GET /api/v1/valuations/:vin

Returns fair market value, deal score, and comparables for a specific VIN.

```bash
curl http://localhost:4000/api/v1/valuations/1HGBH41JXMN109186
```

Response:
```json
{
  "vin": "1HGBH41JXMN109186",
  "make": "Toyota",
  "model": "Camry",
  "year": 2022,
  "mileage": 35000,
  "actualPrice": 2800000,
  "estimatedPrice": 2900000,
  "dealScore": {
    "score": 28,
    "label": "Good Deal",
    "expectedPrice": 2900000,
    "actualPrice": 2800000,
    "savings": 100000
  },
  "regression": {
    "slope": -8.5,
    "intercept": 3200000,
    "rSquared": 0.72
  },
  "marketSignal": {
    "shortTermMA": 2850000,
    "longTermMA": 2900000,
    "signal": "BUY"
  },
  "comparableCount": 38
}
```

### GET /api/v1/valuations/estimate

Estimates value by make/model/year/mileage without requiring a VIN in the database.

**Query Parameters:**

| Parameter | Type   | Required | Description            |
|-----------|--------|----------|------------------------|
| make      | string | Yes      | Car make               |
| model     | string | Yes      | Car model              |
| year      | number | Yes      | Model year             |
| mileage   | number | Yes      | Current mileage        |

```bash
curl "http://localhost:4000/api/v1/valuations/estimate?make=Toyota&model=Camry&year=2022&mileage=30000"
```

---

## Charts

### GET /api/v1/charts/scatter

Returns scatter plot data (price vs mileage) with regression line and deal scores.

**Query Parameters:**

| Parameter | Type   | Required | Description       |
|-----------|--------|----------|-------------------|
| make      | string | Yes      | Car make          |
| model     | string | Yes      | Car model         |
| yearMin   | number | No       | Minimum year      |
| yearMax   | number | No       | Maximum year      |

```bash
curl "http://localhost:4000/api/v1/charts/scatter?make=Toyota&model=Camry"
```

Response:
```json
{
  "points": [
    {
      "vin": "1HGBH41JXMN109186",
      "price": 2800000,
      "mileage": 35000,
      "year": 2022,
      "trim": "SE",
      "dealScore": 28,
      "daysOnMarket": 15
    }
  ],
  "regression": {
    "slope": -8.5,
    "intercept": 3200000,
    "rSquared": 0.72
  },
  "stats": {
    "avgPrice": 2900000,
    "medianPrice": 2850000,
    "minPrice": 2200000,
    "maxPrice": 3800000,
    "stdDev": 350000,
    "count": 42
  }
}
```

---

## Admin

### POST /admin/scraper/run/:source

Manually trigger a scraper run.

```bash
# Run mock scraper
curl -X POST http://localhost:4000/admin/scraper/run/mock

# Run autotrader scraper
curl -X POST http://localhost:4000/admin/scraper/run/autotrader
```

### POST /admin/scraper/aggregates

Recompute market aggregates.

```bash
curl -X POST http://localhost:4000/admin/scraper/aggregates
```

---

## Swagger UI

Interactive API documentation is available at: `http://localhost:4000/api/docs`

---

## Notes

- All prices are stored and returned in **cents** (e.g., 2800000 = $28,000.00)
- VINs are 17-character alphanumeric strings (no I, O, Q)
- Deal scores range from -100 (terrible) to 100 (amazing)
- Market signals: BUY, HOLD, WAIT based on moving average crossover
