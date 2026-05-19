import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { VictoryChart, VictoryLine, VictoryTheme } from 'victory-native';

interface Props {
  title: string;
  data: { x: string | number; y: number }[];
}

export const LineChartCard = ({ title, data }: Props) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>

      <VictoryChart theme={VictoryTheme.material}>
        <VictoryLine data={data} />
      </VictoryChart>
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
