import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardAwareFormScroll } from '../../hooks/useFocusedInputScroll';
import { colors } from '../../theme/colors';
import {
  DamageDraft,
  damageSeverities,
  damageTypes,
  emptyDamageDraft,
  ExteriorDamageFinding,
  ExteriorPanel,
  repairActions,
} from './exteriorInspectionTypes';

type Props = {
  panel: ExteriorPanel | null;
  findings: ExteriorDamageFinding[];
  initialFinding: ExteriorDamageFinding | null;
  onSave: (draft: DamageDraft, existing: ExteriorDamageFinding | null) => void;
  onDelete: (finding: ExteriorDamageFinding) => void;
  onClose: () => void;
};

export function DamageEntryModal({ panel, findings, initialFinding, onSave, onDelete, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const notesInputRef = useRef<TextInput>(null);
  const keyboardScroll = useKeyboardAwareFormScroll(scrollRef, insets.bottom);
  const [editing, setEditing] = useState<ExteriorDamageFinding | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [draft, setDraft] = useState<DamageDraft>(emptyDamageDraft);
  const initialDraft = useMemo<DamageDraft>(() => editing ? {
    damageType: editing.damageType,
    severity: editing.severity,
    suggestedAction: editing.suggestedAction,
    notes: editing.notes,
    photoReference: editing.photoReference,
  } : emptyDamageDraft, [editing]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initialDraft);

  useEffect(() => {
    if (!panel) return;
    setEditing(initialFinding);
    setDraft(initialFinding ? {
      damageType: initialFinding.damageType,
      severity: initialFinding.severity,
      suggestedAction: initialFinding.suggestedAction,
      notes: initialFinding.notes,
      photoReference: initialFinding.photoReference,
    } : emptyDamageDraft);
    setShowEditor(Boolean(initialFinding) || findings.length === 0);
  }, [findings.length, initialFinding, panel]);

  if (!panel) return null;

  const requestClose = () => {
    if (showEditor && dirty) {
      Alert.alert('Discard unsaved changes?', 'Your damage entry has not been saved.', [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: onClose },
      ]);
      return;
    }
    onClose();
  };

  const beginAdd = () => {
    setEditing(null);
    setDraft(emptyDamageDraft);
    setShowEditor(true);
  };

  const beginEdit = (finding: ExteriorDamageFinding) => {
    setEditing(finding);
    setDraft({
      damageType: finding.damageType,
      severity: finding.severity,
      suggestedAction: finding.suggestedAction,
      notes: finding.notes,
      photoReference: finding.photoReference,
    });
    setShowEditor(true);
  };

  const cancelEditor = () => {
    if (dirty) {
      Alert.alert('Discard unsaved changes?', 'Your damage entry has not been saved.', [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => findings.length ? setShowEditor(false) : onClose() },
      ]);
      return;
    }
    if (findings.length) setShowEditor(false);
    else onClose();
  };

  const confirmDelete = (finding: ExteriorDamageFinding) => {
    Alert.alert('Delete damage finding?', `${finding.damageType} on ${finding.panelLabel} will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(finding) },
    ]);
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={requestClose}>
      <View style={styles.backdrop}>
        <Pressable accessibilityLabel="Close damage entry" style={StyleSheet.absoluteFill} onPress={requestClose} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
          <View style={[styles.sheet, { paddingBottom: Math.max(16, insets.bottom) }]}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <View><Text style={styles.eyebrow}>EXTERIOR PANEL</Text><Text style={styles.panelTitle}>{panel.label}</Text></View>
              <Pressable onPress={requestClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable>
            </View>

            {showEditor ? (
              <ScrollView
                ref={scrollRef}
                keyboardDismissMode="interactive"
                keyboardShouldPersistTaps="handled"
                onScroll={keyboardScroll.onScroll}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.editorContent, { paddingBottom: Math.max(10, keyboardScroll.bottomPadding) }]}
              >
                <ChoiceGroup label="DAMAGE TYPE" values={damageTypes} selected={draft.damageType} onSelect={(damageType) => setDraft((current) => ({ ...current, damageType }))} />
                <ChoiceGroup label="SEVERITY" values={damageSeverities} selected={draft.severity} onSelect={(severity) => setDraft((current) => ({ ...current, severity }))} />
                <ChoiceGroup label="LIKELY REPAIR ACTION" values={repairActions} selected={draft.suggestedAction} onSelect={(suggestedAction) => setDraft((current) => ({ ...current, suggestedAction }))} />
                <Text style={styles.label}>NOTES · OPTIONAL</Text>
                <TextInput
                  ref={notesInputRef}
                  multiline
                  maxLength={1000}
                  onChangeText={(notes) => setDraft((current) => ({ ...current, notes }))}
                  onContentSizeChange={keyboardScroll.scrollFocusedInputIntoView}
                  onFocus={() => keyboardScroll.onInputFocus(notesInputRef.current)}
                  onBlur={keyboardScroll.onInputBlur}
                  placeholder="Add repair context"
                  placeholderTextColor={colors.subtle}
                  style={styles.notes}
                  textAlignVertical="top"
                  value={draft.notes}
                />
                <Pressable
                  onPress={() => setDraft((current) => ({ ...current, photoReference: current.photoReference ? null : `demo-photo://${Date.now()}` }))}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.photoButton, draft.photoReference && styles.photoButtonAdded, pressed && styles.pressed]}
                >
                  <Text style={styles.photoIcon}>▣</Text><Text style={styles.photoText}>{draft.photoReference ? 'Demo Photo Added' : 'Add Photo'}</Text>
                </Pressable>
                <View style={styles.actions}>
                  <Pressable onPress={cancelEditor} accessibilityRole="button" style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}><Text style={styles.cancelText}>Cancel</Text></Pressable>
                  <Pressable onPress={() => onSave(draft, editing)} accessibilityRole="button" style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}><Text style={styles.saveText}>Save Damage</Text></Pressable>
                </View>
              </ScrollView>
            ) : (
              <View style={styles.existingContent}>
                <Text style={styles.existingTitle}>Existing findings for this panel</Text>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {findings.map((finding) => (
                    <View key={finding.id} style={styles.findingRow}>
                      <Pressable onPress={() => beginEdit(finding)} accessibilityRole="button" style={({ pressed }) => [styles.findingMain, pressed && styles.pressed]}>
                        <Text style={styles.findingTitle}>{finding.damageType} · {finding.severity}</Text>
                        <Text style={styles.findingAction}>{finding.suggestedAction}</Text>
                      </Pressable>
                      <Pressable onPress={() => confirmDelete(finding)} accessibilityRole="button" accessibilityLabel={`Delete ${finding.damageType}`} style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}><Text style={styles.deleteText}>Delete</Text></Pressable>
                    </View>
                  ))}
                </ScrollView>
                <Pressable onPress={beginAdd} accessibilityRole="button" style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}><Text style={styles.addButtonText}>Add Damage</Text></Pressable>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function ChoiceGroup<T extends string>({ label, values, selected, onSelect }: { label: string; values: T[]; selected: T; onSelect: (value: T) => void }) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.choices}>{values.map((value) => <Pressable key={value} onPress={() => onSelect(value)} style={({ pressed }) => [styles.choice, selected === value && styles.choiceSelected, pressed && styles.pressed]}><Text style={[styles.choiceText, selected === value && styles.choiceTextSelected]}>{value}</Text></Pressable>)}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(3, 5, 7, 0.76)' },
  keyboardView: { maxHeight: '92%', justifyContent: 'flex-end' },
  sheet: { maxHeight: '100%', minHeight: 390, backgroundColor: '#11171C', borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, borderColor: '#34404A' },
  handle: { width: 42, height: 4, borderRadius: 2, alignSelf: 'center', backgroundColor: '#4B5963', marginTop: 9 },
  sheetHeader: { minHeight: 72, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border },
  eyebrow: { color: '#D79B50', fontSize: 8, fontWeight: '900', letterSpacing: 1.3 },
  panelTitle: { color: colors.text, fontSize: 22, fontWeight: '900', marginTop: 3 },
  close: { width: 42, height: 42, borderRadius: 21, marginLeft: 'auto', alignItems: 'center', justifyContent: 'center', backgroundColor: '#20282E' },
  closeText: { color: colors.muted, fontSize: 27, lineHeight: 29 },
  editorContent: { padding: 20, paddingBottom: 10 },
  group: { marginBottom: 18 },
  label: { color: colors.subtle, fontSize: 8, fontWeight: '900', letterSpacing: 1.1, marginBottom: 8 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  choice: { minHeight: 42, paddingHorizontal: 13, borderRadius: 9, borderWidth: 1, borderColor: '#34404A', backgroundColor: '#181F25', alignItems: 'center', justifyContent: 'center' },
  choiceSelected: { borderColor: '#D79B50', backgroundColor: '#3A2A18' },
  choiceText: { color: '#AEB8BF', fontSize: 11, fontWeight: '800' },
  choiceTextSelected: { color: '#F2C98E' },
  notes: { minHeight: 94, borderWidth: 1, borderColor: '#34404A', borderRadius: 10, backgroundColor: '#181F25', padding: 13, color: colors.text, fontSize: 13, lineHeight: 18 },
  photoButton: { minHeight: 50, marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#43515C', borderRadius: 10, backgroundColor: '#1A2228' },
  photoButtonAdded: { borderColor: '#3D7857', backgroundColor: '#17271E' },
  photoIcon: { color: '#92A5B3', fontSize: 16, marginRight: 8 },
  photoText: { color: colors.text, fontSize: 12, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: 9, marginTop: 18 },
  cancelButton: { flex: 1, minHeight: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1, borderColor: '#3A454D' },
  cancelText: { color: colors.muted, fontSize: 13, fontWeight: '900' },
  saveButton: { flex: 1.6, minHeight: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: colors.accent },
  saveText: { color: colors.background, fontSize: 13, fontWeight: '900' },
  existingContent: { flex: 1, padding: 20 },
  existingTitle: { color: colors.muted, fontSize: 12, fontWeight: '800', marginBottom: 11 },
  findingRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 10, backgroundColor: colors.panel, marginBottom: 8 },
  findingMain: { flex: 1, alignSelf: 'stretch', justifyContent: 'center', paddingHorizontal: 13 },
  findingTitle: { color: colors.text, fontSize: 13, fontWeight: '900' },
  findingAction: { color: '#D79B50', fontSize: 10, fontWeight: '800', marginTop: 4 },
  deleteButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 13 },
  deleteText: { color: '#E37474', fontSize: 10, fontWeight: '900' },
  addButton: { minHeight: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: colors.accent, marginTop: 8 },
  addButtonText: { color: colors.background, fontSize: 14, fontWeight: '900' },
  pressed: { opacity: 0.72 },
});
