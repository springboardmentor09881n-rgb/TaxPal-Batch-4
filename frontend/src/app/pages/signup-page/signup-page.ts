import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Signup } from '../../components/signup/signup';

@Component({
  selector: 'app-signup-page',
  standalone: true,
  imports: [Signup],
  template: '<app-signup (navigateToLogin)="goToLogin()"></app-signup>'
})
export class SignupPageComponent {
  constructor(private router: Router) {}

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
