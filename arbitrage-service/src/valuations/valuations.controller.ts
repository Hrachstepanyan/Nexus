import {
  Controller,
  Get,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ValuationsService } from './valuations.service';
import { z } from 'zod';

const EstimateQuerySchema = z.object({
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.coerce.number().int().min(1900).max(2030),
  mileage: z.coerce.number().int().min(0),
});

@Controller('api/v1/valuations')
export class ValuationsController {
  constructor(private valuationsService: ValuationsService) {}

  @Get('estimate')
  async estimateValue(@Query() query: Record<string, string>) {
    const parsed = EstimateQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }
    return this.valuationsService.estimateValue(parsed.data);
  }

  @Get(':vin')
  async getValuation(@Param('vin') vin: string) {
    if (!vin || vin.length !== 17) {
      throw new BadRequestException('VIN must be exactly 17 characters');
    }
    return this.valuationsService.getValuationByVIN(vin);
  }
}
