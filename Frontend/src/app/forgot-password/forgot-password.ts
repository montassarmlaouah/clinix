import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../service/auth-service';

export type RecoveryChannel = 'sms' | 'email';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword implements OnInit, OnDestroy {
  currentStep = 1;

  recoveryChannel: RecoveryChannel = 'sms';

  telephone = '';
  email = '';
  phoneError = '';
  emailError = '';

  verificationCode = '';
  codeError = '';
  countdown = 60;
  canResend = false;
  private countdownInterval: ReturnType<typeof setInterval> | null = null;
  private resetToken = '';

  newPassword = '';
  confirmPassword = '';
  passwordError = '';
  confirmPasswordError = '';
  showPassword = false;
  showConfirmPassword = false;

  passwordStrength = 0;
  passwordStrengthLabel = '';
  hasMinLength = false;
  hasUppercase = false;
  hasLowercase = false;
  hasNumber = false;

  errorMessage = '';
  successMessage = '';
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    const prefilledPhone = this.route.snapshot.queryParamMap.get('telephone');
    if (prefilledPhone) {
      this.telephone = prefilledPhone.replace(/\s/g, '');
    }
    const prefilledEmail = this.route.snapshot.queryParamMap.get('email');
    if (prefilledEmail) {
      this.email = prefilledEmail.trim();
      this.recoveryChannel = 'email';
    }
  }

  ngOnDestroy(): void {
    this.clearCountdown();
  }

  setChannel(ch: RecoveryChannel): void {
    this.recoveryChannel = ch;
    this.clearMessages();
    this.phoneError = '';
    this.emailError = '';
  }

  get maskedPhone(): string {
    if (!this.telephone) return '';
    const phone = this.telephone.replace(/\s/g, '');
    if (phone.length < 4) return phone;
    return phone.slice(0, 4) + '****' + phone.slice(-2);
  }

  get maskedEmail(): string {
    const e = (this.email || '').trim();
    if (!e.includes('@')) return e || '***';
    const [local, domain] = e.split('@');
    if (local.length <= 2) return '*@' + domain;
    return local.slice(0, 2) + '***@' + domain;
  }

  get maskedContact(): string {
    return this.recoveryChannel === 'sms' ? this.maskedPhone : this.maskedEmail;
  }

  get step1Label(): string {
    return this.recoveryChannel === 'sms' ? 'Téléphone' : 'E-mail';
  }

  validatePhone(): boolean {
    this.phoneError = '';
    const phone = this.telephone.replace(/\s/g, '');

    if (!phone) {
      this.phoneError = 'Le numéro de téléphone est requis';
      return false;
    }

    const phoneRegex = /^(\+?216)?[0-9]{8}$/;
    if (!phoneRegex.test(phone)) {
      this.phoneError = 'Format invalide. Ex: 21612345678 ou 12345678';
      return false;
    }

    return true;
  }

  validateEmail(): boolean {
    this.emailError = '';
    const e = (this.email || '').trim();
    if (!e) {
      this.emailError = 'L\'adresse e-mail est requise';
      return false;
    }
    const re = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!re.test(e)) {
      this.emailError = 'Format d\'e-mail invalide';
      return false;
    }
    return true;
  }

  private normalizePhone(): string {
    let normalizedPhone = this.telephone.replace(/\s/g, '').replace(/^\+/, '');
    if (!normalizedPhone.startsWith('216')) {
      normalizedPhone = '216' + normalizedPhone;
    }
    return normalizedPhone;
  }

  sendCode(): void {
    this.clearMessages();

    if (this.recoveryChannel === 'sms') {
      if (!this.validatePhone()) return;
      this.telephone = this.normalizePhone();
    } else {
      if (!this.validateEmail()) return;
      this.email = this.email.trim().toLowerCase();
    }

    this.isLoading = true;
    const payload =
      this.recoveryChannel === 'sms'
        ? { telephone: this.telephone }
        : { email: this.email };

    this.authService.sendForgotPasswordCode(payload).subscribe({
      next: (response: { message?: string; emailSent?: boolean }) => {
        this.isLoading = false;
        this.successMessage = response.message || 'Code de vérification envoyé';
        if (this.recoveryChannel === 'email' && response.emailSent === false) {
          this.successMessage +=
            ' Si vous ne recevez pas d\'e-mail, contactez l\'administrateur (configuration e-mail du serveur).';
        }
        this.currentStep = 2;
        this.startCountdown();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Erreur lors de l\'envoi du code';
      }
    });
  }

  startCountdown(): void {
    this.countdown = 60;
    this.canResend = false;
    this.clearCountdown();

    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        this.canResend = true;
        this.clearCountdown();
      }
    }, 1000);
  }

  clearCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  resendCode(): void {
    this.clearMessages();
    this.isLoading = true;

    const payload =
      this.recoveryChannel === 'sms'
        ? { telephone: this.telephone }
        : { email: this.email };

    this.authService.sendForgotPasswordCode(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Nouveau code envoyé';
        this.startCountdown();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Erreur lors du renvoi du code';
      }
    });
  }

  onCodeInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    if (!/^\d*$/.test(value)) {
      input.value = '';
      return;
    }

    if (value && index < 5) {
      const nextInput = document.getElementById('code-' + (index + 1)) as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }

    this.updateVerificationCode();
  }

  onCodeKeydown(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;

    if (event.key === 'Backspace' && !input.value && index > 0) {
      const prevInput = document.getElementById('code-' + (index - 1)) as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
        prevInput.value = '';
      }
    }
  }

  onCodePaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') || '';
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);

    for (let i = 0; i < 6; i++) {
      const inp = document.getElementById('code-' + i) as HTMLInputElement;
      if (inp) {
        inp.value = digits[i] || '';
      }
    }

    this.updateVerificationCode();
  }

  updateVerificationCode(): void {
    let code = '';
    for (let i = 0; i < 6; i++) {
      const inp = document.getElementById('code-' + i) as HTMLInputElement;
      if (inp) code += inp.value;
    }
    this.verificationCode = code;
  }

  submitCode(): void {
    this.clearMessages();
    this.codeError = '';

    if (this.verificationCode.length !== 6) {
      this.codeError = 'Veuillez entrer le code à 6 chiffres';
      return;
    }

    this.isLoading = true;

    const payload =
      this.recoveryChannel === 'sms'
        ? { telephone: this.telephone, code: this.verificationCode }
        : { email: this.email, code: this.verificationCode };

    this.authService.verifyForgotPasswordCode(payload).subscribe({
      next: (response: { resetToken?: string; message?: string }) => {
        this.isLoading = false;
        this.resetToken = response.resetToken || '';
        this.successMessage = response.message || 'Code vérifié avec succès';
        this.currentStep = 3;
        this.clearCountdown();
      },
      error: (err) => {
        this.isLoading = false;
        this.codeError = err.error?.message || 'Code invalide ou expiré';
      }
    });
  }

  checkPasswordStrength(): void {
    const password = this.newPassword;
    this.hasMinLength = password.length >= 8;
    this.hasUppercase = /[A-Z]/.test(password);
    this.hasLowercase = /[a-z]/.test(password);
    this.hasNumber = /[0-9]/.test(password);

    let strength = 0;
    if (this.hasMinLength) strength++;
    if (this.hasUppercase) strength++;
    if (this.hasLowercase) strength++;
    if (this.hasNumber) strength++;

    this.passwordStrength = strength;

    switch (strength) {
      case 0:
      case 1:
        this.passwordStrengthLabel = 'Faible';
        break;
      case 2:
        this.passwordStrengthLabel = 'Moyen';
        break;
      case 3:
        this.passwordStrengthLabel = 'Bon';
        break;
      case 4:
        this.passwordStrengthLabel = 'Excellent';
        break;
    }
  }

  isPasswordValid(): boolean {
    return this.hasMinLength && this.hasUppercase && this.hasLowercase && this.hasNumber &&
      this.newPassword === this.confirmPassword;
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  submitNewPassword(): void {
    this.clearMessages();
    this.passwordError = '';
    this.confirmPasswordError = '';

    this.checkPasswordStrength();

    if (!this.hasMinLength || !this.hasUppercase || !this.hasLowercase || !this.hasNumber) {
      this.passwordError = 'Le mot de passe ne respecte pas les critères requis';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.confirmPasswordError = 'Les mots de passe ne correspondent pas';
      return;
    }

    this.isLoading = true;

    const payload =
      this.recoveryChannel === 'sms'
        ? { telephone: this.telephone, newPassword: this.newPassword, resetToken: this.resetToken }
        : { email: this.email, newPassword: this.newPassword, resetToken: this.resetToken };

    this.authService.resetForgotPassword(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.currentStep = 4;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Erreur lors de la réinitialisation';
      }
    });
  }

  goBack(): void {
    this.clearMessages();
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}
