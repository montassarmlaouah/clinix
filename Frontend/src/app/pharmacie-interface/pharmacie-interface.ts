import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../service/auth-service';

interface MedicamentLite {
  id: string;
  nom: string;
  description?: string;
}

interface StockLite {
  id: string;
  quantite: number;
  lot: string;
  seuilAlerte: number;
  dateExpiration: string;
  medicament?: MedicamentLite;
}

interface BonEntreeLite {
  id: string;
  medicamentNom: string;
  quantite: number;
  lot: string;
  dateEntree: string;
}

interface DemandeMedicamentLite {
  id: string;
  statut: string;
  notes?: string;
  dateCreation?: string;
  patient?: { nom?: string; prenom?: string; numeroPatient?: string };
  demandeur?: { nom?: string; prenom?: string };
  items?: Array<{
    quantite: number;
    instructions?: string;
    medicament?: { nom?: string };
  }>;
}

@Component({
  selector: 'app-pharmacie-interface',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pharmacie-interface.html',
  styleUrl: './pharmacie-interface.css',
})
export class PharmacieInterfaceComponent implements OnInit {
  private api = 'http://localhost:8080/api';

  activeTab: 'medicaments' | 'stocks' | 'alertes' | 'bons-entree' | 'demandes' = 'medicaments';

  medicaments: MedicamentLite[] = [];
  stocks: StockLite[] = [];
  alertesStockBas: StockLite[] = [];
  bonsEntree: BonEntreeLite[] = [];
  demandesMedicaments: DemandeMedicamentLite[] = [];

  loading = false;
  error = '';
  success = '';

  showMedicamentModal = false;
  editingMedicamentId: string | null = null;
  medicamentForm: { nom: string; description: string } = { nom: '', description: '' };

  showStockModal = false;
  editingStockId: string | null = null;
  stockForm: {
    medicamentId: string;
    quantite: number;
    lot: string;
    seuilAlerte: number;
    dateExpiration: string;
  } = {
    medicamentId: '',
    quantite: 0,
    lot: '',
    seuilAlerte: 10,
    dateExpiration: '',
  };

  showMouvementModal = false;
  mouvementType: 'entree' | 'sortie' = 'entree';
  mouvementStock: StockLite | null = null;
  mouvementQuantite = 1;

  showBonEntreeModal = false;
  bonEntreeForm: { medicamentId: string; quantite: number; lot: string; dateEntree: string } = {
    medicamentId: '',
    quantite: 1,
    lot: '',
    dateEntree: '',
  };

  constructor(private http: HttpClient, private auth: AuthService) {}

  ngOnInit(): void {
    this.reloadAll();
  }

  reloadAll(): void {
    this.loading = true;
    this.clearMessages();
    this.chargerMedicaments();
    this.chargerStocks();
    this.chargerDemandesMedicaments();
  }

  get cliniqueId(): string | null {
    return this.auth.getCliniqueId();
  }

  private clearMessages(): void {
    this.error = '';
    this.success = '';
  }

  chargerMedicaments(): void {
    this.http.get<MedicamentLite[]>(`${this.api}/medicaments`).subscribe({
      next: (res) => {
        this.medicaments = res ?? [];
      },
      error: () => {
        this.error = 'Erreur lors du chargement des médicaments.';
      },
    });
  }

  chargerStocks(): void {
    const cid = this.cliniqueId;
    const params = cid ? { cliniqueId: cid } : undefined;
    this.http.get<StockLite[]>(`${this.api}/stocks`, { params }).subscribe({
      next: (res) => {
        this.stocks = res ?? [];
        this.loading = false;
        this.chargerAlertesStockBas();
      },
      error: () => {
        this.loading = false;
        this.error = 'Erreur lors du chargement des stocks.';
      },
    });
  }

  chargerAlertesStockBas(): void {
    const cid = this.cliniqueId;
    const params = cid ? { cliniqueId: cid } : undefined;
    this.http.get<StockLite[]>(`${this.api}/stocks/bas`, { params }).subscribe({
      next: (res) => {
        this.alertesStockBas = res ?? [];
      },
      error: () => {
        this.alertesStockBas = [];
      },
    });
  }

  renvoyerAlerteEmail(stock: StockLite): void {
    if (!stock.id) return;
    this.clearMessages();
    this.http.post(`${this.api}/stocks/${stock.id}/alerte-email`, {}).subscribe({
      next: () => {
        this.success = 'Alerte e-mail renvoyée aux pharmaciens et administrateurs.';
      },
      error: (err: { error?: { message?: string } }) => {
        this.error = err?.error?.message || 'Envoi de l\'alerte e-mail impossible.';
      },
    });
  }

  chargerDemandesMedicaments(): void {
    const cid = this.cliniqueId;
    const params = cid ? { cliniqueId: cid } : undefined;
    this.http.get<DemandeMedicamentLite[]>(`${this.api}/demandes-medicament/en-attente`, { params }).subscribe({
      next: (res) => {
        this.demandesMedicaments = res ?? [];
      },
      error: () => {
        this.demandesMedicaments = [];
      },
    });
  }

  changerStatutDemande(id: string, statut: 'DELIVREE' | 'PARTIELLE' | 'REFUSEE'): void {
    this.http.patch<DemandeMedicamentLite>(`${this.api}/demandes-medicament/${id}/statut`, { statut }).subscribe({
      next: () => {
        this.success = `Demande marquée ${statut.toLowerCase()}.`;
        this.chargerDemandesMedicaments();
      },
      error: () => {
        this.error = 'Impossible de mettre à jour le statut de la demande.';
      }
    });
  }

  patientLabel(d: DemandeMedicamentLite): string {
    const nom = d.patient?.nom || '';
    const prenom = d.patient?.prenom || '';
    return `${nom} ${prenom}`.trim() || '—';
  }

  ouvrirMedicamentModal(m?: MedicamentLite): void {
    this.clearMessages();
    if (m) {
      this.editingMedicamentId = m.id;
      this.medicamentForm = { nom: m.nom ?? '', description: m.description ?? '' };
    } else {
      this.editingMedicamentId = null;
      this.medicamentForm = { nom: '', description: '' };
    }
    this.showMedicamentModal = true;
  }

  enregistrerMedicament(): void {
    if (!this.medicamentForm.nom.trim()) {
      this.error = 'Le nom du médicament est obligatoire.';
      return;
    }

    const payload = {
      nom: this.medicamentForm.nom.trim(),
      description: this.medicamentForm.description.trim() || null,
    };

    const req$ = this.editingMedicamentId
      ? this.http.put(`${this.api}/medicaments/${this.editingMedicamentId}`, payload)
      : this.http.post(`${this.api}/medicaments`, payload);

    req$.subscribe({
      next: () => {
        this.success = this.editingMedicamentId ? 'Médicament modifié.' : 'Médicament ajouté.';
        this.showMedicamentModal = false;
        this.chargerMedicaments();
      },
      error: () => {
        this.error = 'Impossible d’enregistrer le médicament.';
      },
    });
  }

  supprimerMedicament(id: string): void {
    if (!confirm('Supprimer ce médicament ?')) return;
    this.http.delete(`${this.api}/medicaments/${id}`).subscribe({
      next: () => {
        this.success = 'Médicament supprimé.';
        this.chargerMedicaments();
      },
      error: () => {
        this.error = 'Suppression impossible.';
      },
    });
  }

  ouvrirStockModal(s?: StockLite): void {
    this.clearMessages();
    if (s) {
      this.editingStockId = s.id;
      this.stockForm = {
        medicamentId: s.medicament?.id ?? '',
        quantite: s.quantite ?? 0,
        lot: s.lot ?? '',
        seuilAlerte: s.seuilAlerte ?? 10,
        dateExpiration: s.dateExpiration ? String(s.dateExpiration).slice(0, 10) : '',
      };
    } else {
      this.editingStockId = null;
      this.stockForm = {
        medicamentId: '',
        quantite: 0,
        lot: '',
        seuilAlerte: 10,
        dateExpiration: '',
      };
    }
    this.showStockModal = true;
  }

  enregistrerStock(): void {
    if (!this.stockForm.medicamentId) {
      this.error = 'Sélectionne un médicament.';
      return;
    }

    const payload: Record<string, unknown> = {
      medicamentId: this.stockForm.medicamentId,
      quantite: Number(this.stockForm.quantite || 0),
      lot: this.stockForm.lot || 'LOT-STD',
      seuilAlerte: Number(this.stockForm.seuilAlerte || 10),
      dateExpiration: this.stockForm.dateExpiration || undefined,
      cliniqueId: this.cliniqueId || undefined,
    };

    const req$ = this.editingStockId
      ? this.http.put(`${this.api}/stocks/${this.editingStockId}`, payload)
      : this.http.post(`${this.api}/stocks`, payload);

    req$.subscribe({
      next: () => {
        this.success = this.editingStockId ? 'Stock modifié.' : 'Stock ajouté.';
        this.showStockModal = false;
        this.chargerStocks();
      },
      error: () => {
        this.error = 'Impossible d’enregistrer le stock.';
      },
    });
  }

  supprimerStock(id: string): void {
    if (!confirm('Supprimer cette ligne de stock ?')) return;
    this.http.delete(`${this.api}/stocks/${id}`).subscribe({
      next: () => {
        this.success = 'Stock supprimé.';
        this.chargerStocks();
      },
      error: () => {
        this.error = 'Suppression du stock impossible.';
      },
    });
  }

  ouvrirMouvement(stock: StockLite, type: 'entree' | 'sortie'): void {
    this.mouvementStock = stock;
    this.mouvementType = type;
    this.mouvementQuantite = 1;
    this.showMouvementModal = true;
    this.clearMessages();
  }

  confirmerMouvement(): void {
    if (!this.mouvementStock) return;
    const delta = Number(this.mouvementQuantite || 0);
    if (delta <= 0) {
      this.error = 'La quantité doit être positive.';
      return;
    }

    const actuelle = Number(this.mouvementStock.quantite || 0);
    if (this.mouvementType === 'sortie' && delta > actuelle) {
      this.error = 'Stock insuffisant pour cette sortie.';
      return;
    }

    const payload = { quantite: delta };
    const url =
      this.mouvementType === 'entree'
        ? `${this.api}/stocks/${this.mouvementStock.id}/entree`
        : `${this.api}/stocks/${this.mouvementStock.id}/sortie`;
    this.http.put(url, payload).subscribe({
      next: () => {
        this.success = this.mouvementType === 'entree' ? 'Entrée enregistrée.' : 'Sortie enregistrée.';
        if (this.mouvementType === 'entree') {
          this.ajouterBonEntree({
            medicamentNom: this.mouvementStock?.medicament?.nom || 'Médicament',
            quantite: delta,
            lot: this.mouvementStock?.lot || 'LOT-STD',
            dateEntree: new Date().toISOString(),
          });
        }
        this.showMouvementModal = false;
        this.chargerStocks();
      },
      error: () => {
        this.error = 'Mouvement de stock impossible.';
      },
    });
  }

  ouvrirBonEntreeModal(): void {
    this.bonEntreeForm = {
      medicamentId: '',
      quantite: 1,
      lot: '',
      dateEntree: new Date().toISOString().slice(0, 10),
    };
    this.showBonEntreeModal = true;
    this.clearMessages();
  }

  creerBonEntree(): void {
    const medicament = this.medicaments.find((m) => m.id === this.bonEntreeForm.medicamentId);
    const quantite = Number(this.bonEntreeForm.quantite || 0);

    if (!medicament || quantite <= 0) {
      this.error = 'Médicament et quantité sont obligatoires.';
      return;
    }

    const payload: Record<string, unknown> = {
      medicamentId: medicament.id,
      quantite,
      lot: this.bonEntreeForm.lot || 'LOT-STD',
      seuilAlerte: 10,
      dateExpiration: undefined,
      cliniqueId: this.cliniqueId || undefined,
    };

    this.http.post(`${this.api}/stocks`, payload).subscribe({
      next: () => {
        this.ajouterBonEntree({
          medicamentNom: medicament.nom,
          quantite,
          lot: this.bonEntreeForm.lot || 'LOT-STD',
          dateEntree: this.bonEntreeForm.dateEntree || new Date().toISOString(),
        });
        this.success = 'Bon d’entrée créé.';
        this.showBonEntreeModal = false;
        this.chargerStocks();
      },
      error: () => {
        this.error = 'Création du bon d’entrée impossible.';
      },
    });
  }

  supprimerBonEntree(id: string): void {
    this.bonsEntree = this.bonsEntree.filter((b) => b.id !== id);
    this.success = 'Bon d’entrée supprimé.';
  }

  private ajouterBonEntree(data: Omit<BonEntreeLite, 'id'>): BonEntreeLite {
    const bon: BonEntreeLite = {
      id: `BE-${Date.now()}`,
      ...data,
    };
    this.bonsEntree = [bon, ...this.bonsEntree];
    return bon;
  }

}
