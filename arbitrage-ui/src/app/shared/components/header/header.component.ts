import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MatToolbarModule],
  template: `
    <mat-toolbar color="primary">
      <span>ArbitrageAuto AI</span>
      <span class="spacer"></span>
      <span class="subtitle">Car Market Intelligence</span>
    </mat-toolbar>
  `,
  styles: [
    `
      .spacer {
        flex: 1 1 auto;
      }
      .subtitle {
        font-size: 14px;
        opacity: 0.8;
      }
    `,
  ],
})
export class HeaderComponent {}
