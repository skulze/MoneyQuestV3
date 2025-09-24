import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LocalDataEngine, SubscriptionManager, createFreeSubscription } from '@moneyquest/shared';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>MoneyQuestV3 Mobile</Text>
      <Text style={styles.subtitle}>Personal Finance App</Text>
      <Text style={styles.description}>
        Local-first financial management with transaction splitting,
        budgeting, and analytics.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2563eb',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 16,
    color: '#64748b',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    color: '#374151',
  },
});