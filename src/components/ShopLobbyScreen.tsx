import { useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { Animated, Easing, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { colors } from '../theme/colors';

type Props = {
  interactive?: boolean;
  onOpenIntake: () => void;
  onOpenProductionFloor: () => void;
  onOpenOffice: () => void;
};

type DestinationKey = 'intake' | 'floor' | 'office';

const destinations: ReadonlyArray<{ key: DestinationKey; title: string }> = [
  { key: 'intake', title: 'INTAKE' },
  { key: 'office', title: 'THE OFFICE' },
  { key: 'floor', title: 'PRODUCTION FLOOR' },
];

const SCENE_WIDTH = 853;
const SCENE_HEIGHT = 1844;
const FLOOR_START_Y = 1452;
const PANEL_HEIGHT = 128;
const GROUP_TOP_GAP = 24;
const FLOOR_CLEARANCE = 50;
const MIN_PANEL_GAP = 22;
const SELECTION_DURATION_MS = 120;

export function ShopLobbyScreen({ interactive = true, onOpenIntake, onOpenProductionFloor, onOpenOffice }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<DestinationKey | null>(null);
  const selectionProgress = useRef(new Animated.Value(0)).current;
  const entranceScale = Math.max(width / SCENE_WIDTH, height / SCENE_HEIGHT);
  const entranceTop = (height - SCENE_HEIGHT * entranceScale) / 2;
  const floorTop = entranceTop + FLOOR_START_Y * entranceScale;
  const availableGroupHeight = floorTop - insets.top - FLOOR_CLEARANCE - GROUP_TOP_GAP;
  const panelGap = Math.max(MIN_PANEL_GAP, (availableGroupHeight - PANEL_HEIGHT * destinations.length) / (destinations.length - 1));
  const actions: Record<DestinationKey, () => void> = {
    intake: onOpenIntake,
    floor: onOpenProductionFloor,
    office: onOpenOffice,
  };

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
      <View pointerEvents="none" style={styles.ambientLight} />
      <View style={[styles.wayfinding, { gap: panelGap, marginTop: GROUP_TOP_GAP }]}>
        {destinations.map((destination) => {
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
            : 0.22;
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
              style={[styles.panelShell, { opacity, transform: [{ scale }] }]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Go to ${destination.title}`}
                disabled={!interactive || selected !== null}
                onPress={() => selectDestination(destination.key)}
                style={({ pressed }) => [styles.panel, pressed && !selected && styles.panelPressed]}
              >
                <SatinGunmetalSurface />
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
                <Text style={[styles.destination, isSelected && styles.destinationSelected]}>
                  {destination.title}
                </Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

function SatinGunmetalSurface() {
  return (
    <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width="100%" height="100%">
      <Defs>
        <LinearGradient id="satinGunmetal" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#303840" stopOpacity="0.78" />
          <Stop offset="0.22" stopColor="#222A31" stopOpacity="0.6" />
          <Stop offset="0.68" stopColor="#12181D" stopOpacity="0.42" />
          <Stop offset="1" stopColor="#20272D" stopOpacity="0.7" />
        </LinearGradient>
        <LinearGradient id="ambientBlue" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#4E91BA" stopOpacity="0.012" />
          <Stop offset="0.46" stopColor="#72A9C9" stopOpacity="0.085" />
          <Stop offset="0.72" stopColor="#4F86A8" stopOpacity="0.025" />
          <Stop offset="1" stopColor="#315873" stopOpacity="0.008" />
        </LinearGradient>
        <LinearGradient id="softSpecular" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F5F8FA" stopOpacity="0.085" />
          <Stop offset="0.22" stopColor="#CFD7DC" stopOpacity="0.022" />
          <Stop offset="1" stopColor="#88939A" stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#satinGunmetal)" />
      <Rect width="100%" height="100%" fill="url(#ambientBlue)" />
      <Rect x="1" y="1" width="99.2%" height="98.3%" rx="23" fill="url(#softSpecular)" />
      <Rect x="2.5" y="2.5" width="98.5%" height="96%" rx="21" fill="none" stroke="#83B9D8" strokeOpacity="0.24" strokeWidth="0.75" />
      <Rect x="5" y="5" width="97.2%" height="92.3%" rx="19" fill="none" stroke="#14232D" strokeOpacity="0.68" strokeWidth="0.75" />
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
  panel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.75,
    borderColor: '#51616D',
    borderRadius: 24,
    backgroundColor: 'rgba(19, 25, 30, 0.9)',
    overflow: 'hidden',
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
  destination: {
    color: '#E6E9ED',
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '700',
    letterSpacing: 2.8,
    textAlign: 'center',
  },
  destinationSelected: {
    color: colors.white,
  },
});
