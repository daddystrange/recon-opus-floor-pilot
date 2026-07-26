import { memo, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { cancelAnimation, Easing, Extrapolation, interpolate, interpolateColor, useAnimatedProps, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { workflowColors, workflowTracerColors, workflowTracerStops } from '../theme/workflowColors';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const path = 'M 210 55 L 210 870 C 210 930 255 960 315 960 L 685 960 C 745 960 790 930 790 870 L 790 55';
const PULSE_TRAVEL_MS = 1450;
const PULSE_REST_MS = 3000;
const surgeStart = 40 / PULSE_TRAVEL_MS;
const surgeEnd = 1370 / PULSE_TRAVEL_MS;
const fadeEnd = 1430 / PULSE_TRAVEL_MS;

export const HorseshoeFlow = memo(function HorseshoeFlow({ reduceMotion, running = true }: { reduceMotion: boolean; running?: boolean }) {
  const timeline = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(timeline);
    timeline.value = 0;
    if (!reduceMotion && running) {
      timeline.value = withRepeat(
        withSequence(
          withTiming(1, { duration: PULSE_TRAVEL_MS, easing: Easing.linear }),
          withDelay(PULSE_REST_MS, withTiming(0, { duration: 0 })),
        ),
        -1,
        false,
      );
    }
    return () => cancelAnimation(timeline);
  }, [reduceMotion, running, timeline]);

  const haloProps = useAnimatedProps(() => {
    const progress = interpolate(timeline.value, [surgeStart, surgeEnd], [0, 1], Extrapolation.CLAMP);
    const opacity = interpolate(timeline.value, [0, surgeStart, surgeEnd, fadeEnd], [0, 0.13, 0.13, 0], Extrapolation.CLAMP);
    return { stroke: interpolateColor(progress, workflowTracerStops, workflowTracerColors), strokeDashoffset: interpolate(progress, [0, 1], [0, -2167]), opacity };
  });
  const tailProps = useAnimatedProps(() => {
    const progress = interpolate(timeline.value, [surgeStart, surgeEnd], [0, 1], Extrapolation.CLAMP);
    const opacity = interpolate(timeline.value, [0, surgeStart, surgeEnd, fadeEnd], [0, 0.68, 0.68, 0], Extrapolation.CLAMP);
    return { stroke: interpolateColor(progress, workflowTracerStops, workflowTracerColors), strokeDashoffset: interpolate(progress, [0, 1], [0, -2175]), opacity };
  });
  const coreProps = useAnimatedProps(() => {
    const progress = interpolate(timeline.value, [surgeStart, surgeEnd], [0, 1], Extrapolation.CLAMP);
    const opacity = interpolate(timeline.value, [0, surgeStart, surgeEnd, fadeEnd], [0, 1, 1, 0], Extrapolation.CLAMP);
    return { strokeDashoffset: interpolate(progress, [0, 1], [0, -2277]), opacity };
  });

  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <Svg style={styles.svg} viewBox="0 0 1000 1000" preserveAspectRatio="none">
      <Path d={path} fill="none" stroke="#29333D" strokeWidth={8} strokeLinecap="round" />
      {reduceMotion ? <Path d={path} fill="none" stroke={workflowColors.Detail} strokeWidth={4} strokeLinecap="round" opacity={0.55} /> : <>
        <AnimatedPath d={path} fill="none" strokeWidth={14} strokeLinecap="round" strokeDasharray="112 2201" animatedProps={haloProps} />
        <AnimatedPath d={path} fill="none" strokeWidth={7} strokeLinecap="round" strokeDasharray="102 2211" animatedProps={tailProps} />
        <AnimatedPath d={path} fill="none" stroke="#F2FAFF" strokeWidth={5} strokeLinecap="round" strokeDasharray="36 2277" animatedProps={coreProps} />
      </>}
    </Svg>
    <View style={[styles.endpoint, styles.finishEndpoint, { borderColor: workflowColors.Delivery }]}><View><Text style={[styles.endpointLabel, styles.finishLabel, { color: workflowColors.Delivery }]}>FINISH</Text><Text style={styles.endpointHint}>PRODUCTION OUT</Text></View><Text style={[styles.finishMark, { color: workflowColors.Delivery }]}>✓</Text></View>
  </View>;
});

const styles = StyleSheet.create({
  svg: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
  endpoint: { position: 'absolute', top: '1.2%', minHeight: 31, width: '27%', paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: '#151B21', borderWidth: 1, borderColor: '#394550', borderRadius: 8, zIndex: 5 },
  finishEndpoint: { right: '2.2%', justifyContent: 'flex-end' },
  endpointLabel: { color: '#DCE8F0', fontSize: 9, lineHeight: 11, fontWeight: '900', letterSpacing: 0.8 },
  endpointHint: { color: '#677887', fontSize: 5.5, lineHeight: 8, fontWeight: '900', letterSpacing: 0.65 },
  finishLabel: { color: '#B6E4FF', textAlign: 'right' }, finishMark: { color: '#A8DFFF', fontSize: 15, fontWeight: '900', marginLeft: 6 },
});
