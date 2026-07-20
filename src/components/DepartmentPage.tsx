import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Department, Vehicle } from '../types';
import { colors } from '../theme/colors';
import { VehicleCard } from './VehicleCard';

type Props = {
  department: Department;
  width: number;
  scrollOffset: number;
  liftedVehicleId?: string;
  exitingVehicleId?: string;
  exitDirection?: -1 | 1;
  onScrollOffsetChange: (offset: number) => void;
  onVehiclePress: (vehicle: Vehicle) => void;
  onVehicleLongPress: (vehicle: Vehicle) => void;
  onVehicleExitComplete: () => void;
  onBackToFloor: () => void;
};

export function DepartmentPage({ department, width, scrollOffset, liftedVehicleId, exitingVehicleId, exitDirection, onScrollOffsetChange, onVehiclePress, onVehicleLongPress, onVehicleExitComplete, onBackToFloor }: Props) {
  return (
    <View style={[styles.page, { width }]}>
      <Pressable onPress={onBackToFloor} accessibilityRole="button" hitSlop={8} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><Text style={styles.backIcon}>‹</Text><Text style={styles.backText}>Back to Production Floor</Text></Pressable>
      <View style={styles.header}>
        <Text style={styles.kicker}>PRODUCTION FLOOR</Text>
        <View style={styles.titleRow}>
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72} style={styles.title}>{department.name}</Text>
          <View style={styles.count}><Text style={styles.countText}>{department.vehicles.length}</Text></View>
        </View>
        <Text style={styles.subtitle}>{department.vehicles.length} {department.vehicles.length === 1 ? 'vehicle' : 'vehicles'} in department</Text>
      </View>
      <ScrollView
        contentOffset={{ x: 0, y: scrollOffset }}
        onScroll={({ nativeEvent }) => onScrollOffsetChange(nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {department.vehicles.map((item) => (
          <VehicleCard
            key={item.id}
            vehicle={item}
            onPress={() => onVehiclePress(item)}
            onLongPress={() => onVehicleLongPress(item)}
            lifted={item.id === liftedVehicleId}
            exitDirection={item.id === exitingVehicleId ? exitDirection : undefined}
            onExitComplete={item.id === exitingVehicleId ? onVehicleExitComplete : undefined}
          />
        ))}
        <View style={styles.end}><View style={styles.endLine} /><Text style={styles.endText}>END OF QUEUE</Text><View style={styles.endLine} /></View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  back: { minHeight: 40, paddingHorizontal: 20, paddingVertical: 2, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border },
  backIcon: { color: colors.accent, fontSize: 27, lineHeight: 29, marginRight: 5 },
  backText: { color: colors.text, fontSize: 12, fontWeight: '800' },
  header: { paddingHorizontal: 20, paddingTop: 13, paddingBottom: 10 },
  kicker: { color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 1.8, marginBottom: 5 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  title: { flex: 1, color: colors.text, fontSize: 26, lineHeight: 31, fontWeight: '900', letterSpacing: -0.8 },
  count: { minWidth: 29, height: 29, borderRadius: 15, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  countText: { color: colors.background, fontWeight: '900', fontSize: 13 },
  subtitle: { color: colors.muted, fontSize: 11, marginTop: 2 },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  end: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16 },
  endLine: { height: 1, backgroundColor: colors.border, flex: 1 },
  endText: { color: colors.subtle, fontSize: 9, fontWeight: '800', letterSpacing: 1.4 },
  pressed: { opacity: 0.72 },
});
