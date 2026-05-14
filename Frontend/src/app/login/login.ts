import { Component } from '@angular/core';
import { AuthService } from '../service/auth-service';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  credentials = { username: '', password: '' };
  error = '';
  isConnected = false;
  showPassword = false;

  constructor(private auth: AuthService, private router: Router) { }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    this.auth.login(this.credentials).subscribe({
      next: () => {
        this.error = '';
        const role = this.auth.getRole();
        const normalizedRole = (role || '').toUpperCase().replace(/-/g, '_');

        if (normalizedRole === 'ROLE_INFIRMIER' || normalizedRole === 'INFIRMIER') {
          this.router.navigate(['/infirmier']);
          return;
        }

        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Login error:', err);
        this.error = "Identifiants incorrects";
      }
    });
  }
}
