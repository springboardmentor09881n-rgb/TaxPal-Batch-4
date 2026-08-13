import { Component } from '@angular/core';
import { TaxEstimatorPage as TaxEstimatorPageComponentImpl } from '../../components/tax-estimator-page/tax-estimator-page';

@Component({
  selector: 'app-tax-estimator-page',
  standalone: true,
  imports: [TaxEstimatorPageComponentImpl],
  template: '<app-tax-estimator></app-tax-estimator>'
})
export class TaxEstimatorPageComponent {}
