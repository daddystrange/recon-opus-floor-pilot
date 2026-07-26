import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
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
import { ExteriorInspectionScreen } from './ExteriorInspectionScreen';
import { ExteriorDamageFinding } from './exteriorInspectionTypes';
import { DecodedVehicle, DEMO_VIN, demoVinDecoder, VinDecoder } from './vinDecoder';

type Props = {
  onExit: () => void;
  decoder?: VinDecoder;
};

type IntakeFields = {
  stockNumber: string;
  mileage: string;
  color: string;
  colorCode: string;
};

const emptyFields: IntakeFields = { stockNumber: '', mileage: '', color: '', colorCode: '' };

export function VehicleCheckInModule({ onExit, decoder = demoVinDecoder }: Props) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const vinInputRef = useRef<TextInput>(null);
  const keyboardScroll = useKeyboardAwareFormScroll(scrollRef, insets.bottom);
  const [step, setStep] = useState<'identify' | 'exterior' | 'additional'>('identify');
  const [manualEntry, setManualEntry] = useState(false);
  const [vin, setVin] = useState('');
  const [vehicle, setVehicle] = useState<DecodedVehicle | null>(null);
  const [fields, setFields] = useState(emptyFields);
  const [exteriorFindings, setExteriorFindings] = useState<ExteriorDamageFinding[]>([]);
  const [busy, setBusy] = useState(false);

  const identify = async (value: string) => {
    const normalized = value.trim().toUpperCase();
    if (!normalized) return;
    setBusy(true);
    try {
      const decoded = await decoder.decode(normalized);
      setVin(decoded.vin);
      setVehicle(decoded);
    } finally {
      setBusy(false);
    }
  };

  const updateField = (key: keyof IntakeFields, value: string) => {
    setFields((current) => ({ ...current, [key]: value }));
  };

  if (step === 'exterior' && vehicle) {
    return <ExteriorInspectionScreen vehicleId={vehicle.vin} findings={exteriorFindings} onChangeFindings={setExteriorFindings} onBack={() => setStep('identify')} onContinue={() => setStep('additional')} />;
  }

  if (step === 'additional') {
    return (
      <View style={styles.page}>
        <View style={styles.moduleHeader}>
          <Pressable onPress={() => setStep('exterior')} accessibilityRole="button" style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
            <Text style={styles.backIcon}>‹</Text><Text style={styles.backText}>Exterior Inspection</Text>
          </Pressable>
        </View>
        <View style={styles.placeholder}>
          <View style={styles.placeholderMark}><Text style={styles.placeholderMarkText}>✓</Text></View>
          <Text style={styles.placeholderEyebrow}>EXTERIOR INSPECTION SAVED</Text>
          <Text style={styles.placeholderTitle}>Additional Inspection{'\n'}Coming Next</Text>
          <Pressable onPress={onExit} accessibilityRole="button" style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
            <Text style={styles.secondaryButtonText}>Back to Shop Lobby</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.moduleHeader}>
        <Pressable onPress={onExit} accessibilityRole="button" style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
          <Text style={styles.backIcon}>‹</Text><Text style={styles.backText}>Shop Lobby</Text>
        </Pressable>
        <Text style={styles.stepLabel}>STEP 1</Text>
      </View>
      <ScrollView
        ref={scrollRef}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        onScroll={keyboardScroll.onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(34, keyboardScroll.bottomPadding) }]}
      >
        <Text style={styles.eyebrow}>VEHICLE CHECK-IN</Text>
        <Text style={styles.title}>Identify Vehicle</Text>
        <Text style={styles.intro}>Scan the VIN or enter it manually to begin.</Text>

        <Text style={styles.label}>VIN</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Scan VIN"
          disabled={busy}
          onPress={() => identify(DEMO_VIN)}
          style={({ pressed }) => [styles.scanButton, pressed && styles.pressed, busy && styles.disabled]}
        >
          <View style={styles.scanIcon}><Text style={styles.scanIconText}>⌗</Text></View>
          <Text style={styles.scanButtonText}>{busy ? 'Identifying…' : 'Scan VIN'}</Text>
        </Pressable>

        <Pressable onPress={() => setManualEntry((visible) => !visible)} accessibilityRole="button" style={({ pressed }) => [styles.manualToggle, pressed && styles.pressed]}>
          <Text style={styles.manualToggleText}>Enter VIN Manually</Text><Text style={styles.toggleChevron}>{manualEntry ? '⌃' : '⌄'}</Text>
        </Pressable>

        {manualEntry && <View style={styles.manualPanel}>
          <TextInput
            ref={vinInputRef}
            accessibilityLabel="VIN"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={17}
            onChangeText={(value) => setVin(value.toUpperCase())}
            placeholder="17-character VIN"
            placeholderTextColor={colors.subtle}
            returnKeyType="done"
            onFocus={() => keyboardScroll.onInputFocus(vinInputRef.current)}
            onBlur={keyboardScroll.onInputBlur}
            style={styles.input}
            value={vin}
          />
          <Pressable disabled={!vin.trim() || busy} onPress={() => identify(vin)} accessibilityRole="button" style={({ pressed }) => [styles.identifyButton, pressed && styles.pressed, (!vin.trim() || busy) && styles.disabled]}>
            <Text style={styles.identifyButtonText}>Identify Vehicle</Text>
          </Pressable>
        </View>}

        {vehicle && <View style={styles.identifiedSection}>
          <View style={styles.identifiedHeader}><Text style={styles.sectionTitle}>Vehicle Identified</Text><Text style={styles.identifiedVin}>{vehicle.vin}</Text></View>
          <View style={styles.vehicleGrid}>
            <VehicleValue label="YEAR" value={vehicle.year} />
            <VehicleValue label="MAKE" value={vehicle.make} />
            <VehicleValue label="MODEL" value={vehicle.model} />
            <VehicleValue label="TRIM" value={vehicle.trim || 'Not available'} />
          </View>

          <Text style={styles.sectionTitle}>Vehicle Details</Text>
          <Field label="Stock Number" value={fields.stockNumber} onChangeText={(value) => updateField('stockNumber', value)} keyboardScroll={keyboardScroll} />
          <Field label="Mileage" value={fields.mileage} onChangeText={(value) => updateField('mileage', value)} keyboardType="number-pad" keyboardScroll={keyboardScroll} />
          <View style={styles.fieldRow}>
            <View style={styles.fieldColumn}><Field label="Color" value={fields.color} onChangeText={(value) => updateField('color', value)} keyboardScroll={keyboardScroll} /></View>
            <View style={styles.fieldColumn}><Field label="Color Code" value={fields.colorCode} onChangeText={(value) => updateField('colorCode', value)} autoCapitalize="characters" keyboardScroll={keyboardScroll} /></View>
          </View>
        </View>}

        <Pressable
          disabled={!vehicle}
          onPress={() => setStep('exterior')}
          accessibilityRole="button"
          style={({ pressed }) => [styles.continueButton, pressed && styles.pressed, !vehicle && styles.disabled]}
        >
          <Text style={styles.continueButtonText}>Continue</Text><Text style={styles.continueArrow}>›</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function VehicleValue({ label, value }: { label: string; value: string }) {
  return <View style={styles.vehicleValue}><Text style={styles.valueLabel}>{label}</Text><Text numberOfLines={1} style={styles.valueText}>{value}</Text></View>;
}

type KeyboardScroll = ReturnType<typeof useKeyboardAwareFormScroll>;

function Field({ label, keyboardScroll, ...props }: { label: string; keyboardScroll: KeyboardScroll } & React.ComponentProps<typeof TextInput>) {
  const inputRef = useRef<TextInput>(null);
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput {...props} ref={inputRef} onFocus={(event) => { keyboardScroll.onInputFocus(inputRef.current); props.onFocus?.(event); }} onBlur={(event) => { keyboardScroll.onInputBlur(); props.onBlur?.(event); }} placeholderTextColor={colors.subtle} style={styles.input} /></View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  moduleHeader: { minHeight: 52, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border },
  back: { minHeight: 44, flexDirection: 'row', alignItems: 'center', paddingRight: 14 },
  backIcon: { color: colors.accent, fontSize: 28, lineHeight: 30, marginRight: 5 },
  backText: { color: colors.text, fontSize: 13, fontWeight: '800' },
  stepLabel: { marginLeft: 'auto', color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 34 },
  eyebrow: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.8 },
  title: { color: colors.text, fontSize: 34, lineHeight: 39, fontWeight: '900', letterSpacing: -1, marginTop: 6 },
  intro: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 7, marginBottom: 26 },
  label: { color: colors.subtle, fontSize: 9, fontWeight: '900', letterSpacing: 1.2, marginBottom: 8 },
  scanButton: { minHeight: 68, borderRadius: 13, backgroundColor: colors.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  scanIcon: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(7,10,13,0.16)', marginRight: 11 },
  scanIconText: { color: colors.background, fontSize: 22, fontWeight: '900' },
  scanButtonText: { color: colors.background, fontSize: 18, fontWeight: '900' },
  manualToggle: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  manualToggleText: { color: colors.text, fontSize: 13, fontWeight: '800' },
  toggleChevron: { color: colors.muted, fontSize: 17, marginLeft: 8 },
  manualPanel: { padding: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.panel, marginBottom: 16 },
  input: { minHeight: 52, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 10, backgroundColor: colors.panelRaised, color: colors.text, fontSize: 15, fontWeight: '700' },
  identifyButton: { minHeight: 52, marginTop: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#26343D', borderWidth: 1, borderColor: '#3B4D59' },
  identifyButtonText: { color: colors.text, fontSize: 13, fontWeight: '900' },
  identifiedSection: { marginTop: 8 },
  identifiedHeader: { marginBottom: 12 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '900', marginTop: 18, marginBottom: 10 },
  identifiedVin: { color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  vehicleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  vehicleValue: { width: '48.7%', minHeight: 68, padding: 11, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panel },
  valueLabel: { color: colors.subtle, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  valueText: { color: colors.text, fontSize: 15, fontWeight: '900', marginTop: 7 },
  field: { marginBottom: 12 },
  fieldLabel: { color: colors.muted, fontSize: 10, fontWeight: '800', marginBottom: 7 },
  fieldRow: { flexDirection: 'row', gap: 10 },
  fieldColumn: { flex: 1 },
  continueButton: { minHeight: 62, marginTop: 18, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent },
  continueButtonText: { color: colors.background, fontSize: 16, fontWeight: '900' },
  continueArrow: { position: 'absolute', right: 18, color: colors.background, fontSize: 28, fontWeight: '700' },
  secondaryButton: { minHeight: 54, minWidth: 230, marginTop: 28, paddingHorizontal: 20, borderRadius: 11, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panel, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: colors.text, fontSize: 13, fontWeight: '800' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  placeholderMark: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: '#123525', borderWidth: 1, borderColor: '#256845' },
  placeholderMarkText: { color: '#58D68D', fontSize: 25, fontWeight: '900' },
  placeholderEyebrow: { color: '#58D68D', fontSize: 9, fontWeight: '900', letterSpacing: 1.6, marginTop: 18 },
  placeholderTitle: { color: colors.text, fontSize: 27, lineHeight: 34, fontWeight: '900', textAlign: 'center', marginTop: 9 },
  disabled: { opacity: 0.42 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
});
