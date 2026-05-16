import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LunaSuccessService {
  private autoTimer?: ReturnType<typeof setTimeout>;

  show(message: string, autoCloseMs = 0): void {
    this.hide();
    const overlay = document.createElement('div');
    overlay.id = 'luna-success-overlay';
    overlay.className = 'luna-success-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = `
      <div class="luna-success-dialog" role="document">
        <div class="luna-success-badge">
          <i class="bi bi-check-lg luna-success-check" aria-hidden="true"></i>
          <span class="luna-success-badge-label">SUCCESS</span>
        </div>
        <p class="luna-success-message">${this.escapeHtml(message)}</p>
        <button type="button" class="luna-success-ok">OK</button>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.hide();
    });
    overlay.querySelector('.luna-success-ok')?.addEventListener('click', () => this.hide());
    if (autoCloseMs > 0) {
      this.autoTimer = setTimeout(() => this.hide(), autoCloseMs);
    }
  }

  hide(): void {
    if (this.autoTimer) {
      clearTimeout(this.autoTimer);
      this.autoTimer = undefined;
    }
    document.getElementById('luna-success-overlay')?.remove();
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
