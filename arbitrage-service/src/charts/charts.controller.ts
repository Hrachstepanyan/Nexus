import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ChartsService } from './charts.service';
import { ScatterQuerySchema } from './dto/scatter-query.dto';

@Controller('api/v1/charts')
export class ChartsController {
  constructor(private chartsService: ChartsService) {}

  @Get('scatter')
  async getScatter(@Query() query: Record<string, string>) {
    const parsed = ScatterQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }
    return this.chartsService.getScatterData(parsed.data);
  }
}
