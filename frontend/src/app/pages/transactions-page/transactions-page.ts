import { Component } from '@angular/core';
import { TransactionsPage as TransactionsPageComponentImpl } from '../../components/transactions-page/transactions-page';

@Component({
  selector: 'app-transactions-page',
  standalone: true,
  imports: [TransactionsPageComponentImpl],
  template: '<app-transactions></app-transactions>'
})
export class TransactionsPageComponent {}
