import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { DamageEntryModal } from './DamageEntryModal';
import { DamageSummaryList } from './DamageSummaryList';
import { DamageDraft, ExteriorDamageFinding, ExteriorPanel, ExteriorPanelId, exteriorPanels } from './exteriorInspectionTypes';
import { VehicleExteriorDiagram } from './VehicleExteriorDiagram';

type Props = {
  vehicleId: string;
  findings: ExteriorDamageFinding[];
  onChangeFindings: (findings: ExteriorDamageFinding[]) => void;
  onBack: () => void;
  onContinue: () => void;
};

export function ExteriorInspectionScreen({ vehicleId, findings, onChangeFindings, onBack, onContinue }: Props) {
  const [selectedPanel, setSelectedPanel] = useState<ExteriorPanel | null>(null);
  const [selectedFinding, setSelectedFinding] = useState<ExteriorDamageFinding | null>(null);
  const findingsByPanel = useMemo(() => findings.reduce<Partial<Record<ExteriorPanelId, number>>>((counts, finding) => {
    counts[finding.panelId] = (counts[finding.panelId] ?? 0) + 1;
    return counts;
  }, {}), [findings]);
  const panelFindings = selectedPanel ? findings.filter(({ panelId }) => panelId === selectedPanel.id) : [];

  const openPanel = (panel: ExteriorPanel) => {
    setSelectedFinding(null);
    setSelectedPanel(panel);
  };

  const openFinding = (finding: ExteriorDamageFinding) => {
    setSelectedFinding(finding);
    setSelectedPanel(exteriorPanels.find(({ id }) => id === finding.panelId) ?? null);
  };

  const saveFinding = (draft: DamageDraft, existing: ExteriorDamageFinding | null) => {
    if (!selectedPanel) return;
    const now = Date.now();
    if (existing) {
      onChangeFindings(findings.map((finding) => finding.id === existing.id ? { ...finding, ...draft, updatedAt: now } : finding));
    } else {
      onChangeFindings([...findings, {
        id: `damage-${now}-${Math.random().toString(36).slice(2, 7)}`,
        vehicleId,
        panelId: selectedPanel.id,
        panelLabel: selectedPanel.label,
        ...draft,
        createdAt: now,
        updatedAt: now,
      }]);
    }
    setSelectedPanel(null);
    setSelectedFinding(null);
  };

  const deleteFinding = (target: ExteriorDamageFinding) => {
    const remaining = findings.filter(({ id }) => id !== target.id);
    onChangeFindings(remaining);
    setSelectedFinding(null);
    if (!remaining.some(({ panelId }) => panelId === target.panelId)) setSelectedPanel(null);
  };

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" style={({ pressed }) => [styles.back, pressed && styles.pressed]}><Text style={styles.backIcon}>‹</Text><Text style={styles.backText}>Vehicle Information</Text></Pressable>
        <Text style={styles.step}>STEP 2</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>VEHICLE CHECK-IN</Text>
        <Text style={styles.title}>Exterior Inspection</Text>
        <Text style={styles.instruction}>Tap a panel to record damage</Text>
        <View style={styles.diagramCard}><VehicleExteriorDiagram findingsByPanel={findingsByPanel} onSelectPanel={openPanel} /></View>
        <DamageSummaryList findings={findings} onSelectFinding={openFinding} />
        <Pressable onPress={onContinue} accessibilityRole="button" style={({ pressed }) => [styles.continueButton, pressed && styles.pressed]}><Text style={styles.continueText}>Continue</Text><Text style={styles.continueArrow}>›</Text></Pressable>
      </ScrollView>
      <DamageEntryModal
        panel={selectedPanel}
        findings={panelFindings}
        initialFinding={selectedFinding}
        onSave={saveFinding}
        onDelete={deleteFinding}
        onClose={() => { setSelectedPanel(null); setSelectedFinding(null); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  header: { minHeight: 52, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border },
  back: { minHeight: 44, flexDirection: 'row', alignItems: 'center', paddingRight: 14 },
  backIcon: { color: colors.accent, fontSize: 28, lineHeight: 30, marginRight: 5 },
  backText: { color: colors.text, fontSize: 13, fontWeight: '800' },
  step: { marginLeft: 'auto', color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  content: { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 34 },
  eyebrow: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.8 },
  title: { color: colors.text, fontSize: 31, lineHeight: 36, fontWeight: '900', letterSpacing: -0.8, marginTop: 5 },
  instruction: { color: colors.muted, fontSize: 13, fontWeight: '700', marginTop: 6, marginBottom: 13 },
  diagramCard: { paddingHorizontal: 8, paddingVertical: 8, borderWidth: 1, borderColor: '#263039', borderRadius: 16, backgroundColor: '#0C1115' },
  continueButton: { minHeight: 62, marginTop: 18, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent },
  continueText: { color: colors.background, fontSize: 16, fontWeight: '900' },
  continueArrow: { position: 'absolute', right: 18, color: colors.background, fontSize: 28, fontWeight: '700' },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
});
