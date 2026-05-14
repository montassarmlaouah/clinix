import { Injectable } from '@angular/core';
import * as bootstrap from 'bootstrap';



@Injectable({
  providedIn: 'root',
})
export class ToastService {

  show(message: string, type: 'success' | 'danger' = 'success',
    duration = 3000) {
    // Créer le conteneur global s'il n'existe pas
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'position-fixed p-3';
      container.style.top = '40px'; // décalage depuis le haut
      container.style.left = '0px';
      container.style.zIndex = '1055';
      document.body.appendChild(container);
    }

    // Créer le toast avec bouton fermer
    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center text-bg-${type} border-0`;
    toastEl.role = 'alert';
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');

    toastEl.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" aria-label="Fermer"></button>
      </div>
    `;

    container.appendChild(toastEl);

    // Fermer le toast au clic sur le bouton
    const btnClose = toastEl.querySelector('button');
    btnClose?.addEventListener('click', () => {
      bootstrap.Toast.getInstance(toastEl)?.hide();
    });

    // Afficher le toast avec Bootstrap JS
    const toast = new bootstrap.Toast(toastEl, { delay: duration });
    toast.show();

    // Supprimer du DOM après disparition
    toastEl.addEventListener('hidden.bs.toast', () => {
      toastEl.remove();
    });
  }

  showSuccess(message: string) {
    this.show(message, 'success');
  }

  showError(message: string) {
    this.show(message, 'danger');
  }
}
