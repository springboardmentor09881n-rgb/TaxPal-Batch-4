import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Login } from '../../components/login/login';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [Login],
  template: '<app-login (navigateToSignup)="goToSignup()"></app-login>'
})
export class LoginPageComponent {
  constructor(private router: Router, private authService: AuthService) {}

  goToSignup(): void {
    this.router.navigate(['/signup']);
  }
}
