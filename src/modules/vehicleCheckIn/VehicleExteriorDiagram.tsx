import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { ExteriorPanel, ExteriorPanelId, exteriorPanels } from './exteriorInspectionTypes';

type Props = {
  findingsByPanel: Partial<Record<ExteriorPanelId, number>>;
  onSelectPanel: (panel: ExteriorPanel) => void;
};

type PanelGeometry = {
  path: string;
  badgeX: number;
  badgeY: number;
  hitStroke: number;
};

const panelGeometry: Record<ExteriorPanelId, PanelGeometry> = {
  'front-bumper': {
    path: 'M32 7 Q50 1 68 7 L66 16 Q50 13 34 16 Z',
    badgeX: 50,
    badgeY: 10,
    hitStroke: 6,
  },
  hood: {
    path: 'M34 17 L66 17 L70 47 L30 47 Z',
    badgeX: 50,
    badgeY: 31,
    hitStroke: 4,
  },
  'left-front-fender': {
    path: 'M23 17 L33 18 L29 49 L19 47 L20 29 Q20 21 23 17 Z',
    badgeX: 25,
    badgeY: 34,
    hitStroke: 6,
  },
  'right-front-fender': {
    path: 'M77 17 L67 18 L71 49 L81 47 L80 29 Q80 21 77 17 Z',
    badgeX: 75,
    badgeY: 34,
    hitStroke: 6,
  },
  'left-front-door': {
    path: 'M19 50 L30 50 L30 87 L18 87 Z',
    badgeX: 24,
    badgeY: 68,
    hitStroke: 5,
  },
  'right-front-door': {
    path: 'M81 50 L70 50 L70 87 L82 87 Z',
    badgeX: 76,
    badgeY: 68,
    hitStroke: 5,
  },
  roof: {
    path: 'M36 49 Q38 43 43 41 L57 41 Q62 43 64 49 L66 119 Q63 127 58 130 L42 130 Q37 127 34 119 Z',
    badgeX: 50,
    badgeY: 88,
    hitStroke: 4,
  },
  'left-rear-door': {
    path: 'M18 89 L30 89 L30 126 L19 129 Z',
    badgeX: 24,
    badgeY: 108,
    hitStroke: 5,
  },
  'right-rear-door': {
    path: 'M82 89 L70 89 L70 126 L81 129 Z',
    badgeX: 76,
    badgeY: 108,
    hitStroke: 5,
  },
  'left-quarter-panel': {
    path: 'M19 131 L30 128 L35 159 L28 166 Q20 161 19 145 Z',
    badgeX: 25,
    badgeY: 146,
    hitStroke: 6,
  },
  'right-quarter-panel': {
    path: 'M81 131 L70 128 L65 159 L72 166 Q80 161 81 145 Z',
    badgeX: 75,
    badgeY: 146,
    hitStroke: 6,
  },
  'trunk-liftgate': {
    path: 'M35 132 L65 132 L69 163 L31 163 Z',
    badgeX: 50,
    badgeY: 148,
    hitStroke: 4,
  },
  'rear-bumper': {
    path: 'M31 165 L69 165 L67 174 Q50 180 33 174 Z',
    badgeX: 50,
    badgeY: 170,
    hitStroke: 7,
  },
};

export function VehicleExteriorDiagram({ findingsByPanel, onSelectPanel }: Props) {
  return (
    <View style={styles.shell}>
      <Svg viewBox="0 0 100 180" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <Path
          d="M33 5 Q50 0 67 5 Q76 11 79 25 L82 144 Q81 163 69 174 Q50 182 31 174 Q19 163 18 144 L21 25 Q24 11 33 5 Z"
          fill="#0D1217"
          stroke="#35414A"
          strokeWidth={1.2}
        />

        {exteriorPanels.map((panel) => {
          const geometry = panelGeometry[panel.id];
          const count = findingsByPanel[panel.id] ?? 0;
          const selectPanel = () => onSelectPanel(panel);
          return (
            <G key={panel.id}>
              <Path
                d={geometry.path}
                fill={count ? '#49321C' : '#171E24'}
                stroke={count ? '#D79B50' : '#46535D'}
                strokeWidth={count ? 1.2 : 0.7}
                onPress={selectPanel}
              />
              <Path
                accessible
                accessibilityLabel={`${panel.label}${count ? `, ${count} damage finding${count === 1 ? '' : 's'}` : ''}`}
                d={geometry.path}
                fill="transparent"
                stroke="rgba(255,255,255,0.001)"
                strokeWidth={geometry.hitStroke}
                strokeLinejoin="round"
                strokeLinecap="round"
                onPress={selectPanel}
              />
              {count > 0 && (
                <G onPress={selectPanel}>
                  <Circle cx={geometry.badgeX} cy={geometry.badgeY} r={5.5} fill="#D79B50" stroke="#090D10" strokeWidth={1.4} />
                  <SvgText x={geometry.badgeX} y={geometry.badgeY + 2.1} fill="#15100A" fontSize={6.2} fontWeight="900" textAnchor="middle">{count}</SvgText>
                </G>
              )}
            </G>
          );
        })}

        <Rect x={13} y={30} width={7} height={25} rx={3.5} fill="#090D10" stroke="#303941" pointerEvents="none" />
        <Rect x={80} y={30} width={7} height={25} rx={3.5} fill="#090D10" stroke="#303941" pointerEvents="none" />
        <Rect x={13} y={126} width={7} height={25} rx={3.5} fill="#090D10" stroke="#303941" pointerEvents="none" />
        <Rect x={80} y={126} width={7} height={25} rx={3.5} fill="#090D10" stroke="#303941" pointerEvents="none" />
        <Path d="M38 50 L62 50 L60 68 L40 68 Z" fill="#0A1720" stroke="#2D5369" strokeWidth={0.7} pointerEvents="none" />
        <Path d="M40 105 L60 105 L62 123 L38 123 Z" fill="#0A1720" stroke="#2D5369" strokeWidth={0.7} pointerEvents="none" />
        <SvgText x={50} y={4} fill="#66747E" fontSize={4.5} fontWeight="900" letterSpacing={1.1} textAnchor="middle" pointerEvents="none">FRONT</SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: '100%',
    maxWidth: 330,
    aspectRatio: 0.55,
    alignSelf: 'center',
    marginVertical: 6,
  },
});
