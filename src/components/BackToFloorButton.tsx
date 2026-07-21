import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

export function BackToFloorButton({ onPress }: { onPress: () => void }) {
  const shimmerProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let shimmer: Animated.CompositeAnimation | null = null;
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!mounted || reduceMotion) return;
      shimmer = Animated.loop(Animated.sequence([
        Animated.delay(900),
        Animated.timing(shimmerProgress, { toValue: 1, duration: 1250, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
        Animated.timing(shimmerProgress, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(5150),
      ]));
      shimmer.start();
    });
    return () => { mounted = false; shimmer?.stop(); };
  }, [shimmerProgress]);

  return <View style={styles.shell}>
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Back to Production Floor" hitSlop={8} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <Animated.View pointerEvents="none" style={[styles.shimmer, { transform: [{ translateX: shimmerProgress.interpolate({ inputRange: [0, 1], outputRange: [-95, 450] }) }, { rotate: '16deg' }] }]}><View style={styles.shimmerSoft} /><View style={styles.shimmerEdge} /></Animated.View>
      <Text style={styles.icon}>‹</Text><Text style={styles.text}>Back to Production Floor</Text>
    </Pressable>
  </View>;
}

const styles = StyleSheet.create({
  shell: { height: 56, marginHorizontal: 20, marginTop: 12, marginBottom: 2 },
  button: { flex: 1, minHeight: 56, paddingHorizontal: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: '#123D70', borderWidth: 1, borderColor: '#527795', borderRadius: 14, shadowColor: '#050A10', shadowOpacity: 0.38, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  shimmer: { position: 'absolute', top: -17, left: 0, width: 62, height: 90, flexDirection: 'row', alignItems: 'stretch' },
  shimmerSoft: { flex: 1, backgroundColor: 'rgba(201,225,244,0.075)' },
  shimmerEdge: { width: 2, backgroundColor: 'rgba(239,248,255,0.42)', marginRight: 15 },
  icon: { zIndex: 1, color: '#C4D9EB', fontSize: 30, lineHeight: 32, marginRight: 9, marginTop: -2 },
  text: { zIndex: 1, color: '#F2F7FF', fontSize: 15, fontWeight: '900' },
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }], backgroundColor: '#18508E' },
});
