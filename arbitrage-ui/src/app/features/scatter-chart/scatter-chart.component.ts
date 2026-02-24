import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxEchartsDirective } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { ScatterResponse } from '../../core/models/chart.model';

@Component({
  selector: 'app-scatter-chart',
  standalone: true,
  imports: [CommonModule, NgxEchartsDirective],
  template: `
    <div class="chart-container">
      @if (chartOptions) {
        <div echarts [options]="chartOptions" class="chart"></div>
      } @else {
        <div class="placeholder">Select a Make and Model to view chart</div>
      }
    </div>
  `,
  styles: [
    `
      .chart-container {
        width: 100%;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        padding: 16px;
      }
      .chart {
        width: 100%;
        height: 500px;
      }
      .placeholder {
        height: 500px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #999;
        font-size: 16px;
      }
    `,
  ],
})
export class ScatterChartComponent implements OnChanges {
  @Input() data: ScatterResponse | null = null;

  chartOptions: EChartsOption | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data) {
      this.buildChart();
    }
  }

  private buildChart(): void {
    if (!this.data) return;

    const { points, regression, stats } = this.data;

    // Color by deal score
    const scatterData = points.map((p) => ({
      value: [p.mileage, p.price / 100],
      itemStyle: { color: this.getDealColor(p.dealScore) },
      name: `${p.year} ${p.trim ?? ''}\nVIN: ${p.vin}\nScore: ${p.dealScore}`,
    }));

    // Regression line
    const mileages = points.map((p) => p.mileage);
    const minMileage = Math.min(...mileages, 0);
    const maxMileage = Math.max(...mileages, 150000);
    const regressionLine = [
      [minMileage, (regression.slope * minMileage + regression.intercept) / 100],
      [maxMileage, (regression.slope * maxMileage + regression.intercept) / 100],
    ];

    this.chartOptions = {
      title: {
        text: `Price vs Mileage (${stats.count} listings)`,
        subtext: `Avg: $${(stats.avgPrice / 100).toLocaleString()} | Median: $${(stats.medianPrice / 100).toLocaleString()} | R²: ${regression.rSquared.toFixed(3)}`,
        left: 'center',
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: unknown) => {
          const p = params as { value: number[]; name: string };
          return `Mileage: ${p.value[0].toLocaleString()} mi<br/>Price: $${p.value[1].toLocaleString()}<br/>${p.name}`;
        },
      },
      xAxis: {
        name: 'Mileage',
        nameLocation: 'middle',
        nameGap: 30,
        type: 'value',
        axisLabel: {
          formatter: (val: number) => `${(val / 1000).toFixed(0)}k`,
        },
      },
      yAxis: {
        name: 'Price ($)',
        nameLocation: 'middle',
        nameGap: 60,
        type: 'value',
        axisLabel: {
          formatter: (val: number) => `$${(val / 1000).toFixed(0)}k`,
        },
      },
      dataZoom: [
        { type: 'inside', xAxisIndex: 0 },
        { type: 'inside', yAxisIndex: 0 },
      ],
      series: [
        {
          name: 'Listings',
          type: 'scatter',
          symbolSize: 8,
          data: scatterData,
        },
        {
          name: 'Fair Value Line',
          type: 'line',
          data: regressionLine,
          lineStyle: { color: '#666', type: 'dashed', width: 2 },
          symbol: 'none',
          tooltip: { show: false },
        },
      ],
    };
  }

  private getDealColor(score: number): string {
    if (score >= 50) return '#2e7d32';  // Great deal - green
    if (score >= 20) return '#66bb6a';  // Good deal - light green
    if (score >= -20) return '#ffa726'; // Fair - orange
    if (score >= -50) return '#ef5350'; // Overpriced - red
    return '#b71c1c';                   // Bad deal - dark red
  }
}
