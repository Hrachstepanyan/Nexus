import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MAKES_MODELS: Array<{ make: string; models: string[] }> = [
  { make: 'Toyota', models: ['Camry', 'Corolla', 'RAV4', 'Highlander'] },
  { make: 'Honda', models: ['Civic', 'Accord', 'CR-V', 'Pilot'] },
  { make: 'BMW', models: ['3 Series', '5 Series', 'X3', 'X5'] },
  { make: 'Mercedes-Benz', models: ['C-Class', 'E-Class', 'GLC', 'GLE'] },
];

const STATES = ['CA', 'TX', 'FL', 'NY', 'IL', 'PA', 'OH', 'GA', 'NC', 'WA'];
const TRIMS = ['BASE', 'SPORT', 'LIMITED', 'PREMIUM', 'SE', 'XLE'];
const CONDITIONS = ['Excellent', 'Good', 'Fair'];
const TITLE_STATUSES = ['Clean', 'Salvage', 'Rebuilt'];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateVIN(): string {
  const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
  let vin = '';
  for (let i = 0; i < 17; i++) {
    vin += chars[Math.floor(Math.random() * chars.length)];
  }
  return vin;
}

async function main() {
  console.log('Seeding database...');

  const listings = [];
  for (let i = 0; i < 200; i++) {
    const makeModel = randomElement(MAKES_MODELS);
    const model = randomElement(makeModel.models);
    const year = randomInt(2018, 2025);
    const mileage = randomInt(5000, 120000);
    // Correlated pricing: newer year and lower mileage → higher price
    const basePriceDollars = 15000 + (year - 2018) * 3000 - mileage * 0.05;
    const jitter = basePriceDollars * (Math.random() * 0.3 - 0.15);
    const basePrice = Math.max(500000, Math.round((basePriceDollars + jitter) * 100));
    const trim = randomElement(TRIMS);

    listings.push({
      vin: generateVIN(),
      make: makeModel.make,
      model: model,
      year: year,
      trim: trim,
      trimNormalized: trim,
      price: basePrice,
      mileage: mileage,
      city: `City${randomInt(1, 50)}`,
      state: randomElement(STATES),
      zipCode: `${randomInt(10000, 99999)}`,
      condition: randomElement(CONDITIONS),
      titleStatus: randomElement(TITLE_STATUSES),
      source: 'MOCK',
      sourceUrl: null,
      daysOnMarket: randomInt(1, 90),
      isActive: true,
    });
  }

  for (const listing of listings) {
    await prisma.listing.upsert({
      where: { vin: listing.vin },
      update: listing,
      create: listing,
    });
  }

  console.log(`Seeded ${listings.length} listings`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
