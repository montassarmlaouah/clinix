import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

import { NewPatientModal } from '@/src/components/patients/NewPatientModal';

/** Route legacy — ouvre le modal puis revient en arrière */
export default function NouveauPatientScreen(): React.JSX.Element {
  const router = useRouter();
  const [visible, setVisible] = useState(true);

  return (
                    <View style={{ flex: 1 }}>
      <NewPatientModal
        visible={visible}
        onClose={() => {
          setVisible(false);
          router.back();
        }}
        onCreated={() => {
          setVisible(false);
          router.back();
        }}
      />
    </View>
  );
}
