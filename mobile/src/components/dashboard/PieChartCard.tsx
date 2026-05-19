import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { VictoryPie } from 'victory-native';

interface Props {
  title: string;
  data: { x: string; y: number }[];
}

export const PieChartCard = ({ title, data }: Props) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>

      <VictoryPie
        data={data}
        innerRadius={50}
        padAngle={2}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginVertical: 10,
    borderRadius: 16,
    padding: 12,
    elevation: 3,
  },

  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});
