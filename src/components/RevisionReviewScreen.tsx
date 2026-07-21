import { useEffect, useRef, useState } from 'react';
import { InputAccessoryView, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Department, ProductionDepartmentName, Vehicle } from '../types';
import { colors } from '../theme/colors';
import { useFocusedInputScroll } from '../hooks/useFocusedInputScroll';

const RESOLUTION_ACCESSORY_ID = 'resolution-notes-keyboard-accessory';

type Props = { vehicle: Vehicle | null; productionDepartments: Department[]; onClose: () => void; onConfirm: (destination: ProductionDepartmentName, status: string, resolutionNote: string) => void };

export function RevisionReviewScreen({ vehicle, productionDepartments, onClose, onConfirm }: Props) {
  const insets = useSafeAreaInsets();
  const [destination, setDestination] = useState<ProductionDepartmentName | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const resolutionInputRef = useRef<TextInput>(null);
  const keyboardScroll = useFocusedInputScroll(scrollRef, resolutionInputRef, insets.bottom);
  useEffect(() => { setDestination(null); setStatus(null); setResolutionNote(''); }, [vehicle?.id]);
  if (!vehicle?.activeRevision) return null;
  const revision = vehicle.activeRevision;
  const destinationDepartment = productionDepartments.find(({ name }) => name === destination);

  return <Modal visible animationType="slide" presentationStyle="fullScreen" statusBarTranslucent={false} onRequestClose={onClose}>
    <SafeAreaView style={[styles.safe, { paddingTop: insets.top }]} edges={['bottom', 'left', 'right']}>
      <View style={styles.topBar}><Pressable onPress={onClose} accessibilityRole="button" hitSlop={8} style={styles.back}><Text style={styles.backIcon}>‹</Text><Text style={styles.backText}>Back to Production Exceptions</Text></Pressable><Text style={styles.topTitle}>REVISION REVIEW</Text></View>
      <KeyboardAvoidingView style={styles.keyboardAvoider} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
      <ScrollView ref={scrollRef} keyboardDismissMode="interactive" keyboardShouldPersistTaps="always" onScroll={keyboardScroll.onScroll} scrollEventThrottle={16} contentContainerStyle={[styles.content, { paddingBottom: Math.max(44, keyboardScroll.bottomPadding) }]} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>{vehicle.year} · {vehicle.stockNumber}</Text><Text style={styles.title}>{vehicle.make} {vehicle.model}</Text>
        <View style={styles.request}><Text style={styles.label}>ORIGINAL DEPARTMENT</Text><Text style={styles.requestValue}>{revision.originalDepartment}</Text><Text style={styles.labelBlock}>REVISION REASON</Text><Text style={styles.reason}>{revision.reason}</Text><Text style={styles.labelBlock}>REVISION NOTES</Text><Text style={[styles.notes, !revision.notes && styles.noNotes]}>{revision.notes || 'No notes provided'}</Text></View>
        <Text style={styles.sectionTitle}>Corrective department</Text><Text style={styles.hint}>Choose the department that will perform the corrective work.</Text>
        <View style={styles.optionList}>{productionDepartments.map((department) => <Pressable key={department.name} onPress={() => { setDestination(department.name as ProductionDepartmentName); setStatus(null); }} accessibilityRole="button" accessibilityState={{ selected: destination === department.name }} style={[styles.option, destination === department.name && styles.optionSelected]}><Text style={[styles.optionText, destination === department.name && styles.optionTextSelected]}>{department.name}</Text>{destination === department.name && <Text style={styles.check}>✓</Text>}</Pressable>)}</View>
        {destinationDepartment && <><Text style={styles.sectionTitle}>Corrective task</Text><Text style={styles.hint}>Select the work or inspection this vehicle requires.</Text><View style={styles.optionList}>{destinationDepartment.statusOptions.map((item) => <Pressable key={item} onPress={() => setStatus(item)} accessibilityRole="button" accessibilityState={{ selected: status === item }} style={[styles.option, status === item && styles.optionSelected]}><Text style={[styles.optionText, status === item && styles.optionTextSelected]}>{item}</Text>{status === item && <Text style={styles.check}>✓</Text>}</Pressable>)}</View></>}
        {status && <View style={styles.resolution}><Text style={styles.label}>ASSIGNMENT NOTE <Text style={styles.optional}>OPTIONAL</Text></Text><TextInput ref={resolutionInputRef} value={resolutionNote} onChangeText={setResolutionNote} placeholder="Add corrective-work guidance" placeholderTextColor={colors.subtle} multiline maxLength={500} inputAccessoryViewID={Platform.OS === 'ios' ? RESOLUTION_ACCESSORY_ID : undefined} onFocus={keyboardScroll.onInputFocus} onBlur={keyboardScroll.onInputBlur} textAlignVertical="top" style={styles.input} /><Pressable onPress={() => destination && onConfirm(destination, status, resolutionNote.trim())} accessibilityRole="button" style={({ pressed }) => [styles.confirm, pressed && styles.pressed]}><Text style={styles.confirmText}>Assign Exception to {destination}</Text></Pressable></View>}
      </ScrollView>
      </KeyboardAvoidingView>
      {Platform.OS === 'ios' && <InputAccessoryView nativeID={RESOLUTION_ACCESSORY_ID} backgroundColor={colors.panelRaised}><View style={styles.accessory}><Text style={styles.accessoryLabel}>Resolution Note</Text><Pressable onPress={Keyboard.dismiss} accessibilityRole="button" style={styles.doneButton}><Text style={styles.doneText}>Done</Text></Pressable></View></InputAccessoryView>}
    </SafeAreaView>
  </Modal>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, keyboardAvoider: { flex: 1 }, topBar: { minHeight: 62, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border }, back: { flex: 1, minHeight: 52, flexDirection: 'row', alignItems: 'center' }, backIcon: { color: colors.accent, fontSize: 36, marginRight: 5 }, backText: { color: colors.text, fontSize: 13, fontWeight: '800' }, topTitle: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.5 }, content: { padding: 20, paddingBottom: 44 }, eyebrow: { color: '#F97316', fontSize: 10, fontWeight: '900', letterSpacing: 1.3, marginBottom: 7 }, title: { color: colors.text, fontSize: 28, fontWeight: '900' },
  request: { backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border, borderLeftWidth: 6, borderLeftColor: '#F97316', borderRadius: 14, padding: 18, marginTop: 20 }, label: { color: colors.subtle, fontSize: 8, fontWeight: '900', letterSpacing: 1.1 }, labelBlock: { color: colors.subtle, fontSize: 8, fontWeight: '900', letterSpacing: 1.1, marginTop: 15 }, requestValue: { color: '#D6DADE', fontSize: 14, fontWeight: '800', marginTop: 5 }, reason: { color: '#F3B077', fontSize: 16, fontWeight: '900', marginTop: 5 }, notes: { color: '#D6DADE', fontSize: 14, lineHeight: 20, marginTop: 5 }, noNotes: { color: colors.subtle, fontStyle: 'italic' }, sectionTitle: { color: colors.text, fontSize: 19, fontWeight: '900', marginTop: 28 }, hint: { color: colors.muted, fontSize: 12, marginTop: 4, marginBottom: 11 }, optionList: { gap: 8 }, option: { minHeight: 56, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border, borderRadius: 11, paddingHorizontal: 15 }, optionSelected: { borderColor: '#6E5718', backgroundColor: colors.accentSoft }, optionText: { flex: 1, color: '#D6DADE', fontSize: 14, fontWeight: '800' }, optionTextSelected: { color: colors.accent }, check: { color: colors.accent, fontSize: 17, fontWeight: '900' }, resolution: { marginTop: 24 }, optional: { color: colors.subtle }, input: { minHeight: 108, color: colors.text, fontSize: 15, lineHeight: 20, backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 13, marginTop: 8 }, confirm: { minHeight: 60, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent, borderRadius: 13, marginTop: 12 }, confirmText: { color: colors.background, fontSize: 15, fontWeight: '900' }, pressed: { opacity: 0.72 }, accessory: { minHeight: 46, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: colors.border }, accessoryLabel: { flex: 1, color: colors.muted, fontSize: 12, fontWeight: '800' }, doneButton: { minWidth: 58, minHeight: 44, alignItems: 'flex-end', justifyContent: 'center' }, doneText: { color: colors.accent, fontSize: 16, fontWeight: '900' },
});
