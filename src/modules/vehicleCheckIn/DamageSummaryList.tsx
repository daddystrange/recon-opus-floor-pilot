import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { ExteriorDamageFinding } from './exteriorInspectionTypes';

type Props = {
  findings: ExteriorDamageFinding[];
  onSelectFinding: (finding: ExteriorDamageFinding) => void;
};

export function DamageSummaryList({ findings, onSelectFinding }: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.headingRow}><Text style={styles.heading}>Recorded Damage</Text><Text style={styles.count}>{findings.length}</Text></View>
      {findings.length === 0
        ? <View style={styles.empty}><Text style={styles.emptyText}>No exterior damage recorded</Text></View>
        : findings.map((finding) => (
          <Pressable key={finding.id} onPress={() => onSelectFinding(finding)} accessibilityRole="button" style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
            <View style={styles.itemTop}><Text style={styles.panel}>{finding.panelLabel}</Text><Text style={styles.chevron}>›</Text></View>
            <Text style={styles.finding}>{finding.damageType} · {finding.severity}</Text>
            <View style={styles.metaRow}><Text style={styles.action}>{finding.suggestedAction}</Text>{finding.notes ? <Text style={styles.indicator}>NOTE</Text> : null}{finding.photoReference ? <Text style={styles.indicator}>PHOTO</Text> : null}</View>
          </Pressable>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 8 },
  headingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  heading: { color: colors.text, fontSize: 19, fontWeight: '900' },
  count: { marginLeft: 8, minWidth: 24, height: 24, paddingHorizontal: 6, borderRadius: 12, textAlign: 'center', textAlignVertical: 'center', color: '#E9B771', backgroundColor: '#342616', fontSize: 11, lineHeight: 24, fontWeight: '900' },
  empty: { minHeight: 86, borderWidth: 1, borderColor: colors.border, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panel },
  emptyText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  item: { padding: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.panel, marginBottom: 9 },
  itemTop: { flexDirection: 'row', alignItems: 'center' },
  panel: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '900' },
  chevron: { color: colors.subtle, fontSize: 22, lineHeight: 22 },
  finding: { color: '#D9A863', fontSize: 12, fontWeight: '800', marginTop: 5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 9 },
  action: { color: colors.muted, fontSize: 10, fontWeight: '800', marginRight: 'auto' },
  indicator: { color: '#8FA2B0', fontSize: 7, fontWeight: '900', letterSpacing: 0.7, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 5, backgroundColor: '#202930' },
  pressed: { opacity: 0.72 },
});
