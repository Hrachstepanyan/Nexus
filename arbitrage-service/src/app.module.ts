import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { DatabaseModule } from './database/database.module';
import { ScraperModule } from './scraper/scraper.module';
import { MarketDataModule } from './market-data/market-data.module';
import { ValuationsModule } from './valuations/valuations.module';
import { ChartsModule } from './charts/charts.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    ScraperModule,
    MarketDataModule,
    ValuationsModule,
    ChartsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
