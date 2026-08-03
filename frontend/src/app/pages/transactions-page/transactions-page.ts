import { Component } from '@angular/core';
import { TransactionsPageComponent } from '../../components/transactions-page/transactions-page';

@Component({
  selector: 'app-transactions-page',
  standalone: true,
  imports: [TransactionsPageComponent],
  template: '<app-transactions-list></app-transactions-list>'
})
export class TransactionsPageShellComponent {}
