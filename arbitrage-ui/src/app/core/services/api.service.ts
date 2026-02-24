import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MarketDataResponse } from '../models/listing.model';
import { ScatterResponse } from '../models/chart.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = '/api/v1';

  constructor(private http: HttpClient) {}

  getMarketData(params: Record<string, string>): Observable<MarketDataResponse> {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) httpParams = httpParams.set(key, value);
    }
    return this.http
      .get<MarketDataResponse>(`${this.baseUrl}/market-data`, {
        params: httpParams,
      })
      .pipe(catchError(this.handleError));
  }

  getScatterData(
    make: string,
    model: string,
    yearMin?: number,
    yearMax?: number,
  ): Observable<ScatterResponse> {
    let params = new HttpParams()
      .set('make', make)
      .set('model', model);
    if (yearMin) params = params.set('yearMin', String(yearMin));
    if (yearMax) params = params.set('yearMax', String(yearMax));

    return this.http
      .get<ScatterResponse>(`${this.baseUrl}/charts/scatter`, { params })
      .pipe(catchError(this.handleError));
  }

  private handleError(err: HttpErrorResponse): Observable<never> {
    const message =
      err.error?.message ?? err.error?.detail ?? err.message ?? 'An unexpected error occurred';
    return throwError(() => new Error(message));
  }
}
