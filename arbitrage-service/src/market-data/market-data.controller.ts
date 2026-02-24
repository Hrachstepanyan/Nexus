import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { MarketDataService } from './market-data.service';
import { MarketDataQuerySchema } from './dto/market-data-query.dto';

@Controller('api/v1/market-data')
export class MarketDataController {
  constructor(private marketDataService: MarketDataService) {}

  @Get()
  async getMarketData(@Query() query: Record<string, string>) {
    const parsed = MarketDataQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }
    return this.marketDataService.getMarketData(parsed.data);
  }
}
