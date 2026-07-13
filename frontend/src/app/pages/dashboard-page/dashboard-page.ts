import { Component } from '@angular/core';
import { Dashboard } from '../../components/dashboard/dashboard';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [Dashboard],
  template: '<app-dashboard></app-dashboard>'
})
export class DashboardPageComponent {}
