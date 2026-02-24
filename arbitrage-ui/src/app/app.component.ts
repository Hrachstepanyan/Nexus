import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/components/header/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent],
  template: `
    <app-header></app-header>
    <main class="container">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [
    `
      main {
        padding-top: 24px;
        padding-bottom: 48px;
      }
    `,
  ],
})
export class AppComponent {}
