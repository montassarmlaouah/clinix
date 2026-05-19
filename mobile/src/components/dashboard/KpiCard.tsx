import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  label: string;
  value: string | number;
  icon: any;
  color: string;
}

export const KpiCard = ({ label, value, icon, color }: Props) => {
  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <Ionicons name={icon} size={24} color={color} />

      <Text style={styles.value}>
        {value}
      </Text>

      <Text style={styles.label}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    margin: 8,
    borderLeftWidth: 5,
    elevation: 3,
  },

  value: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },

  label: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});
