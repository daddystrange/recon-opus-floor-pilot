import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Image,
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
import { JobProfileScreen } from './JobProfileScreen';
import { JobProfile } from './jobProfileTypes';
import { DecodedVehicle, DEMO_VIN, demoVinDecoder, VinDecoder } from './vinDecoder';

const intakeLaneImage = require('../../../assets/recon-opus-intake-lane.png');

type Props = {
  onExit: () => void;
  decoder?: VinDecoder;
  jobProfile: JobProfile;
  onChangeJobProfile: (profile: JobProfile) => void;
};

type IntakeFields = {
  stockNumber: string;
  mileage: string;
  color: string;
  colorCode: string;
};

const emptyFields: IntakeFields = { stockNumber: '', mileage: '', color: '', colorCode: '' };

export function VehicleCheckInModule({ onExit, decoder = demoVinDecoder, jobProfile, onChangeJobProfile }: Props) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const vinInputRef = useRef<TextInput>(null);
  const keyboardScroll = useKeyboardAwareFormScroll(scrollRef, insets.bottom);
  const [step, setStep] = useState<'identify' | 'jobProfile' | 'exterior' | 'additional'>('identify');
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

  if (step === 'jobProfile' && vehicle) {
    return <JobProfileScreen profile={jobProfile} onChange={onChangeJobProfile} onPrevious={() => setStep('identify')} onNext={() => setStep('exterior')} />;
  }

  if (step === 'exterior' && vehicle) {
    return <ExteriorInspectionScreen vehicleId={vehicle.vin} findings={exteriorFindings} onChangeFindings={setExteriorFindings} onBack={() => setStep('jobProfile')} onContinue={() => setStep('additional')} />;
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
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Image source={intakeLaneImage} resizeMode="cover" style={styles.intakeEnvironment} />
      </View>
      <View pointerEvents="none" style={styles.environmentWash} />
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
        <Text style={styles.eyebrow}>INTAKE LANE</Text>
        <Text style={styles.title}>Identify Vehicle</Text>
        <Text style={styles.intro}>Scan the VIN to begin receiving this vehicle.</Text>

        <Text style={styles.label}>VIN</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Scan VIN"
          disabled={busy}
          onPress={() => identify(DEMO_VIN)}
          style={({ pressed }) => [styles.scanButton, pressed && styles.pressed, busy && styles.disabled]}
        >
          <View style={styles.scanIcon}><Text style={styles.scanIconText}>⌗</Text></View>
          <View style={styles.scanCopy}>
            <Text style={styles.scanButtonText}>{busy ? 'Identifying…' : 'Scan VIN'}</Text>
            <Text style={styles.scanButtonHint}>Use camera to identify vehicle</Text>
          </View>
          <Text style={styles.scanArrow}>›</Text>
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
          onPress={() => setStep('jobProfile')}
          accessibilityRole="button"
          style={({ pressed }) => [styles.continueButton, !vehicle && styles.continueDisabled, pressed && styles.pressed]}
        >
          <Text style={[styles.continueButtonText, !vehicle && styles.continueButtonTextDisabled]}>Continue</Text><Text style={[styles.continueArrow, !vehicle && styles.continueArrowDisabled]}>›</Text>
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
  intakeEnvironment: { width: '100%', height: '100%' },
  environmentWash: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(4, 7, 9, 0.42)' },
  moduleHeader: { minHeight: 52, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(7, 10, 13, 0.74)', borderBottomWidth: 1, borderBottomColor: 'rgba(99, 111, 119, 0.35)' },
  back: { minHeight: 44, flexDirection: 'row', alignItems: 'center', paddingRight: 14 },
  backIcon: { color: colors.accent, fontSize: 28, lineHeight: 30, marginRight: 5 },
  backText: { color: colors.text, fontSize: 13, fontWeight: '800' },
  stepLabel: { marginLeft: 'auto', color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 34 },
  eyebrow: { color: '#E7B857', fontSize: 9, fontWeight: '900', letterSpacing: 1.8, textShadowColor: 'rgba(0, 0, 0, 0.9)', textShadowRadius: 8 },
  title: { color: colors.text, fontSize: 34, lineHeight: 39, fontWeight: '900', letterSpacing: -1, marginTop: 6, textShadowColor: 'rgba(0, 0, 0, 0.92)', textShadowRadius: 10 },
  intro: { color: '#B9C0C5', fontSize: 13, lineHeight: 19, fontWeight: '600', marginTop: 7, marginBottom: 26, textShadowColor: 'rgba(0, 0, 0, 0.9)', textShadowRadius: 8 },
  label: { color: '#AAB1B6', fontSize: 9, fontWeight: '900', letterSpacing: 1.2, marginBottom: 8 },
  scanButton: { minHeight: 78, borderRadius: 15, paddingHorizontal: 15, backgroundColor: 'rgba(16, 20, 22, 0.90)', borderWidth: 1, borderColor: 'rgba(211, 159, 54, 0.72)', flexDirection: 'row', alignItems: 'center', shadowColor: '#D39F36', shadowOpacity: 0.14, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 5 },
  scanIcon: { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(211, 159, 54, 0.17)', borderWidth: 1, borderColor: 'rgba(231, 184, 87, 0.46)', marginRight: 13 },
  scanIconText: { color: '#F0C66F', fontSize: 23, fontWeight: '900' },
  scanCopy: { flex: 1 },
  scanButtonText: { color: colors.white, fontSize: 17, fontWeight: '900' },
  scanButtonHint: { color: '#9A9FA2', fontSize: 9, fontWeight: '700', marginTop: 4 },
  scanArrow: { color: '#DDB45E', fontSize: 27, fontWeight: '600', marginLeft: 8 },
  manualToggle: { minHeight: 54, marginTop: 5, paddingHorizontal: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  manualToggleText: { color: '#E2E5E7', fontSize: 13, fontWeight: '800' },
  toggleChevron: { color: colors.muted, fontSize: 17, marginLeft: 8 },
  manualPanel: { padding: 14, borderWidth: 1, borderColor: 'rgba(96, 108, 116, 0.56)', borderRadius: 12, backgroundColor: 'rgba(11, 16, 19, 0.92)', marginBottom: 16 },
  input: { minHeight: 52, paddingHorizontal: 14, borderWidth: 1, borderColor: 'rgba(96, 108, 116, 0.62)', borderRadius: 10, backgroundColor: 'rgba(20, 27, 31, 0.94)', color: colors.text, fontSize: 15, fontWeight: '700' },
  identifyButton: { minHeight: 52, marginTop: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#26343D', borderWidth: 1, borderColor: '#3B4D59' },
  identifyButtonText: { color: colors.text, fontSize: 13, fontWeight: '900' },
  identifiedSection: { marginTop: 8, padding: 14, borderRadius: 14, backgroundColor: 'rgba(8, 13, 16, 0.88)', borderWidth: 1, borderColor: 'rgba(78, 91, 100, 0.48)' },
  identifiedHeader: { marginBottom: 12 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '900', marginTop: 18, marginBottom: 10 },
  identifiedVin: { color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  vehicleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  vehicleValue: { width: '48.7%', minHeight: 68, padding: 11, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(80, 92, 101, 0.52)', backgroundColor: 'rgba(18, 24, 28, 0.92)' },
  valueLabel: { color: colors.subtle, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  valueText: { color: colors.text, fontSize: 15, fontWeight: '900', marginTop: 7 },
  field: { marginBottom: 12 },
  fieldLabel: { color: colors.muted, fontSize: 10, fontWeight: '800', marginBottom: 7 },
  fieldRow: { flexDirection: 'row', gap: 10 },
  fieldColumn: { flex: 1 },
  continueButton: { minHeight: 62, marginTop: 18, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#D8A83F', borderWidth: 1, borderColor: '#F0C66F' },
  continueDisabled: { backgroundColor: 'rgba(24, 29, 32, 0.90)', borderColor: 'rgba(91, 101, 108, 0.48)' },
  continueButtonText: { color: colors.background, fontSize: 16, fontWeight: '900' },
  continueButtonTextDisabled: { color: '#697279' },
  continueArrow: { position: 'absolute', right: 18, color: colors.background, fontSize: 28, fontWeight: '700' },
  continueArrowDisabled: { color: '#596168' },
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
