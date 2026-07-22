import { useEffect, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { AccessibilityInfo, Animated, Easing, Image, LayoutChangeEvent, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { facilityPositions, FacilityMovement } from '../domain/facilityGeometry';
import { Department, ProductionDepartmentName } from '../types';
import { colors } from '../theme/colors';
import { workflowColors } from '../theme/workflowColors';
import { HorseshoeFlow } from './HorseshoeFlow';

const shopDoors = require('../../assets/Industrial doors with _Recon Opus_ branding (1).png');

type Props = { departments: Department[]; revisionCount: number; subletCount: number; motionEnabled?: boolean; movement?: FacilityMovement | null; onMovementComplete?: (movementId: number) => void; onOpenDepartment: (name: ProductionDepartmentName) => void; onOpenRevisions: () => void; onOpenSublets: () => void; onOpenHistory: () => void };

export function ProductionFloorScreen({ departments, revisionCount, subletCount, motionEnabled = true, movement, onMovementComplete, onOpenDepartment, onOpenRevisions, onOpenSublets, onOpenHistory }: Props) {
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 });
  const [sourceHighlight, setSourceHighlight] = useState<string | null>(null);
  const [destinationHighlight, setDestinationHighlight] = useState<string | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const markerX = useRef(new Animated.Value(0)).current;
  const markerY = useRef(new Animated.Value(0)).current;
  const motionOpacity = useRef(new Animated.Value(0)).current;
  const trailPoints = useRef(Array.from({ length: 4 }, () => ({ x: new Animated.Value(0), y: new Animated.Value(0), opacity: new Animated.Value(0) }))).current;
  const exceptionBreath = useRef(new Animated.Value(0)).current;
  const compact = mapSize.height > 0 && mapSize.height < 540;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    exceptionBreath.stopAnimation(); exceptionBreath.setValue(0);
    if (!revisionCount || reduceMotion || !motionEnabled) return;
    const animation = Animated.loop(Animated.sequence([Animated.timing(exceptionBreath, { toValue: 1, duration: 1450, easing: Easing.inOut(Easing.sin), useNativeDriver: true }), Animated.timing(exceptionBreath, { toValue: 0, duration: 1450, easing: Easing.inOut(Easing.sin), useNativeDriver: true })]));
    animation.start(); return () => animation.stop();
  }, [exceptionBreath, motionEnabled, reduceMotion, revisionCount]);

  useEffect(() => {
    if (!movement || !mapSize.width || !mapSize.height) return;
    const from = facilityPositions[movement.from]; const to = facilityPositions[movement.to];
    markerX.setValue(from.x * mapSize.width); markerY.setValue(from.y * mapSize.height); motionOpacity.setValue(1);
    trailPoints.forEach((point, index) => { point.x.setValue(from.x * mapSize.width); point.y.setValue(from.y * mapSize.height); point.opacity.setValue([0.42, 0.3, 0.2, 0.12][index] ?? 0.12); });
    setSourceHighlight(movement.from); setDestinationHighlight(null);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const sourceTimer = setTimeout(() => setSourceHighlight(null), 230);
    const createMovement = (x: Animated.Value, y: Animated.Value, delay = 0) => Animated.sequence([
      Animated.delay(delay),
      movement.from === 'Paint' && movement.to === 'Reassembly'
      ? Animated.sequence([
        Animated.parallel([Animated.timing(x, { toValue: 0.27 * mapSize.width, duration: 170, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }), Animated.timing(y, { toValue: 0.95 * mapSize.height, duration: 170, easing: Easing.inOut(Easing.cubic), useNativeDriver: true })]),
        Animated.timing(x, { toValue: 0.73 * mapSize.width, duration: 340, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
        Animated.parallel([Animated.timing(x, { toValue: to.x * mapSize.width, duration: 170, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }), Animated.timing(y, { toValue: to.y * mapSize.height, duration: 170, easing: Easing.inOut(Easing.cubic), useNativeDriver: true })]),
      ])
      : Animated.parallel([Animated.timing(x, { toValue: to.x * mapSize.width, duration: 680, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }), Animated.timing(y, { toValue: to.y * mapSize.height, duration: 680, easing: Easing.inOut(Easing.cubic), useNativeDriver: true })]),
    ]);
    trailPoints.forEach((point, index) => createMovement(point.x, point.y, 42 * (index + 1)).start(() => Animated.timing(point.opacity, { toValue: 0, duration: 260 + index * 25, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start()));
    const movementAnimation = createMovement(markerX, markerY);
    movementAnimation.start(() => {
      setDestinationHighlight(movement.to); void Haptics.selectionAsync();
      setTimeout(() => setDestinationHighlight(null), 300);
      Animated.timing(motionOpacity, { toValue: 0, duration: 140, useNativeDriver: true }).start(({ finished }) => {
        if (finished) onMovementComplete?.(movement.id);
      });
    });
    return () => clearTimeout(sourceTimer);
  }, [mapSize.height, mapSize.width, markerX, markerY, motionOpacity, movement, onMovementComplete, trailPoints]);

  const onMapLayout = (event: LayoutChangeEvent) => setMapSize(event.nativeEvent.layout);
  const exceptionScale = exceptionBreath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.016] });
  const exceptionGlow = exceptionBreath.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.32] });
  return <View style={styles.page}>
    <View style={styles.header}>
      <View pointerEvents="none" style={styles.headerImageUnderlay}><Image source={shopDoors} resizeMode="cover" style={styles.headerImage} /></View>
      <View pointerEvents="none" style={styles.headerImageShade} />
      <View pointerEvents="none" style={styles.headerImageFade} />
      <Text style={styles.title}>Production Floor</Text>
    </View>
    <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
    <View style={styles.operationsRow}><Animated.View style={[styles.exceptionShell, { transform: [{ scale: exceptionScale }] }]}> 
      <Animated.View pointerEvents="none" style={[styles.exceptionGlow, { opacity: exceptionGlow }]} />
      <Pressable onPress={onOpenRevisions} accessibilityRole="button" accessibilityLabel={`Production Exceptions, ${revisionCount} waiting`} style={({ pressed }) => [styles.exceptionBar, revisionCount === 0 && styles.exceptionBarClear, (sourceHighlight === 'revision' || destinationHighlight === 'revision') && styles.exceptionBarHighlighted, pressed && styles.pressed]}>
        <View style={[styles.exceptionIcon, revisionCount === 0 && styles.exceptionIconClear]}><Text style={styles.exceptionIconText}>!</Text></View>
        <View style={styles.exceptionCopy}><Text style={styles.exceptionTitle}>EXCEPTIONS</Text><Text style={styles.exceptionStatus}>{revisionCount === 0 ? 'No exceptions waiting' : `${revisionCount} vehicle${revisionCount === 1 ? '' : 's'} waiting for review`}</Text></View>
        <Text style={styles.exceptionCount}>{revisionCount}</Text><Text style={styles.exceptionChevron}>›</Text>
      </Pressable>
    </Animated.View><Pressable onPress={onOpenSublets} accessibilityRole="button" accessibilityLabel={`Sublets, ${subletCount} active`} style={({ pressed }) => [styles.subletBar, pressed && styles.pressed]}><View style={styles.subletIcon}><Text style={styles.subletIconText}>↗</Text></View><View style={styles.exceptionCopy}><Text style={styles.subletTitle}>SUBLETS</Text><Text style={styles.subletStatus}>External vendor work</Text></View><Text style={styles.subletCount}>{subletCount}</Text><Text style={styles.subletChevron}>›</Text></Pressable></View>
    <View style={styles.map} onLayout={onMapLayout}>
      <FacilityLanes />
      <HorseshoeFlow reduceMotion={reduceMotion} running={motionEnabled} />
      {departments.filter(({ name }) => name !== 'Revision Needed').map((department) => {
        const name = department.name as ProductionDepartmentName; const point = facilityPositions[name]; const color = workflowColors[name];
        const priority = department.vehicles.some(({ priority }) => priority); const aging = department.vehicles.some(({ timeInStage }) => /hr/.test(timeInStage));
        const highlighted = sourceHighlight === name || destinationHighlight === name;
        return <Pressable key={name} onPress={() => onOpenDepartment(name)} accessibilityRole="button" accessibilityLabel={`Enter ${name}, ${department.vehicles.length} vehicles`} style={({ pressed }) => [styles.zone, name === 'Arrival & Inspection' && styles.entranceZone, { left: `${point.x * 100 - 18}%`, top: `${point.y * 100 - 8.5}%`, borderColor: highlighted ? color : `${color}55`, shadowColor: color, shadowOpacity: highlighted ? 0.65 : 0 }, highlighted && styles.zoneHighlighted, pressed && styles.pressed]}>
          <View style={[styles.zoneStripe, { backgroundColor: color }]} /><View style={styles.zoneTop}><Text numberOfLines={2} style={styles.zoneName}>{name}</Text><View style={[styles.count, { backgroundColor: `${color}20` }]}><Text style={[styles.countText, { color }]}>{department.vehicles.length}</Text></View></View>
          <Text style={styles.oldest}>OLDEST · {oldestTime(department)}</Text><View style={styles.preview}>{department.vehicles.slice(0, compact ? 1 : 2).map((vehicle) => <View key={vehicle.id} style={styles.previewRow}><View style={[styles.dot, { backgroundColor: vehicle.statusColor }]} /><Text numberOfLines={1} style={styles.previewText}>{vehicle.make} {vehicle.model}</Text></View>)}{department.vehicles.length === 0 && <Text style={styles.openBay}>OPEN BAY</Text>}</View>
          {(priority || aging) && <View style={styles.alerts}>{priority && <Text style={styles.priority}>PRIORITY</Text>}{aging && <Text style={styles.aging}>AGING</Text>}</View>}
        </Pressable>;
      })}
      {trailPoints.map((point, index) => <Animated.View key={index} pointerEvents="none" style={[styles.cometTrail, { width: 15 - index * 2.5, height: Math.max(1.5, 3.5 - index * 0.55), opacity: point.opacity, transform: [{ translateX: point.x }, { translateY: point.y }] }]} />)}
      <Animated.View pointerEvents="none" style={[styles.movingVehicle, { opacity: motionOpacity, transform: [{ translateX: markerX }, { translateY: markerY }] }]}><View style={styles.cometEdge} /><View style={styles.vehicleGlyph}><Text style={styles.vehicleGlyphText}>◆</Text></View></Animated.View>
    </View>
    <Pressable accessibilityLabel="Vehicle History" accessibilityRole="button" onPress={onOpenHistory} style={({ pressed }) => [styles.historyRow, pressed && styles.pressed]}><Text style={styles.historyRowIcon}>◷</Text><Text style={styles.historyRowText}>Vehicle History</Text><Text style={styles.historyRowChevron}>›</Text></Pressable>
    </ScrollView>
  </View>;
}

function FacilityLanes() { return <View pointerEvents="none" style={StyleSheet.absoluteFill}><View style={styles.floorOutline} /></View>; }
function oldestTime(department: Department) { if (!department.vehicles.length) return '—'; return department.vehicles.reduce((oldest, vehicle) => durationMinutes(vehicle.timeInStage) > durationMinutes(oldest) ? vehicle.timeInStage : oldest, department.vehicles[0]?.timeInStage ?? '0 min'); }
function durationMinutes(value: string) { return Number(value.match(/(\d+)\s*hr/)?.[1] ?? 0) * 60 + Number(value.match(/(\d+)\s*min/)?.[1] ?? 0); }

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background }, header: { height: 50, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.border, overflow: 'hidden' }, headerImageUnderlay: { ...StyleSheet.absoluteFillObject }, headerImage: { width: '100%', height: '100%', opacity: 0.16 }, headerImageShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(7, 10, 13, 0.64)' }, headerImageFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 16, backgroundColor: 'rgba(7, 10, 13, 0.42)' }, title: { color: colors.text, fontSize: 24, fontWeight: '900', letterSpacing: -0.8 }, content: { flex: 1 }, contentContainer: { flexGrow: 1 },
  operationsRow: { height: 58, flexDirection: 'row', gap: 7, marginHorizontal: 8, marginTop: 3, zIndex: 9 }, exceptionShell: { flex: 1, height: 58 }, exceptionGlow: { ...StyleSheet.absoluteFillObject, backgroundColor: '#EF4444', borderRadius: 10 }, exceptionBar: { flex: 1, minHeight: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, backgroundColor: '#241315', borderWidth: 1, borderColor: '#7F3035', borderRadius: 9 }, exceptionBarClear: { backgroundColor: '#12171A', borderColor: '#293337' }, exceptionBarHighlighted: { borderWidth: 2, borderColor: '#FF5C62', backgroundColor: '#35171A' }, exceptionIcon: { width: 25, height: 25, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: '#B52D35', marginRight: 7 }, exceptionIconClear: { backgroundColor: '#314047' }, exceptionIconText: { color: '#FFF', fontSize: 15, fontWeight: '900' }, exceptionCopy: { flex: 1 }, exceptionTitle: { color: '#F7D8DA', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 }, exceptionStatus: { color: '#C9898D', fontSize: 7, fontWeight: '700', marginTop: 3 }, exceptionCount: { color: '#FF737A', fontSize: 18, fontWeight: '900', marginHorizontal: 4 }, exceptionChevron: { color: '#D65C63', fontSize: 21, fontWeight: '600' }, subletBar: { flex: 1, minHeight: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, backgroundColor: '#201A13', borderWidth: 1, borderColor: '#6A4B2B', borderRadius: 9 }, subletIcon: { width: 25, height: 25, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: '#6F4927', marginRight: 7 }, subletIconText: { color: '#F0C48F', fontSize: 14, fontWeight: '900' }, subletTitle: { color: '#EAC08B', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 }, subletStatus: { color: '#A98761', fontSize: 7, fontWeight: '700', marginTop: 3 }, subletCount: { color: '#E2A55F', fontSize: 18, fontWeight: '900', marginHorizontal: 4 }, subletChevron: { color: '#C68A43', fontSize: 21, fontWeight: '600' },
  map: { flex: 1, margin: 7, marginTop: 5, overflow: 'visible', borderWidth: 1, borderColor: '#1C2229', borderRadius: 14, backgroundColor: '#0B0E12' }, floorOutline: { position: 'absolute', left: '3%', right: '3%', top: '1%', bottom: '1%', borderWidth: 1, borderColor: '#171D23', borderRadius: 22 },
  zone: { position: 'absolute', width: '36%', height: '17%', minHeight: 72, backgroundColor: '#11161B', borderWidth: 1, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 7, overflow: 'hidden', zIndex: 2, shadowRadius: 10 }, entranceZone: { borderTopLeftRadius: 3 }, zoneHighlighted: { borderWidth: 2 }, zoneStripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 }, zoneTop: { minHeight: 28, flexDirection: 'row', alignItems: 'flex-start', gap: 5 }, zoneName: { flex: 1, color: colors.text, fontSize: 12.5, lineHeight: 14, fontWeight: '900' }, count: { minWidth: 27, height: 27, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, countText: { fontSize: 12, fontWeight: '900' }, oldest: { color: colors.subtle, fontSize: 6.5, fontWeight: '900', letterSpacing: 0.6, marginTop: 2 }, preview: { gap: 2, marginTop: 3 }, previewRow: { flexDirection: 'row', alignItems: 'center' }, dot: { width: 4, height: 4, borderRadius: 2, marginRight: 5 }, previewText: { flex: 1, color: '#AEB5BC', fontSize: 7.5, fontWeight: '700' }, openBay: { color: colors.subtle, fontSize: 7, fontWeight: '900', letterSpacing: 1 }, alerts: { position: 'absolute', right: 7, bottom: 4, flexDirection: 'row', gap: 4 }, priority: { color: colors.accent, fontSize: 5.5, fontWeight: '900' }, aging: { color: '#FB8B65', fontSize: 5.5, fontWeight: '900' }, pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  historyRow: { minHeight: 44, marginHorizontal: 8, marginBottom: 4, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 9, backgroundColor: colors.panel }, historyRowIcon: { color: colors.muted, fontSize: 17, fontWeight: '700', marginRight: 9 }, historyRowText: { flex: 1, color: colors.muted, fontSize: 12, fontWeight: '800' }, historyRowChevron: { color: colors.subtle, fontSize: 21, fontWeight: '600' },
  cometTrail: { position: 'absolute', left: -15, top: -1.75, borderRadius: 3, backgroundColor: '#278EEB', zIndex: 6 }, movingVehicle: { position: 'absolute', left: -9, top: -9, width: 18, height: 18, zIndex: 7 }, cometEdge: { position: 'absolute', left: -9, top: 7.5, width: 14, height: 3, borderRadius: 2, backgroundColor: '#A9DEFF' }, vehicleGlyph: { width: 18, height: 18, borderRadius: 5, alignItems: 'center', justifyContent: 'center', backgroundColor: '#174C78', borderWidth: 1, borderColor: '#78BEEB' }, vehicleGlyphText: { color: '#EAF8FF', fontSize: 9, fontWeight: '900' },
});
