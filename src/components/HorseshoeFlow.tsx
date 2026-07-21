import { memo, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { cancelAnimation, Easing, Extrapolation, interpolate, useAnimatedProps, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const path = 'M 180 55 L 180 870 C 180 930 225 960 285 960 L 715 960 C 775 960 820 930 820 870 L 820 55';
const cycleDuration = 5050;
const surgeStart = 380 / cycleDuration;
const surgeEnd = 2130 / cycleDuration;
const fadeEnd = 2300 / cycleDuration;

export const HorseshoeFlow = memo(function HorseshoeFlow({ reduceMotion }: { reduceMotion: boolean }) {
  const timeline = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(timeline);
    timeline.value = 0;
    if (!reduceMotion) timeline.value = withRepeat(withTiming(1, { duration: cycleDuration, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(timeline);
  }, [reduceMotion, timeline]);

  const haloProps = useAnimatedProps(() => {
    const progress = interpolate(timeline.value, [surgeStart, surgeEnd], [0, 1], Extrapolation.CLAMP);
    const opacity = interpolate(timeline.value, [300 / cycleDuration, surgeStart, surgeEnd, fadeEnd], [0, 0.16, 0.16, 0], Extrapolation.CLAMP);
    return { strokeDashoffset: interpolate(progress, [0, 1], [0, -2227]), opacity };
  });
  const tailProps = useAnimatedProps(() => {
    const progress = interpolate(timeline.value, [surgeStart, surgeEnd], [0, 1], Extrapolation.CLAMP);
    const opacity = interpolate(timeline.value, [300 / cycleDuration, surgeStart, surgeEnd, fadeEnd], [0, 0.58, 0.58, 0], Extrapolation.CLAMP);
    return { strokeDashoffset: interpolate(progress, [0, 1], [0, -2235]), opacity };
  });
  const coreProps = useAnimatedProps(() => {
    const progress = interpolate(timeline.value, [surgeStart, surgeEnd], [0, 1], Extrapolation.CLAMP);
    const opacity = interpolate(timeline.value, [300 / cycleDuration, surgeStart, surgeEnd, fadeEnd], [0, 1, 1, 0], Extrapolation.CLAMP);
    return { strokeDashoffset: interpolate(progress, [0, 1], [0, -2337]), opacity };
  });
  const entrancePulseStyle = useAnimatedStyle(() => {
    const opacity = interpolate(timeline.value, [0, 110 / cycleDuration, 300 / cycleDuration], [0, 1, 0], Extrapolation.CLAMP);
    return { opacity, transform: [{ scale: interpolate(opacity, [0, 1], [1, 1.08]) }] };
  });
  const finishPulseStyle = useAnimatedStyle(() => {
    const opacity = interpolate(timeline.value, [surgeEnd, 2240 / cycleDuration, 2550 / cycleDuration], [0, 1, 0], Extrapolation.CLAMP);
    return { opacity, transform: [{ scale: interpolate(opacity, [0, 1], [1, 1.08]) }] };
  });

  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <Svg style={styles.svg} viewBox="0 0 1000 1000" preserveAspectRatio="none">
      <Path d={path} fill="none" stroke="#29333D" strokeWidth={8} strokeLinecap="round" />
      {reduceMotion ? <Path d={path} fill="none" stroke="#76BFF0" strokeWidth={4} strokeLinecap="round" opacity={0.55} /> : <>
        <AnimatedPath d={path} fill="none" stroke="#2C8FE8" strokeWidth={24} strokeLinecap="round" strokeDasharray="146 2227" animatedProps={haloProps} />
        <AnimatedPath d={path} fill="none" stroke="#319FF4" strokeWidth={11} strokeLinecap="round" strokeDasharray="138 2235" animatedProps={tailProps} />
        <AnimatedPath d={path} fill="none" stroke="#F2FAFF" strokeWidth={5} strokeLinecap="round" strokeDasharray="36 2337" animatedProps={coreProps} />
      </>}
    </Svg>
    <View style={[styles.endpoint, styles.entranceEndpoint]}><Animated.View style={[styles.endpointPulse, styles.entrancePulse, entrancePulseStyle]} /><View style={styles.entranceMark} /><View><Text style={styles.endpointLabel}>ENTRANCE</Text><Text style={styles.endpointHint}>VEHICLES IN</Text></View></View>
    <View style={[styles.endpoint, styles.finishEndpoint]}><Animated.View style={[styles.endpointPulse, styles.finishPulse, finishPulseStyle]} /><View><Text style={[styles.endpointLabel, styles.finishLabel]}>FINISH</Text><Text style={styles.endpointHint}>PRODUCTION OUT</Text></View><Text style={styles.finishMark}>✓</Text></View>
  </View>;
});

const styles = StyleSheet.create({
  svg: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
  endpoint: { position: 'absolute', top: '1.2%', minHeight: 31, width: '27%', paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: '#151B21', borderWidth: 1, borderColor: '#394550', borderRadius: 8, zIndex: 5 },
  endpointPulse: { ...StyleSheet.absoluteFillObject, borderWidth: 2, borderRadius: 8 },
  entrancePulse: { borderColor: '#77C7FA' }, finishPulse: { borderColor: '#A8DFFF' },
  entranceEndpoint: { left: '2.2%' }, finishEndpoint: { right: '2.2%', justifyContent: 'flex-end' },
  entranceMark: { width: 5, height: 20, borderRadius: 2, backgroundColor: '#8DD7FF', marginRight: 7 },
  endpointLabel: { color: '#DCE8F0', fontSize: 9, lineHeight: 11, fontWeight: '900', letterSpacing: 0.8 },
  endpointHint: { color: '#677887', fontSize: 5.5, lineHeight: 8, fontWeight: '900', letterSpacing: 0.65 },
  finishLabel: { color: '#B6E4FF', textAlign: 'right' }, finishMark: { color: '#A8DFFF', fontSize: 15, fontWeight: '900', marginLeft: 6 },
});
