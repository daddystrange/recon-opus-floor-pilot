import { memo } from 'react';
import { StyleSheet, Text } from 'react-native';

export const WipNumber = memo(function WipNumber({ value }: { value: number }) {
  return <Text style={styles.value}>{value}</Text>;
});

const styles = StyleSheet.create({
  value: { color: '#10B981', fontSize: 56, lineHeight: 62, fontWeight: '900', letterSpacing: -2 },
});
