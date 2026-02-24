import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('MarketDataController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/v1/market-data (GET) - returns paginated listings', () => {
    return request(app.getHttpServer())
      .get('/api/v1/market-data')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('listings');
        expect(res.body).toHaveProperty('stats');
        expect(res.body).toHaveProperty('pagination');
        expect(res.body.pagination).toHaveProperty('page', 1);
        expect(res.body.pagination).toHaveProperty('limit', 25);
      });
  });

  it('/api/v1/market-data (GET) - filters by make', () => {
    return request(app.getHttpServer())
      .get('/api/v1/market-data?make=Toyota')
      .expect(200)
      .expect((res) => {
        for (const listing of res.body.listings) {
          expect(listing.make.toLowerCase()).toBe('toyota');
        }
      });
  });

  it('/api/v1/market-data (GET) - validates page params', () => {
    return request(app.getHttpServer())
      .get('/api/v1/market-data?page=0')
      .expect(400);
  });
});
