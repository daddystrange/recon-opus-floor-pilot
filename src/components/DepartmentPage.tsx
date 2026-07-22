import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Department, Vehicle } from '../types';
import { colors } from '../theme/colors';
import { workflowColors } from '../theme/workflowColors';
import { VehicleCard } from './VehicleCard';
import { BackToFloorButton } from './BackToFloorButton';
import { ExceptionVehicleCard } from './ExceptionVehicleCard';

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
  const departmentColor = workflowColors[department.name as keyof typeof workflowColors];
  const normalVehicles = department.vehicles.filter((vehicle) => !vehicle.activeException?.active);
  const exceptionVehicles = department.vehicles.filter((vehicle) => vehicle.activeException?.active);
  return (
    <View style={[styles.page, { width }]}> 
      <BackToFloorButton onPress={onBackToFloor} />
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72} style={[styles.title, { color: departmentColor }]}>{department.name.toUpperCase()}</Text>
          <View style={[styles.count, { backgroundColor: departmentColor }]}><Text style={styles.countText}>{department.vehicles.length}</Text></View>
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
        {normalVehicles.map((item) => (
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
        {exceptionVehicles.length > 0 && <View style={styles.exceptionHeader}><View><Text style={styles.exceptionTitle}>PRODUCTION EXCEPTIONS</Text><Text style={styles.exceptionHint}>Corrective work · returns to originating department</Text></View><View style={styles.exceptionCount}><Text style={styles.exceptionCountText}>{exceptionVehicles.length}</Text></View></View>}
        {exceptionVehicles.map((vehicle) => <ExceptionVehicleCard key={vehicle.id} vehicle={vehicle} onPress={() => onVehiclePress(vehicle)} />)}
        <View style={styles.end}><View style={styles.endLine} /><Text style={styles.endText}>END OF QUEUE</Text><View style={styles.endLine} /></View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 13, paddingBottom: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  title: { flex: 1, fontSize: 32, lineHeight: 38, fontWeight: '900', letterSpacing: 0 },
  count: { minWidth: 29, height: 29, borderRadius: 15, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  countText: { color: colors.background, fontWeight: '900', fontSize: 13 },
  subtitle: { color: colors.muted, fontSize: 11, marginTop: 2 },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  exceptionHeader: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, marginBottom: 10, paddingHorizontal: 12, backgroundColor: '#211D15', borderLeftWidth: 3, borderLeftColor: '#D99A2B', borderRadius: 8 }, exceptionTitle: { color: '#E4B452', fontSize: 10, fontWeight: '900', letterSpacing: 1 }, exceptionHint: { color: '#8F8063', fontSize: 9, marginTop: 3 }, exceptionCount: { minWidth: 25, height: 25, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#3B2D14' }, exceptionCountText: { color: '#E8B44F', fontSize: 11, fontWeight: '900' },
  end: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16 },
  endLine: { height: 1, backgroundColor: colors.border, flex: 1 },
  endText: { color: colors.subtle, fontSize: 9, fontWeight: '800', letterSpacing: 1.4 },
  pressed: { opacity: 0.72 },
});
