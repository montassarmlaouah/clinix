import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../service/auth-service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword implements OnInit, OnDestroy {
  // Navigation entre étapes
  currentStep = 1;

  // Étape 1: Téléphone
  telephone = '';
  phoneError = '';

  // Étape 2: Code de vérification
  verificationCode = '';
  codeError = '';
  countdown = 60;
  canResend = false;
  private countdownInterval: any;
  private resetToken = ''; // Token reçu après vérification du code

  // Étape 3: Nouveau mot de passe
  newPassword = '';
  confirmPassword = '';
  passwordError = '';
  confirmPasswordError = '';
  showPassword = false;
  showConfirmPassword = false;

  // Indicateurs de force du mot de passe
  passwordStrength = 0;
  passwordStrengthLabel = '';
  hasMinLength = false;
  hasUppercase = false;
  hasLowercase = false;
  hasNumber = false;

  // Messages
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    // Écouter les changements de mot de passe
    const prefilledPhone = this.route.snapshot.queryParamMap.get('telephone');
    if (prefilledPhone) {
      this.telephone = prefilledPhone.replace(/\s/g, '');
    }
  }

  ngOnDestroy(): void {
    this.clearCountdown();
  }

  // Masque le numéro de téléphone pour l'affichage
  get maskedPhone(): string {
    if (!this.telephone) return '';
    const phone = this.telephone.replace(/\s/g, '');
    if (phone.length < 4) return phone;
    return phone.slice(0, 4) + '****' + phone.slice(-2);
  }

  // Validation du téléphone
  validatePhone(): boolean {
    this.phoneError = '';
    const phone = this.telephone.replace(/\s/g, '');

    if (!phone) {
      this.phoneError = 'Le numéro de téléphone est requis';
      return false;
    }

    // Format tunisien: 216 suivi de 8 chiffres, +216 suivi de 8 chiffres, ou juste 8 chiffres
    const phoneRegex = /^(\+?216)?[0-9]{8}$/;
    if (!phoneRegex.test(phone)) {
      this.phoneError = 'Format invalide. Ex: 21612345678 ou 12345678';
      return false;
    }

    return true;
  }

  // Étape 1: Soumettre le numéro de téléphone
  submitPhone(): void {
    this.clearMessages();

    if (!this.validatePhone()) return;

    this.isLoading = true;

    // Normaliser le téléphone au format 216XXXXXXXX
    let normalizedPhone = this.telephone.replace(/\s/g, '').replace(/^\+/, '');
    if (!normalizedPhone.startsWith('216')) {
      normalizedPhone = '216' + normalizedPhone;
    }
    this.telephone = normalizedPhone;

    this.authService.sendVerificationCode(this.telephone).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.successMessage = response.message || 'Code de vérification envoyé';
        this.currentStep = 2;
        this.startCountdown();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Erreur lors de l\'envoi du code';
      }
    });
  }

  // Gestion du countdown pour renvoyer le code
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

  // Renvoyer le code
  resendCode(): void {
    this.clearMessages();
    this.isLoading = true;

    this.authService.sendVerificationCode(this.telephone).subscribe({
      next: (response: any) => {
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

  // Gestion de la saisie du code de vérification
  onCodeInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Ne garder que les chiffres
    if (!/^\d*$/.test(value)) {
      input.value = '';
      return;
    }

    // Passer au champ suivant
    if (value && index < 5) {
      const nextInput = document.getElementById('code-' + (index + 1)) as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }

    this.updateVerificationCode();
  }

  onCodeKeydown(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;

    // Retour arrière
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
      const input = document.getElementById('code-' + i) as HTMLInputElement;
      if (input) {
        input.value = digits[i] || '';
      }
    }

    this.updateVerificationCode();
  }

  updateVerificationCode(): void {
    let code = '';
    for (let i = 0; i < 6; i++) {
      const input = document.getElementById('code-' + i) as HTMLInputElement;
      if (input) code += input.value;
    }
    this.verificationCode = code;
  }

  // Étape 2: Vérifier le code
  submitCode(): void {
    this.clearMessages();
    this.codeError = '';

    if (this.verificationCode.length !== 6) {
      this.codeError = 'Veuillez entrer le code à 6 chiffres';
      return;
    }

    this.isLoading = true;

    this.authService.verifyCode(this.telephone, this.verificationCode).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.resetToken = response.resetToken || '';
        this.successMessage = 'Code vérifié avec succès';
        this.currentStep = 3;
        this.clearCountdown();
      },
      error: (err) => {
        this.isLoading = false;
        this.codeError = err.error?.message || 'Code invalide ou expiré';
      }
    });
  }

  // Validation du mot de passe
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

  // Étape 3: Soumettre le nouveau mot de passe
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

    this.authService.resetPassword(this.telephone, this.newPassword, this.resetToken).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.currentStep = 4;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Erreur lors de la réinitialisation';
      }
    });
  }

  // Retour à l'étape précédente
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
