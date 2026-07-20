import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Vehicle } from '../types';
import { colors } from '../theme/colors';

type Props = {
  vehicle: Vehicle;
  onPress: () => void;
  onLongPress: () => void;
  lifted: boolean;
  exitDirection?: -1 | 1;
  onExitComplete?: () => void;
};

export function VehicleCard({ vehicle, onPress, onLongPress, lifted, exitDirection, onExitComplete }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const exitStarted = useRef(false);
  const longPressTriggered = useRef(false);
  const exitCompleteRef = useRef(onExitComplete);
  exitCompleteRef.current = onExitComplete;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: lifted ? 1.025 : 1, useNativeDriver: true, speed: 24, bounciness: 5 }),
      Animated.spring(translateY, { toValue: lifted ? -4 : 0, useNativeDriver: true, speed: 24, bounciness: 5 }),
    ]).start();
  }, [lifted, scale, translateY]);

  useEffect(() => {
    if (!exitDirection || exitStarted.current) return;
    exitStarted.current = true;
    Animated.parallel([
      Animated.timing(translateX, { toValue: exitDirection * 520, duration: 320, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]).start(({ finished }) => { if (finished) exitCompleteRef.current?.(); });
  }, [exitDirection, opacity, translateX]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateX }, { translateY }, { scale }] }}>
      <Pressable
        onPress={() => {
          if (longPressTriggered.current) {
            longPressTriggered.current = false;
            return;
          }
          onPress();
        }}
        onLongPress={() => {
          longPressTriggered.current = true;
          onLongPress();
        }}
        delayLongPress={380}
        accessibilityRole="button"
        accessibilityHint="Tap for details. Long press to move this vehicle."
        accessibilityLabel={`${vehicle.year} ${vehicle.make} ${vehicle.model}, ${vehicle.status}`}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      >
        <View style={[styles.ribbon, { backgroundColor: vehicle.statusColor }]} />
        <View style={styles.content}>
          <View style={styles.topRow}>
            <View style={styles.titleWrap}>
              <Text style={styles.eyebrow}>{vehicle.year} · {vehicle.color.toUpperCase()}</Text>
              <Text style={styles.title} numberOfLines={1}>{vehicle.make} {vehicle.model}</Text>
            </View>
            {vehicle.priority && <View style={styles.priority}><Text style={styles.priorityText}>PRIORITY</Text></View>}
          </View>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: vehicle.statusColor }]} />
            <Text style={[styles.status, { color: vehicle.statusColor }]}>{vehicle.status.toUpperCase()}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metaRow}>
            <View><Text style={styles.metaLabel}>STOCK</Text><Text style={styles.metaValue}>{vehicle.stockNumber}</Text></View>
            <View style={styles.metaWide}><Text style={styles.metaLabel}>LOCATION</Text><Text style={styles.metaValue}>{vehicle.location}</Text></View>
            <View><Text style={styles.metaLabel}>{vehicle.department === 'Parts Hold' ? 'HOLD TIME' : 'IN STAGE'}</Text><Text style={styles.metaValue}>{vehicle.timeInStage}</Text></View>
            <Text style={styles.chevron}>›</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.panelRaised, borderRadius: 14, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', flexDirection: 'row', minHeight: 188, marginBottom: 14 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  ribbon: { width: 6 },
  content: { flex: 1, padding: 18 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  titleWrap: { flex: 1 },
  eyebrow: { color: colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 6 },
  title: { color: colors.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  priority: { backgroundColor: colors.accentSoft, borderRadius: 5, paddingHorizontal: 8, paddingVertical: 5, borderWidth: 1, borderColor: '#5A4714' },
  priorityText: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  statusDot: { width: 7, height: 7, borderRadius: 4, marginRight: 8 },
  status: { fontSize: 12, fontWeight: '900', letterSpacing: 1.1 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 15 },
  metaRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 18 },
  metaWide: { flex: 1 },
  metaLabel: { color: colors.subtle, fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  metaValue: { color: '#C8CDD3', fontSize: 12, fontWeight: '600' },
  chevron: { color: colors.subtle, fontSize: 28, lineHeight: 25, marginLeft: -6 },
});
