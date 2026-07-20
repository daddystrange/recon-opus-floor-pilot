import { useEffect, useRef, useState } from 'react';
import { InputAccessoryView, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { productionSequence } from '../data/departments';
import { ProductionDepartmentName, RevisionReason, Vehicle } from '../types';
import { colors } from '../theme/colors';
import { useFocusedInputScroll } from '../hooks/useFocusedInputScroll';

const revisionReasons: RevisionReason[] = [
  'Additional Body Work Needed',
  'Paint Defect',
  'Parts Issue',
  'Estimate Revision',
  'Structural Concern',
  'Other',
];

const NOTES_ACCESSORY_ID = 'revision-notes-keyboard-accessory';

type Props = {
  visible: boolean;
  initialMode: 'actions' | 'revision';
  vehicle: Vehicle | null;
  currentDepartment: ProductionDepartmentName | null;
  onClose: () => void;
  onConfirmNext: (destination: ProductionDepartmentName) => void;
  onRevisionRequest: (reason: RevisionReason, notes: string) => void;
};

export function VehicleMoveSheet({ visible, initialMode, vehicle, currentDepartment, onClose, onConfirmNext, onRevisionRequest }: Props) {
  const [mode, setMode] = useState<'actions' | 'confirm' | 'revision'>(initialMode);
  const [selectedReason, setSelectedReason] = useState<RevisionReason | null>(null);
  const [notes, setNotes] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const notesInputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();
  const keyboardScroll = useFocusedInputScroll(scrollRef, notesInputRef, insets.bottom);

  useEffect(() => {
    if (visible) {
      setMode(initialMode);
      setSelectedReason(null);
      setNotes('');
    }
  }, [initialMode, vehicle?.id, visible]);

  if (!vehicle || !currentDepartment) return null;
  const nextDepartment = productionSequence[productionSequence.indexOf(currentDepartment) + 1];

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close vehicle action sheet" />
        <KeyboardAvoidingView style={styles.keyboardAvoider} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
        <SafeAreaView style={styles.sheet} edges={['bottom', 'left', 'right']}>
          <View style={styles.handle} />
          <ScrollView ref={scrollRef} bounces={false} keyboardDismissMode="interactive" keyboardShouldPersistTaps="always" onScroll={keyboardScroll.onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: Math.max(18, keyboardScroll.bottomPadding) }]}>
            <View style={styles.headingRow}>
              <View><Text style={styles.kicker}>{mode === 'revision' ? 'MANAGER REVIEW' : 'PRODUCTION ACTION'}</Text><Text style={styles.title}>{mode === 'revision' ? 'Request Revision' : 'Complete Phase'}</Text></View>
              <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={10} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable>
            </View>

            <View style={styles.vehicleRow}>
              <View style={styles.vehicleCopy}><Text style={styles.vehicleName}>{vehicle.make} {vehicle.model}</Text><Text style={styles.stock}>{vehicle.stockNumber}</Text></View>
              <View style={styles.departmentPill}><Text style={styles.departmentLabel}>CURRENT DEPARTMENT</Text><Text style={styles.departmentValue}>{currentDepartment}</Text></View>
            </View>

            {mode === 'actions' && <>
              {nextDepartment ? (
                <Pressable onPress={() => setMode('confirm')} accessibilityRole="button" style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
                  <Text style={styles.primaryArrow}>→</Text><View style={styles.primaryCopy}><Text style={styles.primaryLabel}>PRIMARY ACTION</Text><Text style={styles.primaryText}>Complete Current Phase</Text><Text style={styles.primaryDestination}>Send to {nextDepartment}</Text></View><Text style={styles.primaryChevron}>›</Text>
                </Pressable>
              ) : <View style={styles.flowEnd}><Text style={styles.flowEndText}>PRODUCTION FLOW COMPLETE</Text></View>}
              <Pressable onPress={() => setMode('revision')} accessibilityRole="button" style={({ pressed }) => [styles.revisionButton, pressed && styles.pressed]}>
                <View style={styles.revisionIcon}><Text style={styles.revisionIconText}>!</Text></View><View style={styles.primaryCopy}><Text style={styles.revisionText}>Request Revision</Text><Text style={styles.revisionSubtext}>Send to manager review</Text></View><Text style={styles.choiceChevron}>›</Text>
              </Pressable>
            </>}

            {mode === 'confirm' && nextDepartment && <View style={styles.confirmation}>
              <Text style={styles.confirmLabel}>CONFIRM COMPLETION</Text>
              <Text style={styles.confirmText}>Send {vehicle.make} {vehicle.model} to {nextDepartment}?</Text>
              <View style={styles.confirmActions}>
                <Pressable onPress={() => setMode('actions')} accessibilityRole="button" style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}><Text style={styles.cancelText}>Cancel</Text></Pressable>
                <Pressable onPress={() => onConfirmNext(nextDepartment)} accessibilityRole="button" style={({ pressed }) => [styles.confirmButton, pressed && styles.pressed]}><Text style={styles.confirmButtonText}>Confirm</Text></Pressable>
              </View>
            </View>}

            {mode === 'revision' && <>
              <Text style={styles.reasonPrompt}>What needs manager review?</Text>
              <View style={styles.reasonList}>{(selectedReason ? [selectedReason] : revisionReasons).map((reason) => (
                <Pressable key={reason} onPress={() => setSelectedReason(reason)} accessibilityRole="button" accessibilityState={{ selected: selectedReason === reason }} style={({ pressed }) => [styles.reasonChoice, selectedReason === reason && styles.reasonChoiceSelected, pressed && styles.pressed]}>
                  <Text style={[styles.reasonText, selectedReason === reason && styles.reasonTextSelected]}>{reason}</Text>{selectedReason === reason ? <Text style={styles.reasonCheck}>✓</Text> : <Text style={styles.choiceChevron}>›</Text>}
                </Pressable>
              ))}</View>
              {selectedReason && <Pressable onPress={() => { Keyboard.dismiss(); setSelectedReason(null); setNotes(''); }} accessibilityRole="button" style={styles.changeReason}><Text style={styles.changeReasonText}>Change reason</Text></Pressable>}
              {selectedReason && <View style={styles.notesBlock}>
                <Text style={styles.notesLabel}>REVISION NOTES <Text style={styles.optional}>OPTIONAL</Text></Text>
                <TextInput
                  ref={notesInputRef}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Describe what needs correction"
                  placeholderTextColor={colors.subtle}
                  multiline
                  maxLength={500}
                  inputAccessoryViewID={Platform.OS === 'ios' ? NOTES_ACCESSORY_ID : undefined}
                  onFocus={keyboardScroll.onInputFocus}
                  onBlur={keyboardScroll.onInputBlur}
                  textAlignVertical="top"
                  style={styles.notesInput}
                />
                <Pressable onPress={() => onRevisionRequest(selectedReason, notes.trim())} accessibilityRole="button" style={({ pressed }) => [styles.submitRevision, pressed && styles.pressed]}><Text style={styles.submitRevisionText}>Submit Revision Request</Text></Pressable>
              </View>}
            </>}
          </ScrollView>
        </SafeAreaView>
        </KeyboardAvoidingView>
        {Platform.OS === 'ios' && <InputAccessoryView nativeID={NOTES_ACCESSORY_ID} backgroundColor={colors.panelRaised}>
          <View style={styles.accessory}><Text style={styles.accessoryLabel}>Revision Notes</Text><Pressable onPress={Keyboard.dismiss} accessibilityRole="button" style={styles.doneButton}><Text style={styles.doneText}>Done</Text></Pressable></View>
        </InputAccessoryView>}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' }, backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.62)' }, keyboardAvoider: { flex: 1, justifyContent: 'flex-end' },
  sheet: { maxHeight: '88%', backgroundColor: colors.panel, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderBottomWidth: 0, borderColor: colors.border, overflow: 'hidden' },
  handle: { width: 42, height: 4, borderRadius: 2, backgroundColor: colors.subtle, alignSelf: 'center', marginTop: 10 }, content: { padding: 20, paddingTop: 14, paddingBottom: 18 },
  headingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, kicker: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.6, marginBottom: 5 }, title: { color: colors.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.7 },
  close: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panelRaised, borderRadius: 24 }, closeText: { color: colors.muted, fontSize: 29, lineHeight: 31 },
  vehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20, marginBottom: 18 }, vehicleCopy: { flex: 1 }, vehicleName: { color: colors.text, fontSize: 16, fontWeight: '900' }, stock: { color: colors.muted, fontSize: 11, fontWeight: '700', marginTop: 4 },
  departmentPill: { maxWidth: '52%', backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 8 }, departmentLabel: { color: colors.subtle, fontSize: 7, fontWeight: '900', letterSpacing: 0.9, marginBottom: 3 }, departmentValue: { color: '#D6DADE', fontSize: 12, fontWeight: '800' },
  primaryButton: { minHeight: 92, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.accent, borderRadius: 15, paddingHorizontal: 16 }, primaryArrow: { color: colors.background, fontSize: 27, fontWeight: '900', marginRight: 13 }, primaryCopy: { flex: 1 }, primaryLabel: { color: '#5B460C', fontSize: 8, fontWeight: '900', letterSpacing: 1.1, marginBottom: 3 }, primaryText: { color: colors.background, fontSize: 17, fontWeight: '900' }, primaryDestination: { color: '#5B460C', fontSize: 11, fontWeight: '800', marginTop: 3 }, primaryChevron: { color: colors.background, fontSize: 31 },
  revisionButton: { minHeight: 70, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border, borderRadius: 13, paddingHorizontal: 15, marginTop: 11 }, revisionIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#342E17', marginRight: 12 }, revisionIconText: { color: colors.accent, fontSize: 18, fontWeight: '900' }, revisionText: { color: colors.text, fontSize: 15, fontWeight: '900' }, revisionSubtext: { color: colors.muted, fontSize: 10, marginTop: 3 }, choiceChevron: { color: colors.subtle, fontSize: 25 },
  flowEnd: { minHeight: 56, borderWidth: 1, borderColor: colors.border, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, flowEndText: { color: colors.subtle, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  confirmation: { backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: '#6E5718', borderRadius: 15, padding: 18 }, confirmLabel: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.3, marginBottom: 8 }, confirmText: { color: colors.text, fontSize: 20, lineHeight: 27, fontWeight: '900' }, confirmActions: { flexDirection: 'row', gap: 10, marginTop: 20 }, cancelButton: { minHeight: 54, flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 12 }, cancelText: { color: '#D6DADE', fontSize: 14, fontWeight: '800' }, confirmButton: { minHeight: 54, flex: 1.2, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent, borderRadius: 12 }, confirmButtonText: { color: colors.background, fontSize: 14, fontWeight: '900' },
  reasonPrompt: { color: colors.muted, fontSize: 12, marginBottom: 11 }, reasonList: { gap: 8 }, reasonChoice: { minHeight: 56, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border, borderRadius: 11, paddingHorizontal: 15 }, reasonChoiceSelected: { borderColor: '#6E5718', backgroundColor: colors.accentSoft }, reasonText: { flex: 1, color: '#D6DADE', fontSize: 14, fontWeight: '800' }, reasonTextSelected: { color: colors.accent }, reasonCheck: { color: colors.accent, fontSize: 17, fontWeight: '900' }, changeReason: { minHeight: 40, alignSelf: 'flex-start', justifyContent: 'center', paddingHorizontal: 4 }, changeReasonText: { color: colors.accent, fontSize: 12, fontWeight: '800' },
  notesBlock: { marginTop: 18 }, notesLabel: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.2, marginBottom: 8 }, optional: { color: colors.subtle, fontSize: 8 }, notesInput: { minHeight: 104, color: colors.text, fontSize: 15, lineHeight: 20, backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 13 }, submitRevision: { minHeight: 58, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent, borderRadius: 12, marginTop: 11 }, submitRevisionText: { color: colors.background, fontSize: 15, fontWeight: '900' }, pressed: { opacity: 0.72 },
  accessory: { minHeight: 46, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: colors.border }, accessoryLabel: { flex: 1, color: colors.muted, fontSize: 12, fontWeight: '800' }, doneButton: { minWidth: 58, minHeight: 44, alignItems: 'flex-end', justifyContent: 'center' }, doneText: { color: colors.accent, fontSize: 16, fontWeight: '900' },
});
