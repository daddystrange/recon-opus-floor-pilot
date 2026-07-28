import { useEffect, useRef } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, View } from 'react-native';
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
  const exceptionVehicles = department.vehicles
    .filter((vehicle) => vehicle.activeException?.active)
    .sort((a, b) => (a.activeException?.createdAt ?? 0) - (b.activeException?.createdAt ?? 0));
  const featuredException = exceptionVehicles[0] ?? null;
  const additionalExceptionCount = Math.max(0, exceptionVehicles.length - 1);
  const shelfEntrance = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!featuredException) return;
    shelfEntrance.setValue(0);
    const animation = Animated.timing(shelfEntrance, {
      toValue: 1,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [featuredException?.id, shelfEntrance]);

  const shelfTranslate = shelfEntrance.interpolate({ inputRange: [0, 1], outputRange: [-7, 0] });
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
      {featuredException && (
        <View style={styles.pinnedExceptions}>
          <View style={styles.exceptionHeader}>
            <View style={styles.exceptionHeading}>
              <Text style={styles.warningIcon}>⚠</Text>
              <View><Text style={styles.exceptionTitle}>PRODUCTION EXCEPTION</Text><Text style={styles.exceptionHint}>Oldest active interruption · recover first</Text></View>
            </View>
            <View style={styles.exceptionCount}><Text style={styles.exceptionCountText}>{exceptionVehicles.length}</Text></View>
          </View>
          <Animated.View style={{ opacity: shelfEntrance, transform: [{ translateY: shelfTranslate }] }}>
            <ExceptionVehicleCard vehicle={featuredException} onPress={() => onVehiclePress(featuredException)} />
          </Animated.View>
          {additionalExceptionCount > 0 && <View style={styles.moreExceptions}><Text style={styles.moreExceptionsText}>+{additionalExceptionCount} More Production {additionalExceptionCount === 1 ? 'Exception' : 'Exceptions'}</Text></View>}
          <View style={styles.productionDivider}><View style={styles.dividerLine} /><Text style={styles.productionDividerText}>TODAY&apos;S PRODUCTION</Text><View style={styles.dividerLine} /></View>
        </View>
      )}
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
  pinnedExceptions: { paddingHorizontal: 20, backgroundColor: '#0D0E0F', zIndex: 4, elevation: 4, shadowColor: '#000000', shadowOpacity: 0.32, shadowRadius: 12, shadowOffset: { width: 0, height: 7 } },
  exceptionHeader: { minHeight: 55, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9, paddingHorizontal: 12, backgroundColor: '#211D15', borderLeftWidth: 3, borderLeftColor: '#D99A2B', borderRadius: 8 }, exceptionHeading: { flexDirection: 'row', alignItems: 'center' }, warningIcon: { color: '#E8B44F', fontSize: 16, marginRight: 9 }, exceptionTitle: { color: '#F1C665', fontSize: 11, fontWeight: '900', letterSpacing: 0.8 }, exceptionHint: { color: '#9D8964', fontSize: 9, fontWeight: '700', marginTop: 3 }, exceptionCount: { minWidth: 25, height: 25, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#3B2D14' }, exceptionCountText: { color: '#E8B44F', fontSize: 11, fontWeight: '900' },
  moreExceptions: { minHeight: 29, marginTop: -5, marginBottom: 3, alignItems: 'center', justifyContent: 'center', backgroundColor: '#171612', borderRadius: 7 }, moreExceptionsText: { color: '#9D8964', fontSize: 8.5, fontWeight: '800', letterSpacing: 0.35 },
  productionDivider: { minHeight: 37, flexDirection: 'row', alignItems: 'center', gap: 10 }, dividerLine: { flex: 1, height: 1, backgroundColor: '#5B4820' }, productionDividerText: { color: '#9B8A68', fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  end: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16 },
  endLine: { height: 1, backgroundColor: colors.border, flex: 1 },
  endText: { color: colors.subtle, fontSize: 9, fontWeight: '800', letterSpacing: 1.4 },
  pressed: { opacity: 0.72 },
});
