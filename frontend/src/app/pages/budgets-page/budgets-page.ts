import { Component } from '@angular/core';
import { BudgetsPageComponent } from '../../components/budgets-page/budgets-page';

@Component({
  selector: 'app-budgets-page-shell',
  standalone: true,
  imports: [BudgetsPageComponent],
  template: '<app-budgets-list></app-budgets-list>'
})
export class BudgetsPageShellComponent {}
