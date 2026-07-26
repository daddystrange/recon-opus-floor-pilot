import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardAwareFormScroll } from '../hooks/useFocusedInputScroll';
import { SubletCategory, Vehicle } from '../types';
import { colors } from '../theme/colors';

const categories: SubletCategory[] = ['Glass', 'Alignment', 'Mechanical', 'Calibration', 'Upholstery', 'Tires', 'Dealer Service', 'Other'];

type Props = { visible: boolean; vehicle: Vehicle | null; onCancel: () => void; onSubmit: (category: SubletCategory, vendor: string, description: string, expectedTiming: string, notes: string) => void };

export function SubletCreationSheet({ visible, vehicle, onCancel, onSubmit }: Props) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const vendorRef = useRef<TextInput>(null);
  const descriptionRef = useRef<TextInput>(null);
  const expectedRef = useRef<TextInput>(null);
  const notesRef = useRef<TextInput>(null);
  const keyboardScroll = useKeyboardAwareFormScroll(scrollRef, insets.bottom);
  const [category, setCategory] = useState<SubletCategory | null>(null);
  const [vendor, setVendor] = useState('');
  const [description, setDescription] = useState('');
  const [expectedReturn, setExpectedReturn] = useState('');
  const [notes, setNotes] = useState('');
  useEffect(() => { if (visible) { setCategory(null); setVendor(''); setDescription(''); setExpectedReturn(''); setNotes(''); } }, [vehicle?.id, visible]);
  if (!vehicle) return null;
  const ready = Boolean(category && description.trim());
  return <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
    <View style={styles.overlay}><Pressable style={styles.backdrop} onPress={onCancel} /><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.avoider}><SafeAreaView style={styles.sheet} edges={['bottom', 'left', 'right']}><View style={styles.handle} /><ScrollView ref={scrollRef} keyboardDismissMode="interactive" keyboardShouldPersistTaps="handled" onScroll={keyboardScroll.onScroll} scrollEventThrottle={16} contentContainerStyle={[styles.content, { paddingBottom: Math.max(28, keyboardScroll.bottomPadding) }]} showsVerticalScrollIndicator={false}>
      <View style={styles.heading}><View style={styles.headingCopy}><Text style={styles.kicker}>MANAGER APPROVAL REQUIRED</Text><Text style={styles.title}>Request Sublet</Text><Text style={styles.vehicle}>{vehicle.year} {vehicle.make} {vehicle.model} · {vehicle.stockNumber}</Text></View><Pressable onPress={onCancel} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable></View>
      <Text style={styles.label}>SUBLET CATEGORY</Text><View style={styles.categories}>{categories.map((item) => <Pressable key={item} onPress={() => setCategory(item)} style={({ pressed }) => [styles.category, category === item && styles.categorySelected, pressed && styles.pressed]}><Text style={[styles.categoryText, category === item && styles.categoryTextSelected]}>{item}</Text></Pressable>)}</View>
      <Text style={styles.label}>SUGGESTED VENDOR <Text style={styles.optional}>OPTIONAL</Text></Text><TextInput ref={vendorRef} value={vendor} onChangeText={setVendor} onFocus={() => keyboardScroll.onInputFocus(vendorRef.current)} onBlur={keyboardScroll.onInputBlur} placeholder="Vendor name" placeholderTextColor={colors.subtle} style={styles.input} />
      <Text style={styles.label}>SERVICE DESCRIPTION</Text><TextInput ref={descriptionRef} value={description} onChangeText={setDescription} onFocus={() => keyboardScroll.onInputFocus(descriptionRef.current)} onBlur={keyboardScroll.onInputBlur} placeholder="What work is being performed?" placeholderTextColor={colors.subtle} maxLength={160} style={styles.input} />
      <Text style={styles.label}>EXPECTED TIMING <Text style={styles.optional}>OPTIONAL</Text></Text><TextInput ref={expectedRef} value={expectedReturn} onChangeText={setExpectedReturn} onFocus={() => keyboardScroll.onInputFocus(expectedRef.current)} onBlur={keyboardScroll.onInputBlur} placeholder="Today at 3:00 PM" placeholderTextColor={colors.subtle} maxLength={80} style={styles.input} />
      <Text style={styles.label}>NOTES <Text style={styles.optional}>OPTIONAL</Text></Text><TextInput ref={notesRef} value={notes} onChangeText={setNotes} onFocus={() => keyboardScroll.onInputFocus(notesRef.current)} onBlur={keyboardScroll.onInputBlur} onContentSizeChange={keyboardScroll.scrollFocusedInputIntoView} placeholder="Coordination details" placeholderTextColor={colors.subtle} maxLength={300} multiline style={[styles.input, styles.notesInput]} />
      <Pressable disabled={!ready} onPress={() => category && onSubmit(category, vendor.trim(), description.trim(), expectedReturn.trim(), notes.trim())} style={({ pressed }) => [styles.submit, !ready && styles.submitDisabled, pressed && ready && styles.pressed]}><Text style={styles.submitText}>Submit Sublet Request</Text></Pressable>
    </ScrollView></SafeAreaView></KeyboardAvoidingView></View>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' }, backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.68)' }, avoider: { flex: 1, justifyContent: 'flex-end' }, sheet: { maxHeight: '92%', backgroundColor: colors.panel, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderBottomWidth: 0, borderColor: colors.border }, handle: { width: 42, height: 4, borderRadius: 2, backgroundColor: colors.subtle, alignSelf: 'center', marginTop: 10 }, content: { padding: 20, paddingTop: 14, paddingBottom: 28 }, heading: { flexDirection: 'row' }, headingCopy: { flex: 1 }, kicker: { color: '#C68A43', fontSize: 9, fontWeight: '900', letterSpacing: 1.4 }, title: { color: colors.text, fontSize: 28, fontWeight: '900', marginTop: 5 }, vehicle: { color: colors.muted, fontSize: 11, fontWeight: '800', marginTop: 6 }, close: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panelRaised }, closeText: { color: colors.muted, fontSize: 29 }, label: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.1, marginTop: 18, marginBottom: 8 }, optional: { color: colors.subtle, fontSize: 8 }, categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, category: { minHeight: 50, width: '48%', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border, borderRadius: 11, paddingHorizontal: 8 }, categorySelected: { borderColor: '#A97336', backgroundColor: '#2D2418' }, categoryText: { color: '#D6DADE', fontSize: 12, fontWeight: '800' }, categoryTextSelected: { color: '#E8B776' }, input: { minHeight: 54, color: colors.text, fontSize: 14, backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border, borderRadius: 11, paddingHorizontal: 13 }, notesInput: { minHeight: 88, paddingTop: 13, textAlignVertical: 'top' }, submit: { minHeight: 60, alignItems: 'center', justifyContent: 'center', backgroundColor: '#B87834', borderRadius: 13, marginTop: 20 }, submitDisabled: { opacity: 0.38 }, submitText: { color: '#0B0E12', fontSize: 15, fontWeight: '900' }, pressed: { opacity: 0.72 },
});
