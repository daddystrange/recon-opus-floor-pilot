import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Vehicle } from '../types';
import { colors } from '../theme/colors';

export function ExceptionVehicleCard({ vehicle, onPress }: { vehicle: Vehicle; onPress: () => void }) {
  const productionException = vehicle.activeException;
  if (!productionException?.active) return null;
  return <Pressable onPress={onPress} accessibilityRole="button" accessibilityHint="Opens corrective work details" accessibilityLabel={`${vehicle.year} ${vehicle.make} ${vehicle.model}, production exception from ${productionException.originDepartment}`} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
    <View style={styles.ribbon} />
    <View style={styles.content}>
      <View style={styles.headingRow}><View style={styles.badge}><Text style={styles.badgeText}>PRODUCTION EXCEPTION</Text></View><Text style={styles.elapsed}>{formatElapsed(productionException.createdAt)}</Text></View>
      <Text style={styles.vehicle}>{vehicle.year} {vehicle.make} {vehicle.model}</Text>
      <View style={styles.details}>
        <Detail label="ORIGIN" value={productionException.originDepartment} />
        <Detail label="REASON" value={productionException.reason} />
        <Detail label="CORRECTIVE TASK" value={productionException.correctiveTask} />
      </View>
      <Text style={styles.open}>OPEN CORRECTIVE WORK  ›</Text>
    </View>
  </Pressable>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <View style={styles.detail}><Text style={styles.label}>{label}</Text><Text numberOfLines={1} style={styles.value}>{value}</Text></View>;
}

function formatElapsed(createdAt: number) {
  const minutes = Math.max(0, Math.floor((Date.now() - createdAt) / 60000));
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} hr ${minutes % 60} min`;
}

const styles = StyleSheet.create({
  card: { minHeight: 190, flexDirection: 'row', overflow: 'hidden', backgroundColor: '#191816', borderWidth: 1, borderColor: '#5B4820', borderRadius: 14, marginBottom: 14 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] }, ribbon: { width: 6, backgroundColor: '#D99A2B' }, content: { flex: 1, padding: 17 },
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, badge: { paddingHorizontal: 8, paddingVertical: 5, backgroundColor: '#352A15', borderWidth: 1, borderColor: '#6A5223', borderRadius: 5 }, badgeText: { color: '#E8B44F', fontSize: 8, fontWeight: '900', letterSpacing: 0.8 }, elapsed: { color: '#B99855', fontSize: 10, fontWeight: '800' },
  vehicle: { color: colors.text, fontSize: 18, fontWeight: '900', marginTop: 11 }, details: { gap: 7, marginTop: 13 }, detail: { flexDirection: 'row', alignItems: 'center' }, label: { width: 94, color: colors.subtle, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 }, value: { flex: 1, color: '#D8C69F', fontSize: 11, fontWeight: '800' }, open: { color: '#DCA442', fontSize: 9, fontWeight: '900', letterSpacing: 1, marginTop: 14 },
});
