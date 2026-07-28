import { useEffect, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { Animated, Easing, Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { colors } from '../theme/colors';

const shopInteriorImage = require('../../assets/recon-opus-shop-interior.png');
const floorImage = require('../../assets/recon-opus-floor.png');

type Props = {
  contentVisible?: boolean;
  interactive?: boolean;
  onOpenIntake: () => void;
  onOpenProductionFloor: () => void;
  onOpenOffice: () => void;
};

type DestinationKey = 'intake' | 'floor' | 'office';

const destinations: ReadonlyArray<{ key: DestinationKey; title: string; subtitle: string }> = [
  { key: 'intake', title: 'INTAKE', subtitle: 'CHECK IN  •  INSPECT  •  PLAN' },
  { key: 'floor', title: 'PRODUCTION FLOOR', subtitle: 'THE HEART OF THE SHOP' },
  { key: 'office', title: 'THE OFFICE', subtitle: 'MANAGE  •  REVIEW  •  ASSIGN' },
];

const SCENE_WIDTH = 853;
const SCENE_HEIGHT = 1844;
const FLOOR_START_Y = 1452;
const FLOOR_ASSET_HEIGHT = 392;
const PANEL_HEIGHT = 104;
const PRIMARY_PANEL_HEIGHT = 112;
const PANEL_GAP = 20;
const GROUP_TOP_RATIO = 0.15;
const GROUP_FLOOR_CLEARANCE = 44;
const SELECTION_DURATION_MS = 120;

export function ShopLobbyScreen({ contentVisible = true, interactive = true, onOpenIntake, onOpenProductionFloor, onOpenOffice }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<DestinationKey | null>(null);
  const selectionProgress = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(contentVisible ? 1 : 0)).current;
  const entranceScale = Math.max(width / SCENE_WIDTH, height / SCENE_HEIGHT);
  const renderedSceneWidth = SCENE_WIDTH * entranceScale;
  const entranceLeft = (width - renderedSceneWidth) / 2;
  const entranceTop = (height - SCENE_HEIGHT * entranceScale) / 2;
  const floorTop = entranceTop + FLOOR_START_Y * entranceScale;
  const groupHeight = PANEL_HEIGHT * 2 + PRIMARY_PANEL_HEIGHT + PANEL_GAP * 2;
  const groupTop = Math.max(insets.top + 24, Math.min(height * GROUP_TOP_RATIO, floorTop - groupHeight - GROUP_FLOOR_CLEARANCE));
  const actions: Record<DestinationKey, () => void> = {
    intake: onOpenIntake,
    floor: onOpenProductionFloor,
    office: onOpenOffice,
  };

  useEffect(() => {
    const animation = Animated.timing(contentOpacity, {
      toValue: contentVisible ? 1 : 0,
      duration: contentVisible ? 300 : 0,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [contentOpacity, contentVisible]);

  const selectDestination = (key: DestinationKey) => {
    if (selected) return;
    setSelected(key);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    selectionProgress.setValue(0);
    Animated.timing(selectionProgress, {
      toValue: 1,
      duration: SELECTION_DURATION_MS,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) actions[key]();
    });
  };

  return (
    <View
      style={styles.page}
      pointerEvents={interactive ? 'auto' : 'none'}
      accessibilityElementsHidden={!interactive}
      importantForAccessibility={interactive ? 'auto' : 'no-hide-descendants'}
    >
      <Image
        source={shopInteriorImage}
        resizeMode="cover"
        style={[styles.shopEnvironment, {
          left: entranceLeft,
          top: entranceTop,
          width: renderedSceneWidth,
          height: SCENE_HEIGHT * entranceScale,
        }]}
      />
      <View pointerEvents="none" style={styles.environmentWash} />
      <Image
        source={floorImage}
        resizeMode="cover"
        style={[styles.floorBackground, {
          left: entranceLeft,
          top: floorTop,
          width: renderedSceneWidth,
          height: FLOOR_ASSET_HEIGHT * entranceScale,
        }]}
      />
      <View pointerEvents="none" style={styles.ambientLight} />
      <Animated.View style={[styles.wayfinding, { gap: PANEL_GAP, marginTop: groupTop, opacity: contentOpacity }]}>
        {destinations.map((destination) => {
          const isPrimary = destination.key === 'floor';
          const isSelected = selected === destination.key;
          const isReceding = selected !== null && !isSelected;
          const opacity = isReceding
            ? selectionProgress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.24] })
            : 1;
          const scale = isSelected
            ? selectionProgress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.97] })
            : 1;
          const edgeOpacity = isSelected
            ? selectionProgress.interpolate({ inputRange: [0, 1], outputRange: [0.22, 0.78] })
            : isPrimary ? 0.36 : 0.22;
          const specularOpacity = isSelected
            ? selectionProgress.interpolate({
              inputRange: [0, 0.16, 0.72, 1],
              outputRange: [0, 0.1, 0.045, 0],
            })
            : 0;
          const specularTranslate = isSelected
            ? selectionProgress.interpolate({ inputRange: [0, 1], outputRange: [-190, 410] })
            : -190;

          return (
            <Animated.View
              key={destination.key}
              style={[styles.panelShell, isPrimary && styles.panelShellPrimary, { height: isPrimary ? PRIMARY_PANEL_HEIGHT : PANEL_HEIGHT, opacity, transform: [{ scale }] }]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Go to ${destination.title}`}
                disabled={!interactive || selected !== null}
                onPress={() => selectDestination(destination.key)}
                style={({ pressed }) => [styles.panel, isPrimary && styles.panelPrimary, pressed && !selected && styles.panelPressed]}
              >
                <SmokedAcrylicSurface />
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.specularPass,
                    {
                      opacity: specularOpacity,
                      transform: [{ translateX: specularTranslate }, { rotate: '-11deg' }],
                    },
                  ]}
                />
                <Animated.View pointerEvents="none" style={[styles.edgeLight, { opacity: edgeOpacity }]} />
                <View pointerEvents="none" style={styles.panelContent}>
                  <View style={styles.iconWell}><DestinationIcon destination={destination.key} /></View>
                  <View style={styles.panelDivider} />
                  <View style={styles.textBlock}>
                    <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.88} style={[styles.destination, isPrimary && styles.destinationPrimary, isSelected && styles.destinationSelected]}>{destination.title}</Text>
                    <Text numberOfLines={1} style={[styles.destinationSubtitle, isPrimary && styles.destinationSubtitlePrimary]}>{destination.subtitle}</Text>
                  </View>
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </Animated.View>
    </View>
  );
}

function DestinationIcon({ destination }: { destination: DestinationKey }) {
  if (destination === 'intake') {
    return <Svg width={42} height={42} viewBox="0 0 48 48">
      <Rect x="12" y="9" width="24" height="32" rx="4" fill="none" stroke="#A9D7EF" strokeWidth="1.8" />
      <Path d="M19 9V7.5A3.5 3.5 0 0 1 22.5 4h3A3.5 3.5 0 0 1 29 7.5V9" fill="none" stroke="#A9D7EF" strokeWidth="1.8" />
      <Path d="m17 20 2.5 2.5L24 18M17 30l2.5 2.5L24 28M27 21h5M27 31h5" fill="none" stroke="#72AFCF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>;
  }
  if (destination === 'floor') {
    return <Svg width={46} height={46} viewBox="0 0 48 48">
      <Line x1="8" y1="8" x2="8" y2="41" stroke="#A9D7EF" strokeWidth="1.8" />
      <Line x1="40" y1="8" x2="40" y2="41" stroke="#A9D7EF" strokeWidth="1.8" />
      <Line x1="5" y1="41" x2="12" y2="41" stroke="#72AFCF" strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="36" y1="41" x2="43" y2="41" stroke="#72AFCF" strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M14 19.5 18 14h12l4 5.5 2 1.5v8H12v-8l2-1.5Z" fill="none" stroke="#A9D7EF" strokeWidth="1.8" strokeLinejoin="round" />
      <Circle cx="17" cy="24" r="2" fill="none" stroke="#72AFCF" strokeWidth="1.6" />
      <Circle cx="31" cy="24" r="2" fill="none" stroke="#72AFCF" strokeWidth="1.6" />
      <Line x1="8" y1="32" x2="17" y2="28.5" stroke="#72AFCF" strokeWidth="1.6" />
      <Line x1="40" y1="32" x2="31" y2="28.5" stroke="#72AFCF" strokeWidth="1.6" />
    </Svg>;
  }
  return <Svg width={42} height={42} viewBox="0 0 48 48">
    <Rect x="21" y="7" width="20" height="15" rx="2" fill="none" stroke="#A9D7EF" strokeWidth="1.8" />
    <Line x1="31" y1="22" x2="31" y2="27" stroke="#72AFCF" strokeWidth="1.8" />
    <Line x1="26" y1="27" x2="36" y2="27" stroke="#72AFCF" strokeWidth="1.8" strokeLinecap="round" />
    <Path d="M8 28h33v4H12v10M35 32v10" fill="none" stroke="#A9D7EF" strokeWidth="1.8" strokeLinejoin="round" />
    <Circle cx="14" cy="18" r="5" fill="none" stroke="#72AFCF" strokeWidth="1.8" />
    <Path d="M9 28v-3a5 5 0 0 1 10 0v9h-7" fill="none" stroke="#72AFCF" strokeWidth="1.8" strokeLinecap="round" />
  </Svg>;
}

function SmokedAcrylicSurface() {
  return (
    <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width="100%" height="100%">
      <Defs>
        <LinearGradient id="smokedAcrylic" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#263039" stopOpacity="0.58" />
          <Stop offset="0.36" stopColor="#182127" stopOpacity="0.48" />
          <Stop offset="1" stopColor="#0D1318" stopOpacity="0.66" />
        </LinearGradient>
        <LinearGradient id="ambientBlue" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#4E91BA" stopOpacity="0.012" />
          <Stop offset="0.46" stopColor="#72A9C9" stopOpacity="0.06" />
          <Stop offset="0.72" stopColor="#4F86A8" stopOpacity="0.025" />
          <Stop offset="1" stopColor="#315873" stopOpacity="0.008" />
        </LinearGradient>
        <LinearGradient id="softSpecular" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F5F8FA" stopOpacity="0.065" />
          <Stop offset="0.22" stopColor="#CFD7DC" stopOpacity="0.016" />
          <Stop offset="1" stopColor="#88939A" stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#smokedAcrylic)" />
      <Rect width="100%" height="100%" fill="url(#ambientBlue)" />
      <Rect x="1" y="1" width="99.2%" height="98.3%" rx="23" fill="url(#softSpecular)" />
      <Rect x="2.5" y="2.5" width="98.5%" height="96%" rx="21" fill="none" stroke="#9BC7DF" strokeOpacity="0.2" strokeWidth="0.65" />
      <Rect x="5" y="5" width="97.2%" height="92.3%" rx="19" fill="none" stroke="#14232D" strokeOpacity="0.5" strokeWidth="0.6" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 22,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  shopEnvironment: {
    position: 'absolute',
  },
  environmentWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(3, 7, 10, 0.30)',
  },
  floorBackground: {
    position: 'absolute',
  },
  ambientLight: {
    position: 'absolute',
    alignSelf: 'center',
    top: '14%',
    width: '82%',
    height: '68%',
    borderRadius: 48,
    backgroundColor: 'rgba(72, 84, 97, 0.055)',
  },
  wayfinding: {
    width: '100%',
  },
  panelShell: {
    height: PANEL_HEIGHT,
    shadowColor: '#000000',
    shadowOpacity: 0.46,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 9,
  },
  panelShellPrimary: {
    marginHorizontal: -6,
    shadowColor: '#5D9FC7',
    shadowOpacity: 0.3,
    shadowRadius: 27,
    elevation: 11,
  },
  panel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.75,
    borderColor: '#51616D',
    borderRadius: 24,
    backgroundColor: 'rgba(19, 25, 30, 0.84)',
    overflow: 'hidden',
  },
  panelPrimary: {
    borderColor: '#66849A',
    backgroundColor: 'rgba(17, 27, 34, 0.88)',
  },
  panelPressed: {
    backgroundColor: colors.panelRaised,
    borderColor: '#B9DBEE',
    transform: [{ scale: 0.97 }],
  },
  specularPass: {
    position: 'absolute',
    top: -30,
    bottom: -30,
    width: 72,
    backgroundColor: '#DCE9F1',
  },
  edgeLight: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 0.75,
    borderColor: '#82BCE0',
    borderRadius: 24,
    backgroundColor: 'rgba(82, 145, 181, 0.055)',
  },
  panelContent: {
    width: '100%',
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWell: {
    width: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelDivider: {
    width: 1,
    height: 52,
    marginHorizontal: 16,
    backgroundColor: 'rgba(168, 193, 207, 0.24)',
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  destination: {
    color: '#E6E9ED',
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '700',
    letterSpacing: 2.2,
  },
  destinationPrimary: {
    color: '#F4F8FB',
    fontSize: 19,
    letterSpacing: 2.4,
  },
  destinationSubtitle: {
    color: '#8FA8B7',
    fontSize: 8,
    lineHeight: 12,
    fontWeight: '700',
    letterSpacing: 0.9,
    marginTop: 5,
  },
  destinationSubtitlePrimary: {
    color: '#A6C8DA',
  },
  destinationSelected: {
    color: colors.white,
  },
});
