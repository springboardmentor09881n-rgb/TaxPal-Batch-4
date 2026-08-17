import { Component } from '@angular/core';
import { ReportsComponent } from '../../components/reports-page/reports-page';

@Component({
  selector: 'app-reports-page-shell',
  standalone: true,
  imports: [ReportsComponent],
  template: '<app-reports></app-reports>'
})
export class ReportsPageShellComponent {}
