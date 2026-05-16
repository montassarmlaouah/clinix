/**
 * subscriptionEvents.ts
 * Bus d'événements léger pour signaler les erreurs 402 (abonnement expiré)
 * depuis n'importe quel appel API vers le layout racine.
 */
type Listener = () => void;

const listeners: Listener[] = [];

export const subscriptionEvents = {
  /** Émet l'événement "abonnement expiré" */
  emit(): void {
    listeners.forEach((fn) => fn());
  },
  /** S'abonne à l'événement */
  subscribe(fn: Listener): () => void {
    listeners.push(fn);
    return () => {
      const idx = listeners.indexOf(fn);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  },
};
