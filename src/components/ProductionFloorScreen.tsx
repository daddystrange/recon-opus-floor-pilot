import { useEffect, useMemo, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { AccessibilityInfo, Animated, Easing, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { facilityPositions, FacilityMovement, NormalizedPoint } from '../domain/facilityGeometry';
import { Department, ProductionDepartmentName } from '../types';
import { colors } from '../theme/colors';

const zoneColors: Record<ProductionDepartmentName, string> = { 'Arrival & Inspection': '#64748B', 'Parts Hold': '#C58A32', Body: '#F97316', Paint: '#3B82F6', Reassembly: '#A855F7', Detail: '#14B8A6', 'Quality Control': '#EAB308', Delivery: '#22C55E' };
type Props = { departments: Department[]; totalWip: number; revisionCount: number; movement?: FacilityMovement | null; onOpenDepartment: (name: ProductionDepartmentName) => void; onOpenRevisions: () => void; onOpenHistory: () => void };

export function ProductionFloorScreen({ departments, totalWip, revisionCount, movement, onOpenDepartment, onOpenRevisions, onOpenHistory }: Props) {
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 });
  const [sourceHighlight, setSourceHighlight] = useState<string | null>(null);
  const [destinationHighlight, setDestinationHighlight] = useState<string | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const markerX = useRef(new Animated.Value(0)).current;
  const markerY = useRef(new Animated.Value(0)).current;
  const motionOpacity = useRef(new Animated.Value(0)).current;
  const wipScale = useRef(new Animated.Value(1)).current;
  const previousWip = useRef(totalWip);
  const exceptionBreath = useRef(new Animated.Value(0)).current;
  const wipBreath = useRef(new Animated.Value(0)).current;
  const wipChangeGlow = useRef(new Animated.Value(0)).current;
  const compact = mapSize.height > 0 && mapSize.height < 540;
  const route = useMemo(() => movement && mapSize.width ? routeStyle(movement.from === 'Paint' && movement.to === 'Reassembly' ? { x: 0.18, y: 0.87 } : facilityPositions[movement.from], movement.from === 'Paint' && movement.to === 'Reassembly' ? { x: 0.82, y: 0.87 } : facilityPositions[movement.to], mapSize) : null, [mapSize, movement]);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    exceptionBreath.stopAnimation(); exceptionBreath.setValue(0);
    if (!revisionCount || reduceMotion) return;
    const animation = Animated.loop(Animated.sequence([Animated.timing(exceptionBreath, { toValue: 1, duration: 1450, easing: Easing.inOut(Easing.sin), useNativeDriver: true }), Animated.timing(exceptionBreath, { toValue: 0, duration: 1450, easing: Easing.inOut(Easing.sin), useNativeDriver: true })]));
    animation.start(); return () => animation.stop();
  }, [exceptionBreath, reduceMotion, revisionCount]);

  useEffect(() => {
    wipBreath.stopAnimation(); wipBreath.setValue(0);
    const animation = Animated.loop(Animated.sequence([Animated.timing(wipBreath, { toValue: 1, duration: 1900, easing: Easing.inOut(Easing.sin), useNativeDriver: false }), Animated.timing(wipBreath, { toValue: 0, duration: 1900, easing: Easing.inOut(Easing.sin), useNativeDriver: false })]));
    animation.start(); return () => animation.stop();
  }, [wipBreath]);

  useEffect(() => {
    if (!movement || !mapSize.width || !mapSize.height) return;
    const from = facilityPositions[movement.from]; const to = facilityPositions[movement.to];
    markerX.setValue(from.x * mapSize.width); markerY.setValue(from.y * mapSize.height); motionOpacity.setValue(1);
    setSourceHighlight(movement.from); setDestinationHighlight(null);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const sourceTimer = setTimeout(() => setSourceHighlight(null), 230);
    const movementAnimation = movement.from === 'Paint' && movement.to === 'Reassembly'
      ? Animated.sequence([
        Animated.parallel([Animated.timing(markerX, { toValue: 0.24 * mapSize.width, duration: 170, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }), Animated.timing(markerY, { toValue: 0.87 * mapSize.height, duration: 170, easing: Easing.inOut(Easing.cubic), useNativeDriver: true })]),
        Animated.timing(markerX, { toValue: 0.76 * mapSize.width, duration: 340, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
        Animated.parallel([Animated.timing(markerX, { toValue: to.x * mapSize.width, duration: 170, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }), Animated.timing(markerY, { toValue: to.y * mapSize.height, duration: 170, easing: Easing.inOut(Easing.cubic), useNativeDriver: true })]),
      ])
      : Animated.parallel([Animated.timing(markerX, { toValue: to.x * mapSize.width, duration: 680, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }), Animated.timing(markerY, { toValue: to.y * mapSize.height, duration: 680, easing: Easing.inOut(Easing.cubic), useNativeDriver: true })]);
    movementAnimation.start(() => {
      setDestinationHighlight(movement.to); void Haptics.selectionAsync();
      setTimeout(() => setDestinationHighlight(null), 300);
      Animated.timing(motionOpacity, { toValue: 0, duration: 140, useNativeDriver: true }).start();
    });
    return () => clearTimeout(sourceTimer);
  }, [mapSize.height, mapSize.width, markerX, markerY, motionOpacity, movement]);

  useEffect(() => {
    if (previousWip.current === totalWip) return;
    previousWip.current = totalWip;
    Animated.sequence([Animated.timing(wipScale, { toValue: reduceMotion ? 1.01 : 1.065, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: true }), Animated.timing(wipScale, { toValue: 1, duration: 460, easing: Easing.inOut(Easing.cubic), useNativeDriver: true })]).start();
    Animated.sequence([Animated.timing(wipChangeGlow, { toValue: 1, duration: 160, useNativeDriver: true }), Animated.timing(wipChangeGlow, { toValue: 0, duration: 520, useNativeDriver: true })]).start();
  }, [reduceMotion, totalWip, wipChangeGlow, wipScale]);

  const onMapLayout = (event: LayoutChangeEvent) => setMapSize(event.nativeEvent.layout);
  const exceptionScale = exceptionBreath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.016] });
  const exceptionGlow = exceptionBreath.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.32] });
  const wipBreathScale = wipBreath.interpolate({ inputRange: [0, 1], outputRange: [1, reduceMotion ? 1.004 : 1.025] });
  const wipColor = wipBreath.interpolate({ inputRange: [0, 1], outputRange: ['#277A49', '#78E89C'] });
  const wipShadowColor = wipBreath.interpolate({ inputRange: [0, 1], outputRange: ['rgba(39,122,73,0.18)', 'rgba(120,232,156,0.62)'] });
  const wipShadowRadius = wipBreath.interpolate({ inputRange: [0, 1], outputRange: [2, 8] });
  return <View style={styles.page}>
    <View style={styles.header}><View><Text style={styles.kicker}>LIVE FACILITY</Text><Text style={styles.title}>Production Floor</Text></View><Pressable onPress={onOpenHistory} hitSlop={8}><Text style={styles.history}>VEHICLE HISTORY  ›</Text></Pressable></View>
    <Animated.View style={[styles.exceptionShell, { transform: [{ scale: exceptionScale }] }]}>
      <Animated.View pointerEvents="none" style={[styles.exceptionGlow, { opacity: exceptionGlow }]} />
      <Pressable onPress={onOpenRevisions} accessibilityRole="button" accessibilityLabel={`Production Exceptions, ${revisionCount} waiting`} style={({ pressed }) => [styles.exceptionBar, revisionCount === 0 && styles.exceptionBarClear, (sourceHighlight === 'revision' || destinationHighlight === 'revision') && styles.exceptionBarHighlighted, pressed && styles.pressed]}>
        <View style={[styles.exceptionIcon, revisionCount === 0 && styles.exceptionIconClear]}><Text style={styles.exceptionIconText}>!</Text></View>
        <View style={styles.exceptionCopy}><Text style={styles.exceptionTitle}>PRODUCTION EXCEPTIONS</Text><Text style={styles.exceptionStatus}>{revisionCount === 0 ? 'No exceptions waiting' : `${revisionCount} vehicle${revisionCount === 1 ? '' : 's'} waiting for review`}</Text></View>
        <Text style={styles.exceptionCount}>{revisionCount}</Text><Text style={styles.exceptionChevron}>›</Text>
      </Pressable>
    </Animated.View>
    <View style={styles.map} onLayout={onMapLayout}>
      <FacilityLanes />
      {route && <Animated.View pointerEvents="none" style={[styles.activeRoute, route, { opacity: motionOpacity }]} />}
      <Text style={[styles.entrance, { left: '2%', top: '2%' }]}>ENTRANCE</Text><Text style={[styles.finish, { right: '2%', top: '2%' }]}>FINISH</Text>
      {departments.filter(({ name }) => name !== 'Revision Needed').map((department) => {
        const name = department.name as ProductionDepartmentName; const point = facilityPositions[name]; const color = zoneColors[name];
        const priority = department.vehicles.some(({ priority }) => priority); const aging = department.vehicles.some(({ timeInStage }) => /hr/.test(timeInStage));
        const highlighted = sourceHighlight === name || destinationHighlight === name;
        const reassembly = name === 'Reassembly';
        return <Pressable key={name} onPress={() => onOpenDepartment(name)} accessibilityRole="button" accessibilityLabel={`Enter ${name}, ${department.vehicles.length} vehicles`} style={({ pressed }) => [styles.zone, name === 'Arrival & Inspection' && styles.entranceZone, { left: `${point.x * 100 - 17}%`, top: `${point.y * 100 - 8.5}%`, borderColor: highlighted ? color : `${color}55`, shadowColor: color, shadowOpacity: highlighted ? 0.65 : 0 }, highlighted && styles.zoneHighlighted, pressed && styles.pressed]}>
          <View style={[styles.zoneStripe, { backgroundColor: color }]} /><View style={styles.zoneTop}><Text numberOfLines={reassembly ? 1 : 2} adjustsFontSizeToFit minimumFontScale={0.78} style={styles.zoneName}>{name}</Text><View style={[styles.count, { backgroundColor: `${color}20` }]}><Text style={[styles.countText, { color }]}>{department.vehicles.length}</Text></View></View>
          <Text style={styles.oldest}>OLDEST · {oldestTime(department)}</Text><View style={styles.preview}>{department.vehicles.slice(0, compact ? 1 : 2).map((vehicle) => <View key={vehicle.id} style={styles.previewRow}><View style={[styles.dot, { backgroundColor: vehicle.statusColor }]} /><Text numberOfLines={1} style={styles.previewText}>{vehicle.make} {vehicle.model}</Text></View>)}{department.vehicles.length === 0 && <Text style={styles.openBay}>OPEN BAY</Text>}</View>
          {(priority || aging) && <View style={styles.alerts}>{priority && <Text style={styles.priority}>PRIORITY</Text>}{aging && <Text style={styles.aging}>AGING</Text>}</View>}
        </Pressable>;
      })}
      <View style={styles.heartbeat} pointerEvents="none"><Text style={styles.wipLabel}>TOTAL WIP</Text><View style={styles.wipNumberWrap}><Animated.Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.wipValue, styles.wipChangeText, { opacity: wipChangeGlow, color: '#A0F5B9', textShadowColor: '#73F29C', textShadowRadius: 14, transform: [{ scale: wipChangeGlow.interpolate({ inputRange: [0, 1], outputRange: [1, reduceMotion ? 1.005 : 1.08] }) }] }]}>{totalWip}</Animated.Text><Animated.Text style={[styles.wipValue, { color: wipColor, textShadowColor: wipShadowColor, textShadowRadius: wipShadowRadius, transform: [{ scale: wipBreathScale }, { scale: wipScale }] }]}>{totalWip}</Animated.Text></View><Text style={styles.wipCaption}>Vehicles in Production</Text></View>
      <Animated.View pointerEvents="none" style={[styles.movingVehicle, { opacity: motionOpacity, transform: [{ translateX: markerX }, { translateY: markerY }] }]}><View style={styles.vehicleGlyph}><Text style={styles.vehicleGlyphText}>◆</Text></View></Animated.View>
    </View>
  </View>;
}

function FacilityLanes() { return <View pointerEvents="none" style={StyleSheet.absoluteFill}><View style={styles.floorOutline} /><View style={styles.horseshoeLane} /></View>; }
function routeStyle(from: NormalizedPoint, to: NormalizedPoint, size: { width: number; height: number }) { const x1 = from.x * size.width; const y1 = from.y * size.height; const x2 = to.x * size.width; const y2 = to.y * size.height; const length = Math.hypot(x2 - x1, y2 - y1); const angle = Math.atan2(y2 - y1, x2 - x1); return { left: x1, top: y1, width: length, transform: [{ rotateZ: `${angle}rad` }] }; }
function oldestTime(department: Department) { if (!department.vehicles.length) return '—'; return department.vehicles.reduce((oldest, vehicle) => durationMinutes(vehicle.timeInStage) > durationMinutes(oldest) ? vehicle.timeInStage : oldest, department.vehicles[0]?.timeInStage ?? '0 min'); }
function durationMinutes(value: string) { return Number(value.match(/(\d+)\s*hr/)?.[1] ?? 0) * 60 + Number(value.match(/(\d+)\s*min/)?.[1] ?? 0); }

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background }, header: { height: 67, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: colors.border }, kicker: { color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 1.5, marginBottom: 4 }, title: { color: colors.text, fontSize: 24, fontWeight: '900', letterSpacing: -0.8 }, history: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  exceptionShell: { height: 58, marginHorizontal: 8, marginTop: 7, zIndex: 9 }, exceptionGlow: { ...StyleSheet.absoluteFillObject, backgroundColor: '#EF4444', borderRadius: 10 }, exceptionBar: { flex: 1, minHeight: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, backgroundColor: '#241315', borderWidth: 1, borderColor: '#7F3035', borderRadius: 9 }, exceptionBarClear: { backgroundColor: '#12171A', borderColor: '#293337' }, exceptionBarHighlighted: { borderWidth: 2, borderColor: '#FF5C62', backgroundColor: '#35171A' }, exceptionIcon: { width: 28, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: '#B52D35', marginRight: 11 }, exceptionIconClear: { backgroundColor: '#314047' }, exceptionIconText: { color: '#FFF', fontSize: 16, fontWeight: '900' }, exceptionCopy: { flex: 1 }, exceptionTitle: { color: '#F7D8DA', fontSize: 10, fontWeight: '900', letterSpacing: 1.15 }, exceptionStatus: { color: '#C9898D', fontSize: 9, fontWeight: '700', marginTop: 3 }, exceptionCount: { color: '#FF737A', fontSize: 20, fontWeight: '900', marginHorizontal: 8 }, exceptionChevron: { color: '#D65C63', fontSize: 24, fontWeight: '600' },
  map: { flex: 1, margin: 7, marginTop: 5, overflow: 'visible', borderWidth: 1, borderColor: '#1C2229', borderRadius: 14, backgroundColor: '#0B0E12' }, floorOutline: { position: 'absolute', left: '5%', right: '5%', top: '2%', bottom: '2%', borderWidth: 1, borderColor: '#171D23', borderRadius: 22 }, horseshoeLane: { position: 'absolute', left: '18%', right: '18%', top: '2%', height: '88%', borderLeftWidth: 3, borderRightWidth: 3, borderBottomWidth: 3, borderColor: '#252B32', borderBottomLeftRadius: 42, borderBottomRightRadius: 42 }, activeRoute: { position: 'absolute', height: 4, backgroundColor: colors.accent, borderRadius: 2, transformOrigin: 'left center', zIndex: 1 }, entrance: { position: 'absolute', color: colors.subtle, fontSize: 6, fontWeight: '900', letterSpacing: 1 }, finish: { position: 'absolute', color: '#5BAE78', fontSize: 6, fontWeight: '900', letterSpacing: 1 },
  zone: { position: 'absolute', width: '34%', height: '17%', minHeight: 72, backgroundColor: '#11161B', borderWidth: 1, borderRadius: 8, padding: 8, overflow: 'hidden', zIndex: 2, shadowRadius: 10 }, entranceZone: { borderTopLeftRadius: 3 }, zoneHighlighted: { borderWidth: 2 }, zoneStripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 }, zoneTop: { minHeight: 28, flexDirection: 'row', alignItems: 'flex-start', gap: 5 }, zoneName: { flex: 1, color: colors.text, fontSize: 13, lineHeight: 14, fontWeight: '900' }, count: { minWidth: 27, height: 27, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, countText: { fontSize: 12, fontWeight: '900' }, oldest: { color: colors.subtle, fontSize: 6.5, fontWeight: '900', letterSpacing: 0.6, marginTop: 2 }, preview: { gap: 2, marginTop: 3 }, previewRow: { flexDirection: 'row', alignItems: 'center' }, dot: { width: 4, height: 4, borderRadius: 2, marginRight: 5 }, previewText: { flex: 1, color: '#AEB5BC', fontSize: 7.5, fontWeight: '700' }, openBay: { color: colors.subtle, fontSize: 7, fontWeight: '900', letterSpacing: 1 }, alerts: { position: 'absolute', right: 7, bottom: 4, flexDirection: 'row', gap: 4 }, priority: { color: colors.accent, fontSize: 5.5, fontWeight: '900' }, aging: { color: '#FB8B65', fontSize: 5.5, fontWeight: '900' }, pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  heartbeat: { position: 'absolute', left: '34%', top: '27%', width: '32%', height: '34%', alignItems: 'center', justifyContent: 'center', zIndex: 3 }, wipLabel: { color: '#5CCB82', fontSize: 9, fontWeight: '900', letterSpacing: 1.7 }, wipNumberWrap: { height: 62, minWidth: 90, alignItems: 'center', justifyContent: 'center' }, wipValue: { fontSize: 56, lineHeight: 62, fontWeight: '900', letterSpacing: -2, textShadowOffset: { width: 0, height: 0 } }, wipChangeText: { position: 'absolute', left: 0, right: 0, textAlign: 'center' }, wipCaption: { color: colors.muted, fontSize: 9, fontWeight: '700' },
  movingVehicle: { position: 'absolute', left: -9, top: -9, width: 18, height: 18, zIndex: 7 }, vehicleGlyph: { width: 18, height: 18, borderRadius: 5, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent, shadowColor: colors.accent, shadowOpacity: 0.7, shadowRadius: 6 }, vehicleGlyphText: { color: colors.background, fontSize: 9, fontWeight: '900' },
});
