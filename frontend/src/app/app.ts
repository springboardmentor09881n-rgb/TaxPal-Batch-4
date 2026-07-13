import { Component, computed, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly isLoggedIn = computed(() => !!this.authService.currentUser());

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.restoreSession();
  }
}
