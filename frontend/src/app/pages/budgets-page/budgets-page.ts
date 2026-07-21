import { Component } from '@angular/core';
import { BudgetsPage as BudgetsPageComponentImpl } from '../../components/budgets-page/budgets-page';

@Component({
  selector: 'app-budgets-page',
  standalone: true,
  imports: [BudgetsPageComponentImpl],
  template: '<app-budgets></app-budgets>'
})
export class BudgetsPageComponent {}
