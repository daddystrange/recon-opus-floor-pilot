import { useRef, useState } from 'react';
import { Image, Pressable, StatusBar, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const boothDoors = require('../../assets/Industrial doors with _Recon Opus_ branding (1).png');
const OPEN_DURATION = 800;

type Props = {
  onReplaceWithProductionFloor: () => void;
};

export function EntranceScreen({ onReplaceWithProductionFloor }: Props) {
  const { width, height } = useWindowDimensions();
  const progress = useSharedValue(0);
  const openingRef = useRef(false);
  const [opening, setOpening] = useState(false);

  const leftDoorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -progress.value * width / 2 }],
  }));
  const rightDoorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * width / 2 }],
  }));

  const openDoors = () => {
    if (openingRef.current) return;
    openingRef.current = true;
    setOpening(true);
    progress.value = withTiming(
      1,
      { duration: OPEN_DURATION, easing: Easing.bezier(0.48, 0.02, 0.78, 1) },
      (finished) => {
        if (finished) runOnJS(onReplaceWithProductionFloor)();
      },
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <Animated.View pointerEvents="none" style={[styles.panel, styles.leftPanel, { width: width / 2 }, leftDoorStyle]}>
        <Image source={boothDoors} resizeMode="cover" style={{ width, height }} />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.panel, { left: width / 2, width: width / 2 }, rightDoorStyle]}>
        <Image source={boothDoors} resizeMode="cover" style={{ width, height, transform: [{ translateX: -width / 2 }] }} />
      </Animated.View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Enter the Production Floor"
        disabled={opening}
        onPress={openDoors}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#090D0F',
  },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  leftPanel: {
    left: 0,
  },
});
