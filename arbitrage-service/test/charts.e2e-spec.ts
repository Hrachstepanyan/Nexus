import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('ChartsController (e2e)', () => {
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

  it('/api/v1/charts/scatter (GET) - requires make and model', () => {
    return request(app.getHttpServer())
      .get('/api/v1/charts/scatter')
      .expect(400);
  });

  it('/api/v1/charts/scatter (GET) - returns scatter data', () => {
    return request(app.getHttpServer())
      .get('/api/v1/charts/scatter?make=Toyota&model=Camry')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('points');
        expect(res.body).toHaveProperty('regression');
        expect(res.body).toHaveProperty('stats');
        expect(res.body.regression).toHaveProperty('slope');
        expect(res.body.regression).toHaveProperty('intercept');
        expect(res.body.regression).toHaveProperty('rSquared');
      });
  });
});
