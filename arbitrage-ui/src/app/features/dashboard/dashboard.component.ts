import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { take } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';
import { ScatterResponse } from '../../core/models/chart.model';
import { ScatterChartComponent } from '../scatter-chart/scatter-chart.component';

const MAKES_MODELS: Record<string, string[]> = {
  Toyota: ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Tacoma'],
  Honda: ['Civic', 'Accord', 'CR-V', 'Pilot'],
  BMW: ['3 Series', '5 Series', 'X3', 'X5'],
  'Mercedes-Benz': ['C-Class', 'E-Class', 'GLC', 'GLE'],
  Ford: ['F-150', 'Mustang', 'Explorer', 'Escape'],
  Chevrolet: ['Silverado', 'Camaro', 'Equinox', 'Tahoe'],
  Audi: ['A4', 'A6', 'Q5', 'Q7'],
  Lexus: ['RX', 'ES', 'NX', 'IS'],
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    ScatterChartComponent,
  ],
  template: `
    <div class="dashboard">
      <mat-card class="filters-card">
        <mat-card-content>
          <div class="filters-row">
            <mat-form-field appearance="outline">
              <mat-label>Make</mat-label>
              <mat-select [(ngModel)]="selectedMake" (selectionChange)="onMakeChange()">
                @for (make of makes; track make) {
                  <mat-option [value]="make">{{ make }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Model</mat-label>
              <mat-select [(ngModel)]="selectedModel" [disabled]="!selectedMake">
                @for (model of availableModels; track model) {
                  <mat-option [value]="model">{{ model }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Year Min</mat-label>
              <mat-select [(ngModel)]="yearMin">
                <mat-option [value]="null">Any</mat-option>
                @for (year of years; track year) {
                  <mat-option [value]="year">{{ year }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Year Max</mat-label>
              <mat-select [(ngModel)]="yearMax">
                <mat-option [value]="null">Any</mat-option>
                @for (year of years; track year) {
                  <mat-option [value]="year">{{ year }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <button
              mat-raised-button
              color="primary"
              [disabled]="!selectedMake || !selectedModel || loading"
              (click)="search()"
            >
              @if (loading) {
                <mat-spinner diameter="20"></mat-spinner>
              } @else {
                Search
              }
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      @if (scatterData) {
        <div class="stats-row">
          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-value">{{ scatterData.stats.count }}</div>
              <div class="stat-label">Listings</div>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-value">\${{ formatPrice(scatterData.stats.avgPrice) }}</div>
              <div class="stat-label">Avg Price</div>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-value">\${{ formatPrice(scatterData.stats.medianPrice) }}</div>
              <div class="stat-label">Median Price</div>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-value">{{ scatterData.regression.rSquared.toFixed(3) }}</div>
              <div class="stat-label">R-Squared</div>
            </mat-card-content>
          </mat-card>
        </div>
      }

      <app-scatter-chart [data]="scatterData"></app-scatter-chart>

      @if (error) {
        <mat-card class="error-card">
          <mat-card-content>{{ error }}</mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [
    `
      .dashboard {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }
      .filters-card {
        position: sticky;
        top: 0;
        z-index: 10;
      }
      .filters-row {
        display: flex;
        gap: 16px;
        align-items: center;
        flex-wrap: wrap;
      }
      .filters-row mat-form-field {
        flex: 1;
        min-width: 150px;
      }
      .stats-row {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
      }
      .stat-card {
        text-align: center;
      }
      .stat-value {
        font-size: 24px;
        font-weight: 500;
        color: #1976d2;
      }
      .stat-label {
        font-size: 12px;
        color: #666;
        text-transform: uppercase;
        margin-top: 4px;
      }
      .error-card {
        background-color: #ffebee;
        color: #c62828;
      }
    `,
  ],
})
export class DashboardComponent {
  makes = Object.keys(MAKES_MODELS);
  availableModels: string[] = [];
  years = Array.from({ length: 8 }, (_, i) => 2025 - i);

  selectedMake: string | null = null;
  selectedModel: string | null = null;
  yearMin: number | null = null;
  yearMax: number | null = null;

  scatterData: ScatterResponse | null = null;
  loading = false;
  error: string | null = null;

  constructor(private apiService: ApiService) {}

  onMakeChange(): void {
    this.selectedModel = null;
    this.availableModels = this.selectedMake
      ? MAKES_MODELS[this.selectedMake] ?? []
      : [];
  }

  search(): void {
    if (!this.selectedMake || !this.selectedModel) return;

    this.loading = true;
    this.error = null;

    this.apiService
      .getScatterData(
        this.selectedMake,
        this.selectedModel,
        this.yearMin ?? undefined,
        this.yearMax ?? undefined,
      )
      .pipe(take(1))
      .subscribe({
        next: (data) => {
          this.scatterData = data;
          this.loading = false;
        },
        error: (err) => {
          this.error = err.message ?? 'Failed to load data';
          this.loading = false;
        },
      });
  }

  formatPrice(cents: number): string {
    return (cents / 100).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }
}
