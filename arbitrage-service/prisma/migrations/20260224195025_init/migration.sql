-- CreateTable
CREATE TABLE "listings" (
    "vin" VARCHAR(17) NOT NULL,
    "make" VARCHAR(50) NOT NULL,
    "model" VARCHAR(50) NOT NULL,
    "year" INTEGER NOT NULL,
    "trim" VARCHAR(100),
    "trim_normalized" VARCHAR(50),
    "price" INTEGER NOT NULL,
    "mileage" INTEGER NOT NULL,
    "city" VARCHAR(100),
    "state" VARCHAR(2),
    "zip_code" VARCHAR(10),
    "condition" VARCHAR(20),
    "title_status" VARCHAR(20),
    "source" VARCHAR(30) NOT NULL,
    "source_url" VARCHAR(500),
    "days_on_market" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listings_pkey" PRIMARY KEY ("vin")
);

-- CreateTable
CREATE TABLE "price_snapshots" (
    "id" SERIAL NOT NULL,
    "vin" VARCHAR(17) NOT NULL,
    "price" INTEGER NOT NULL,
    "mileage" INTEGER NOT NULL,
    "source" VARCHAR(30) NOT NULL,
    "snapshot_date" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "price_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_aggregates" (
    "id" SERIAL NOT NULL,
    "make" VARCHAR(50) NOT NULL,
    "model" VARCHAR(50) NOT NULL,
    "year" INTEGER NOT NULL,
    "trim" VARCHAR(50),
    "region" VARCHAR(50),
    "avg_price" INTEGER NOT NULL,
    "median_price" INTEGER NOT NULL,
    "min_price" INTEGER NOT NULL,
    "max_price" INTEGER NOT NULL,
    "std_dev" DOUBLE PRECISION NOT NULL,
    "listing_count" INTEGER NOT NULL,
    "computed_date" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "market_aggregates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sold_listings" (
    "id" SERIAL NOT NULL,
    "vin" VARCHAR(17) NOT NULL,
    "make" VARCHAR(50) NOT NULL,
    "model" VARCHAR(50) NOT NULL,
    "year" INTEGER NOT NULL,
    "sold_price" INTEGER NOT NULL,
    "mileage" INTEGER NOT NULL,
    "source" VARCHAR(30) NOT NULL,
    "sold_date" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "sold_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_watchlists" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "make" VARCHAR(50) NOT NULL,
    "model" VARCHAR(50),
    "year_min" INTEGER,
    "year_max" INTEGER,
    "price_max" INTEGER,
    "mileage_max" INTEGER,
    "location" VARCHAR(100),
    "radius" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_watchlists_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "listings_make_model_year_idx" ON "listings"("make", "model", "year");

-- CreateIndex
CREATE INDEX "listings_make_model_year_trim_normalized_idx" ON "listings"("make", "model", "year", "trim_normalized");

-- CreateIndex
CREATE INDEX "listings_state_idx" ON "listings"("state");

-- CreateIndex
CREATE INDEX "listings_price_idx" ON "listings"("price");

-- CreateIndex
CREATE INDEX "listings_is_active_idx" ON "listings"("is_active");

-- CreateIndex
CREATE INDEX "listings_source_idx" ON "listings"("source");

-- CreateIndex
CREATE INDEX "price_snapshots_vin_snapshot_date_idx" ON "price_snapshots"("vin", "snapshot_date");

-- CreateIndex
CREATE INDEX "price_snapshots_snapshot_date_idx" ON "price_snapshots"("snapshot_date");

-- CreateIndex
CREATE INDEX "market_aggregates_make_model_year_idx" ON "market_aggregates"("make", "model", "year");

-- CreateIndex
CREATE INDEX "market_aggregates_make_model_year_trim_idx" ON "market_aggregates"("make", "model", "year", "trim");

-- CreateIndex
CREATE INDEX "market_aggregates_computed_date_idx" ON "market_aggregates"("computed_date");

-- CreateIndex
CREATE INDEX "sold_listings_vin_idx" ON "sold_listings"("vin");

-- CreateIndex
CREATE INDEX "sold_listings_make_model_year_idx" ON "sold_listings"("make", "model", "year");

-- CreateIndex
CREATE INDEX "sold_listings_sold_date_idx" ON "sold_listings"("sold_date");

-- CreateIndex
CREATE INDEX "user_watchlists_user_id_idx" ON "user_watchlists"("user_id");

-- AddForeignKey
ALTER TABLE "price_snapshots" ADD CONSTRAINT "price_snapshots_vin_fkey" FOREIGN KEY ("vin") REFERENCES "listings"("vin") ON DELETE CASCADE ON UPDATE CASCADE;
