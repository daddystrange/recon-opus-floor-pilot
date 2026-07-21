import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Department, Vehicle } from '../types';
import { colors } from '../theme/colors';
import { BackToFloorButton } from './BackToFloorButton';

type Props = {
  department: Department;
  width: number;
  scrollOffset: number;
  onScrollOffsetChange: (offset: number) => void;
  onVehiclePress: (vehicle: Vehicle) => void;
  onBackToFloor: () => void;
};

export function RevisionQueuePage({ department, width, scrollOffset, onScrollOffsetChange, onVehiclePress, onBackToFloor }: Props) {
  return <View style={[styles.page, { width }]}> 
    <BackToFloorButton onPress={onBackToFloor} />
    <View style={styles.header}>
      <Text style={styles.kicker}>REVISION REVIEW QUEUE</Text>
      <View style={styles.titleRow}><Text style={styles.title}>Production Exceptions</Text><View style={styles.count}><Text style={styles.countText}>{department.vehicles.length}</Text></View></View>
      <Text style={styles.subtitle}>{department.vehicles.length} {department.vehicles.length === 1 ? 'vehicle' : 'vehicles'} waiting for review</Text>
    </View>
    <ScrollView contentOffset={{ x: 0, y: scrollOffset }} onScroll={({ nativeEvent }) => onScrollOffsetChange(nativeEvent.contentOffset.y)} scrollEventThrottle={16} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
      {department.vehicles.map((vehicle) => {
        const revision = vehicle.activeRevision;
        if (!revision) return null;
        return <Pressable key={vehicle.id} onPress={() => onVehiclePress(vehicle)} accessibilityRole="button" accessibilityHint="Opens revision review" style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
          <View style={styles.ribbon} /><View style={styles.cardContent}>
            <Text style={styles.vehicleEyebrow}>{vehicle.year} · STOCK {vehicle.stockNumber}</Text>
            <Text style={styles.vehicleName}>{vehicle.make} {vehicle.model}</Text>
            <View style={styles.rule} />
            <View style={styles.metaRow}><View style={styles.meta}><Text style={styles.metaLabel}>ORIGINAL DEPARTMENT</Text><Text style={styles.metaValue}>{revision.originalDepartment}</Text></View><View style={styles.meta}><Text style={styles.metaLabel}>WAITING</Text><Text style={styles.waiting}>{formatWaiting(revision.requestedAt)}</Text></View></View>
            <Text style={styles.reasonLabel}>REVISION REASON</Text><Text style={styles.reason}>{revision.reason}</Text>
            <Text style={styles.notesLabel}>NOTES</Text><Text numberOfLines={2} style={[styles.notes, !revision.notes && styles.noNotes]}>{revision.notes || 'No notes provided'}</Text>
            <Text style={styles.reviewLink}>REVIEW REQUEST  ›</Text>
          </View>
        </Pressable>;
      })}
      {department.vehicles.length === 0 && <View style={styles.empty}><Text style={styles.emptyMark}>✓</Text><Text style={styles.emptyTitle}>No revisions waiting</Text><Text style={styles.emptyText}>Submitted revision requests will appear here.</Text></View>}
    </ScrollView>
  </View>;
}

function formatWaiting(requestedAt: number) {
  const minutes = Math.max(0, Math.floor((Date.now() - requestedAt) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `${hours} hr ${minutes % 60} min`;
}

const styles = StyleSheet.create({
  page: { flex: 1 }, header: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 18 }, kicker: { color: '#F97316', fontSize: 10, fontWeight: '900', letterSpacing: 2.1, marginBottom: 8 }, titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 }, title: { flexShrink: 1, color: colors.text, fontSize: 34, fontWeight: '900', letterSpacing: -1.2 }, count: { minWidth: 34, height: 34, borderRadius: 17, backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 }, countText: { color: colors.background, fontWeight: '900', fontSize: 15 }, subtitle: { color: colors.muted, fontSize: 13, marginTop: 5 }, list: { paddingHorizontal: 20, paddingBottom: 42 },
  card: { minHeight: 270, flexDirection: 'row', backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border, borderRadius: 14, overflow: 'hidden', marginBottom: 14 }, ribbon: { width: 6, backgroundColor: '#F97316' }, cardContent: { flex: 1, padding: 18 }, vehicleEyebrow: { color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.1, marginBottom: 6 }, vehicleName: { color: colors.text, fontSize: 20, fontWeight: '900' }, rule: { height: 1, backgroundColor: colors.border, marginVertical: 14 }, metaRow: { flexDirection: 'row', gap: 20 }, meta: { flex: 1 }, metaLabel: { color: colors.subtle, fontSize: 8, fontWeight: '900', letterSpacing: 1, marginBottom: 4 }, metaValue: { color: '#D6DADE', fontSize: 12, fontWeight: '800' }, waiting: { color: '#F59E0B', fontSize: 12, fontWeight: '900' }, reasonLabel: { color: colors.subtle, fontSize: 8, fontWeight: '900', letterSpacing: 1, marginTop: 15, marginBottom: 4 }, reason: { color: '#F3B077', fontSize: 14, fontWeight: '900' }, notesLabel: { color: colors.subtle, fontSize: 8, fontWeight: '900', letterSpacing: 1, marginTop: 13, marginBottom: 4 }, notes: { color: '#BFC5CB', fontSize: 12, lineHeight: 17 }, noNotes: { color: colors.subtle, fontStyle: 'italic' }, reviewLink: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.2, marginTop: 15 }, pressed: { opacity: 0.72 },
  empty: { alignItems: 'center', paddingTop: 70, paddingHorizontal: 30 }, emptyMark: { color: '#2DD47A', fontSize: 32, fontWeight: '900' }, emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '900', marginTop: 12 }, emptyText: { color: colors.muted, fontSize: 13, textAlign: 'center', marginTop: 6 },
});
