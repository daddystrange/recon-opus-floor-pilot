import { memo, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, Pressable, StatusBar, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

const openingLogo = require('../../assets/ChatGPT Image Jul 25, 2026, 07_16_28 PM.png');
const floorImage = require('../../assets/recon-opus-floor.png');
const leftDoorImage = require('../../assets/recon-opus-left-door.png');
const rightDoorImage = require('../../assets/recon-opus-right-door.png');

const SCENE_WIDTH = 853;
const SCENE_HEIGHT = 1844;
const DOOR_ASSET_WIDTH = 427;
const DOOR_ASSET_HEIGHT = 1452;
const RIGHT_DOOR_SOURCE_X = 426;
const FLOOR_ASSET_HEIGHT = 392;

const LOGO_FADE_IN_MS = 1600;
const LOGO_HOLD_MS = 2200;
const LOGO_DOOR_CROSSFADE_MS = 2600;
const DOORS_OPEN_MS = 1200;
const REDUCED_MOTION_REVEAL_MS = 320;
const HINT_DELAY_MS = 1000;
const HINT_FADE_MS = 500;

export type EntranceStage = 'logo' | 'shopDoors';

type Props = {
  stage: EntranceStage;
  onLogoComplete: () => void;
  onDoorsComplete: () => void;
};

export const EntranceScreen = memo(function EntranceScreen({ stage, onLogoComplete, onDoorsComplete }: Props) {
  const { width, height } = useWindowDimensions();
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const doorOpacity = useRef(new Animated.Value(0)).current;
  const doorProgress = useRef(new Animated.Value(0)).current;
  const entranceOpacity = useRef(new Animated.Value(1)).current;
  const hintOpacity = useRef(new Animated.Value(0)).current;
  const logoCompletion = useRef<(() => void) | null>(null);
  const doorsCompletion = useRef<(() => void) | null>(null);
  const completionCalled = useRef(false);
  const openingStarted = useRef(false);
  const activeAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const [opening, setOpening] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    logoCompletion.current = onLogoComplete;
    doorsCompletion.current = onDoorsComplete;
    return () => {
      logoCompletion.current = null;
      doorsCompletion.current = null;
    };
  }, [onDoorsComplete, onLogoComplete]);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: LOGO_FADE_IN_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.delay(LOGO_HOLD_MS),
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 0,
          duration: LOGO_DOOR_CROSSFADE_MS,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(doorOpacity, {
          toValue: 1,
          duration: LOGO_DOOR_CROSSFADE_MS,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]);
    activeAnimation.current = animation;
    animation.start(({ finished }) => {
      if (finished) logoCompletion.current?.();
    });
    return () => animation.stop();
  }, [doorOpacity, logoOpacity]);

  useEffect(() => {
    if (stage !== 'shopDoors') return;
    const animation = Animated.sequence([
      Animated.delay(HINT_DELAY_MS),
      Animated.timing(hintOpacity, {
        toValue: 1,
        duration: HINT_FADE_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [hintOpacity, stage]);

  useEffect(() => () => activeAnimation.current?.stop(), []);

  const finishEntrance = () => {
    if (completionCalled.current) return;
    completionCalled.current = true;
    doorsCompletion.current?.();
  };

  const openDoors = () => {
    if (stage !== 'shopDoors' || openingStarted.current) return;
    openingStarted.current = true;
    setOpening(true);
    hintOpacity.stopAnimation();
    hintOpacity.setValue(0);

    const animation = reduceMotion
      ? Animated.timing(entranceOpacity, {
        toValue: 0,
        duration: REDUCED_MOTION_REVEAL_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
      : Animated.timing(doorProgress, {
        toValue: 1,
        duration: DOORS_OPEN_MS,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      });
    activeAnimation.current = animation;
    animation.start(({ finished }) => {
      if (finished) finishEntrance();
    });
  };

  return (
    <Animated.View style={[styles.root, { opacity: entranceOpacity }]}>
      <StatusBar hidden />
      <Animated.View pointerEvents="none" style={[styles.doorLayer, { opacity: doorOpacity }]}>
        <ShopDoorArtwork width={width} height={height} progress={doorProgress} />
      </Animated.View>
      {stage === 'logo' && <Animated.View pointerEvents="none" style={[styles.logoLayer, { opacity: logoOpacity }]}>
        <Image source={openingLogo} resizeMode="contain" style={styles.logo} />
      </Animated.View>}
      {stage === 'shopDoors' && <Pressable
        accessibilityRole="button"
        accessibilityLabel="Enter the shop"
        accessibilityHint="Opens the shop doors and reveals the lobby"
        disabled={opening}
        onPress={openDoors}
        style={StyleSheet.absoluteFill}
      >
        <Animated.View pointerEvents="none" style={[styles.hint, { opacity: hintOpacity }]}>
          <Text style={styles.hintText}>Tap anywhere to enter</Text>
        </Animated.View>
      </Pressable>}
    </Animated.View>
  );
});

const ShopDoorArtwork = memo(function ShopDoorArtwork({ width, height, progress }: { width: number; height: number; progress: Animated.Value }) {
  const coverScale = Math.max(width / SCENE_WIDTH, height / SCENE_HEIGHT);
  const renderedSceneWidth = SCENE_WIDTH * coverScale;
  const renderedSceneHeight = SCENE_HEIGHT * coverScale;
  const sceneLeft = (width - renderedSceneWidth) / 2;
  const sceneTop = (height - renderedSceneHeight) / 2;
  const renderedDoorWidth = DOOR_ASSET_WIDTH * coverScale;
  const renderedDoorHeight = DOOR_ASSET_HEIGHT * coverScale;
  const floorTop = sceneTop + renderedDoorHeight;
  const renderedFloorHeight = FLOOR_ASSET_HEIGHT * coverScale;
  const leftTranslate = progress.interpolate({ inputRange: [0, 1], outputRange: [0, -width / 2] });
  const rightTranslate = progress.interpolate({ inputRange: [0, 1], outputRange: [0, width / 2] });

  return (
    <View pointerEvents="none" style={styles.doorArtwork}>
      <Image source={floorImage} resizeMode="cover" style={[styles.floorAsset, { left: sceneLeft, top: floorTop, width: renderedSceneWidth, height: renderedFloorHeight }]} />
      <Animated.Image source={leftDoorImage} resizeMode="cover" style={[styles.doorAsset, { left: sceneLeft, top: sceneTop, width: renderedDoorWidth, height: renderedDoorHeight, transform: [{ translateX: leftTranslate }] }]} />
      <Animated.Image source={rightDoorImage} resizeMode="cover" style={[styles.doorAsset, { left: sceneLeft + RIGHT_DOOR_SOURCE_X * coverScale, top: sceneTop, width: renderedDoorWidth, height: renderedDoorHeight, transform: [{ translateX: rightTranslate }] }]} />
    </View>
  );
});

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, zIndex: 100, backgroundColor: 'transparent', overflow: 'hidden' },
  doorLayer: { ...StyleSheet.absoluteFillObject },
  logoLayer: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000000' },
  logo: { width: '88%', height: '62%' },
  doorArtwork: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  floorAsset: { position: 'absolute', zIndex: 1 },
  doorAsset: { position: 'absolute', zIndex: 2 },
  hint: { position: 'absolute', left: 0, right: 0, bottom: 34, alignItems: 'center' },
  hintText: { color: '#D8DDE2', fontSize: 11, fontWeight: '700', letterSpacing: 0.5, opacity: 0.42 },
});
