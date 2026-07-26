import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Pressable, StatusBar, StyleSheet, useWindowDimensions, View } from 'react-native';

const floorImage = require('../../assets/recon-opus-floor.png');
const leftDoorImage = require('../../assets/recon-opus-left-door.png');
const rightDoorImage = require('../../assets/recon-opus-right-door.png');

const SCENE_WIDTH = 853;
const SCENE_HEIGHT = 1844;
const DOOR_ASSET_WIDTH = 427;
const DOOR_ASSET_HEIGHT = 1452;
const RIGHT_DOOR_SOURCE_X = 426;
const FLOOR_ASSET_HEIGHT = 392;

const DOORS_OPEN_MS = 1200;

type Props = {
  showDoors: boolean;
  onEnterLobby: () => void;
};

export function EntranceScreen({ showDoors, onEnterLobby }: Props) {
  const doorProgress = useRef(new Animated.Value(0)).current;
  const doorAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const openingStarted = useRef(false);
  const [opening, setOpening] = useState(false);
  const [doorsVisible, setDoorsVisible] = useState(showDoors);

  const openDoors = () => {
    if (openingStarted.current) return;
    openingStarted.current = true;
    setOpening(true);
    const animation = Animated.timing(doorProgress, {
      toValue: 1,
      duration: DOORS_OPEN_MS,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    });
    doorAnimation.current = animation;
    animation.start(({ finished: doorsOpen }) => {
      if (!doorsOpen) return;
      setDoorsVisible(false);
      onEnterLobby();
    });
  };

  useEffect(() => () => doorAnimation.current?.stop(), []);

  return (
    <View pointerEvents="box-none" style={styles.root}>
      {showDoors && <StatusBar hidden />}
      <ShopDoorScene doorsVisible={doorsVisible} progress={doorProgress} />
      {doorsVisible && <Pressable
        accessibilityRole="button"
        accessibilityLabel="Enter the shop lobby"
        disabled={opening}
        onPress={openDoors}
        style={StyleSheet.absoluteFill}
      />}
    </View>
  );
}

function ShopDoorScene({ doorsVisible, progress }: { doorsVisible: boolean; progress: Animated.Value }) {
  const { width, height } = useWindowDimensions();
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
    <View pointerEvents="none" style={styles.doorScene}>
      <Image
        source={floorImage}
        resizeMode="cover"
        style={[styles.floorAsset, { left: sceneLeft, top: floorTop, width: renderedSceneWidth, height: renderedFloorHeight }]}
      />
      {doorsVisible && <Animated.Image
        source={leftDoorImage}
        resizeMode="cover"
        style={[styles.doorAsset, { left: sceneLeft, top: sceneTop, width: renderedDoorWidth, height: renderedDoorHeight, transform: [{ translateX: leftTranslate }] }]}
      />}
      {doorsVisible && <Animated.Image
        source={rightDoorImage}
        resizeMode="cover"
        style={[styles.doorAsset, { left: sceneLeft + RIGHT_DOOR_SOURCE_X * coverScale, top: sceneTop, width: renderedDoorWidth, height: renderedDoorHeight, transform: [{ translateX: rightTranslate }] }]}
      />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    overflow: 'hidden',
  },
  doorScene: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  floorAsset: {
    position: 'absolute',
    zIndex: 1,
  },
  doorAsset: {
    position: 'absolute',
    zIndex: 2,
  },
});
