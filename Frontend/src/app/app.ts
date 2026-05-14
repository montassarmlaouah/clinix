import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './service/auth-service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('Gestion Biblio');
  isConnected = false;

  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    this.isConnected = !!this.auth.getToken();
    console.log('App initialized - Connected:', this.isConnected);
  }
}
