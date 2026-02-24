import { PrismaService } from './prisma.service';

/**
 * Sets up TimescaleDB extension and converts tables to hypertables.
 * Run after Prisma migrations to enable time-series features.
 */
export async function setupTimescaleDB(prisma: PrismaService): Promise<void> {
  console.log('Setting up TimescaleDB...');

  // Enable TimescaleDB extension
  await prisma.$executeRawUnsafe(
    `CREATE EXTENSION IF NOT EXISTS timescaledb;`,
  );

  // Convert price_snapshots to hypertable
  try {
    await prisma.$executeRawUnsafe(
      `SELECT create_hypertable('price_snapshots', 'snapshot_date', if_not_exists => TRUE);`,
    );
    console.log('price_snapshots hypertable created');
  } catch (error) {
    console.log('price_snapshots hypertable already exists or skipped');
  }

  // Convert market_aggregates to hypertable
  try {
    await prisma.$executeRawUnsafe(
      `SELECT create_hypertable('market_aggregates', 'computed_date', if_not_exists => TRUE);`,
    );
    console.log('market_aggregates hypertable created');
  } catch (error) {
    console.log('market_aggregates hypertable already exists or skipped');
  }

  console.log('TimescaleDB setup complete');
}
