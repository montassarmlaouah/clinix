import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../service/auth-service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer implements OnInit {

  constructor(public auth: AuthService) { }

  ngOnInit() {
    console.log('Footer - User role:', this.auth.getRole());
    console.log('Footer - Is logged in:', this.auth.getToken());
  }
}
