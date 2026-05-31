import React from 'react';
import { SubscriptionScreen } from '@/src/components/screens/medecin/SubscriptionScreen';

export default function AdminAbonnementScreen(): React.JSX.Element {
  return <SubscriptionScreen initialStep="status" variant="admin" />;
}
