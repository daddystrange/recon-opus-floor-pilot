import { useMemo, useRef, useState } from 'react';
import {
  Keyboard,
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
import { addProductionWeekdays, calculateTargetCompletion, normalizeToLocalDay } from './jobScheduling';
import { JobPriority, JobProfile, JobProfileErrors, JobType, jobTypeOptions } from './jobProfileTypes';

type Props = {
  profile: JobProfile;
  onChange: (profile: JobProfile) => void;
  onPrevious: () => void;
  onNext: () => void;
};

const priorities: { value: JobPriority; label: string; marker: string }[] = [
  { value: 'normal', label: 'Normal', marker: 'N' },
  { value: 'rush', label: 'Rush', marker: 'R' },
  { value: 'critical', label: 'Critical', marker: '!' },
];

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
const arrivalFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
});

export function JobProfileScreen({ profile, onChange, onPrevious, onNext }: Props) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const keyboardScroll = useKeyboardAwareFormScroll(scrollRef, insets.bottom);
  const [errors, setErrors] = useState<JobProfileErrors>({});
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [draftDate, setDraftDate] = useState(() => profile.targetCompletion ?? Date.now());
  const [newRecommendation, setNewRecommendation] = useState<number | null>(null);

  const validHours = useMemo(() => {
    const value = Number(profile.totalJobHours);
    return profile.totalJobHours.trim() !== '' && Number.isFinite(value) && value >= 0 ? value : null;
  }, [profile.totalJobHours]);

  const update = <K extends keyof JobProfile>(key: K, value: JobProfile[K]) => {
    onChange({ ...profile, [key]: value });
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const toggleJobType = (jobType: JobType) => {
    const jobTypes = profile.jobTypes.includes(jobType)
      ? profile.jobTypes.filter((value) => value !== jobType)
      : [...profile.jobTypes, jobType];
    update('jobTypes', jobTypes);
  };

  const commitHours = () => {
    if (validHours === null) return;
    const calculated = calculateTargetCompletion(new Date(profile.arrivalTimestamp), validHours);
    if (!calculated) return;
    const calculatedTimestamp = normalizeToLocalDay(calculated.getTime());
    if (profile.targetCompletionWasOverridden && profile.targetCompletion !== calculatedTimestamp) {
      onChange({ ...profile, calculatedTargetCompletion: calculatedTimestamp });
      setNewRecommendation(calculatedTimestamp);
      return;
    }
    onChange({
      ...profile,
      calculatedTargetCompletion: calculatedTimestamp,
      targetCompletion: calculatedTimestamp,
      targetCompletionWasOverridden: false,
    });
    setNewRecommendation(null);
  };

  const openDatePicker = () => {
    Keyboard.dismiss();
    setDraftDate(profile.targetCompletion ?? profile.calculatedTargetCompletion ?? normalizeToLocalDay(Date.now()));
    setDatePickerVisible(true);
  };

  const saveOverride = () => {
    onChange({ ...profile, targetCompletion: normalizeToLocalDay(draftDate), targetCompletionWasOverridden: true });
    setNewRecommendation(null);
    setDatePickerVisible(false);
  };

  const validateAndContinue = () => {
    Keyboard.dismiss();
    let profileToValidate = profile;
    if (validHours !== null && !profile.targetCompletionWasOverridden) {
      const calculated = calculateTargetCompletion(new Date(profile.arrivalTimestamp), validHours);
      if (calculated) {
        const calculatedTimestamp = normalizeToLocalDay(calculated.getTime());
        profileToValidate = {
          ...profile,
          calculatedTargetCompletion: calculatedTimestamp,
          targetCompletion: calculatedTimestamp,
        };
        onChange(profileToValidate);
      }
    }
    const nextErrors: JobProfileErrors = {};
    if (!profileToValidate.customer.trim()) nextErrors.customer = 'Enter who this job is for';
    if (profileToValidate.jobTypes.length === 0) nextErrors.jobTypes = 'Select at least one job type';
    if (validHours === null) nextErrors.totalJobHours = 'Enter the estimated job hours';
    if (!profileToValidate.targetCompletion || profileToValidate.targetCompletion < profileToValidate.arrivalTimestamp) nextErrors.targetCompletion = 'Choose a valid completion date';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) onNext();
  };

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Pressable onPress={onPrevious} accessibilityRole="button" style={({ pressed }) => [styles.headerBack, pressed && styles.pressed]}>
          <Text style={styles.backIcon}>‹</Text><Text style={styles.backText}>Vehicle Information</Text>
        </Pressable>
        <Text style={styles.step}>STEP 2</Text>
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
        <Text style={styles.eyebrow}>VEHICLE INTAKE</Text>
        <Text style={styles.title}>Job Profile</Text>
        <Text style={styles.intro}>A quick operational briefing for everyone who touches this vehicle.</Text>

        <View style={styles.briefingCard}>
          <SectionHeading title="Who is the job for?" />
          <FormField label="Customer" error={errors.customer} inputProps={{ value: profile.customer, onChangeText: (value) => update('customer', value), placeholder: 'Enter person or organization', returnKeyType: 'next' }} keyboardScroll={keyboardScroll} />
          <FormField label="Company / Dealer" optional inputProps={{ value: profile.companyOrDealer, onChangeText: (value) => update('companyOrDealer', value), placeholder: 'Optional', returnKeyType: 'done' }} keyboardScroll={keyboardScroll} />

          <SectionHeading title="Why is it here?" />
          <View style={styles.jobTypes}>
            {jobTypeOptions.map((option) => {
              const selected = profile.jobTypes.includes(option.value);
              return <Pressable key={option.value} onPress={() => toggleJobType(option.value)} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} style={({ pressed }) => [styles.choice, selected && styles.choiceSelected, pressed && styles.pressed]}>
                <View style={[styles.check, selected && styles.checkSelected]}><Text style={styles.checkText}>{selected ? '✓' : ''}</Text></View>
                <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{option.label}</Text>
              </Pressable>;
            })}
          </View>
          {errors.jobTypes && <Text style={styles.error}>{errors.jobTypes}</Text>}

          <SectionHeading title="Schedule" />
          <View style={styles.arrivalRow}><View><Text style={styles.fieldLabel}>Arrival</Text><Text style={styles.arrivalValue}>{arrivalFormatter.format(new Date(profile.arrivalTimestamp))}</Text></View><Text style={styles.locked}>RECORDED</Text></View>
          <FormField
            label="Total Job Hours"
            error={errors.totalJobHours}
            keyboardScroll={keyboardScroll}
            inputProps={{
              value: profile.totalJobHours,
              onChangeText: (value) => update('totalJobHours', value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')),
              onBlur: commitHours,
              placeholder: '0.0',
              keyboardType: 'decimal-pad',
              returnKeyType: 'done',
            }}
            suffix="hours"
          />
          <Text style={styles.fieldLabel}>Target Completion</Text>
          <Pressable onPress={openDatePicker} accessibilityRole="button" style={({ pressed }) => [styles.dateField, errors.targetCompletion && styles.inputError, pressed && styles.pressed]}>
            <View><Text style={styles.dateValue}>{profile.targetCompletion ? dateFormatter.format(new Date(profile.targetCompletion)) : 'Select completion date'}</Text><Text style={styles.dateMeta}>{profile.targetCompletionWasOverridden ? 'Manually adjusted' : 'Auto-calculated'}</Text></View>
            <Text style={styles.editDate}>EDIT</Text>
          </Pressable>
          {errors.targetCompletion && <Text style={styles.error}>{errors.targetCompletion}</Text>}
          {newRecommendation && <View style={styles.recommendation}>
            <Text style={styles.recommendationTitle}>Job hours suggest {dateFormatter.format(new Date(newRecommendation))}</Text>
            <Text style={styles.recommendationCopy}>Keep your adjusted date or use the new calculation.</Text>
            <View style={styles.recommendationActions}>
              <Pressable onPress={() => setNewRecommendation(null)} style={({ pressed }) => [styles.smallAction, pressed && styles.pressed]}><Text style={styles.smallActionText}>Keep Current</Text></Pressable>
              <Pressable onPress={() => { onChange({ ...profile, targetCompletion: newRecommendation, calculatedTargetCompletion: newRecommendation, targetCompletionWasOverridden: false }); setNewRecommendation(null); }} style={({ pressed }) => [styles.smallAction, styles.smallActionPrimary, pressed && styles.pressed]}><Text style={styles.smallActionPrimaryText}>Use Suggested</Text></Pressable>
            </View>
          </View>}

          <SectionHeading title="Priority" />
          <View style={styles.priorityRow}>
            {priorities.map((option) => {
              const selected = profile.priority === option.value;
              return <Pressable key={option.value} onPress={() => update('priority', option.value)} accessibilityRole="radio" accessibilityState={{ selected }} style={({ pressed }) => [styles.priority, selected && styles.prioritySelected, pressed && styles.pressed]}>
                <View style={[styles.priorityMarker, selected && styles.priorityMarkerSelected]}><Text style={styles.priorityMarkerText}>{selected ? '✓' : option.marker}</Text></View>
                <Text style={[styles.priorityText, selected && styles.priorityTextSelected]}>{option.label}</Text>
              </Pressable>;
            })}
          </View>
        </View>

        <View style={styles.navigation}>
          <Pressable onPress={onPrevious} accessibilityRole="button" style={({ pressed }) => [styles.previous, pressed && styles.pressed]}><Text style={styles.previousText}>Previous</Text></Pressable>
          <Pressable onPress={validateAndContinue} accessibilityRole="button" style={({ pressed }) => [styles.next, pressed && styles.pressed]}><Text style={styles.nextText}>Next</Text><Text style={styles.nextArrow}>›</Text></Pressable>
        </View>
      </ScrollView>
      <DateSelector visible={datePickerVisible} value={draftDate} minimumDate={profile.arrivalTimestamp} onChange={setDraftDate} onCancel={() => setDatePickerVisible(false)} onSave={saveOverride} />
    </KeyboardAvoidingView>
  );
}

type KeyboardScroll = ReturnType<typeof useKeyboardAwareFormScroll>;

function FormField({ label, optional, error, suffix, inputProps, keyboardScroll }: { label: string; optional?: boolean; error?: string; suffix?: string; inputProps: React.ComponentProps<typeof TextInput>; keyboardScroll: KeyboardScroll }) {
  const inputRef = useRef<TextInput>(null);
  return <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}{optional && <Text style={styles.optional}>  OPTIONAL</Text>}</Text>
    <View>
      <TextInput
        {...inputProps}
        ref={inputRef}
        onFocus={(event) => { keyboardScroll.onInputFocus(inputRef.current); inputProps.onFocus?.(event); }}
        onBlur={(event) => { keyboardScroll.onInputBlur(); inputProps.onBlur?.(event); }}
        placeholderTextColor={colors.subtle}
        style={[styles.input, suffix && styles.inputWithSuffix, error && styles.inputError]}
      />
      {suffix && <Text style={styles.suffix}>{suffix}</Text>}
    </View>
    {error && <Text style={styles.error}>{error}</Text>}
  </View>;
}

function SectionHeading({ title }: { title: string }) {
  return <View style={styles.sectionHeading}><View style={styles.sectionRule} /><Text style={styles.sectionTitle}>{title}</Text></View>;
}

function DateSelector({ visible, value, minimumDate, onChange, onCancel, onSave }: { visible: boolean; value: number; minimumDate: number; onChange: (value: number) => void; onCancel: () => void; onSave: () => void }) {
  const move = (days: number) => {
    const next = addProductionWeekdays(new Date(value), Math.abs(days));
    if (days < 0) {
      const previous = new Date(value);
      let remaining = Math.abs(days);
      while (remaining > 0) {
        previous.setDate(previous.getDate() - 1);
        if (previous.getDay() !== 0 && previous.getDay() !== 6) remaining -= 1;
      }
      onChange(Math.max(normalizeToLocalDay(minimumDate), normalizeToLocalDay(previous.getTime())));
      return;
    }
    onChange(normalizeToLocalDay(next.getTime()));
  };
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
    <View style={styles.modalBackdrop}>
      <View style={styles.dateModal}>
        <Text style={styles.dateModalEyebrow}>TARGET COMPLETION</Text>
        <Text style={styles.dateModalValue}>{dateFormatter.format(new Date(value))}</Text>
        <View style={styles.dateControls}>
          <Pressable onPress={() => move(-5)} style={({ pressed }) => [styles.dateControl, pressed && styles.pressed]}><Text style={styles.dateControlText}>− Week</Text></Pressable>
          <Pressable onPress={() => move(-1)} style={({ pressed }) => [styles.dateControl, pressed && styles.pressed]}><Text style={styles.dateControlText}>− Day</Text></Pressable>
          <Pressable onPress={() => move(1)} style={({ pressed }) => [styles.dateControl, pressed && styles.pressed]}><Text style={styles.dateControlText}>+ Day</Text></Pressable>
          <Pressable onPress={() => move(5)} style={({ pressed }) => [styles.dateControl, pressed && styles.pressed]}><Text style={styles.dateControlText}>+ Week</Text></Pressable>
        </View>
        <View style={styles.modalActions}><Pressable onPress={onCancel} style={({ pressed }) => [styles.modalCancel, pressed && styles.pressed]}><Text style={styles.modalCancelText}>Cancel</Text></Pressable><Pressable onPress={onSave} style={({ pressed }) => [styles.modalSave, pressed && styles.pressed]}><Text style={styles.modalSaveText}>Use This Date</Text></Pressable></View>
      </View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  header: { minHeight: 52, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border },
  headerBack: { minHeight: 44, flexDirection: 'row', alignItems: 'center', paddingRight: 14 },
  backIcon: { color: colors.accent, fontSize: 28, lineHeight: 30, marginRight: 5 },
  backText: { color: colors.text, fontSize: 13, fontWeight: '800' },
  step: { marginLeft: 'auto', color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  content: { paddingHorizontal: 18, paddingTop: 20 },
  eyebrow: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.8 },
  title: { color: colors.text, fontSize: 31, lineHeight: 36, fontWeight: '900', letterSpacing: -0.8, marginTop: 5 },
  intro: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 6, marginBottom: 17, maxWidth: 330 },
  briefingCard: { paddingHorizontal: 16, paddingBottom: 18, borderWidth: 1, borderColor: '#283039', borderRadius: 16, backgroundColor: '#101419' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', marginTop: 22, marginBottom: 13 },
  sectionRule: { width: 3, height: 18, borderRadius: 2, backgroundColor: colors.accent, marginRight: 9 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '900', letterSpacing: -0.2 },
  field: { marginBottom: 14 },
  fieldLabel: { color: colors.muted, fontSize: 10, fontWeight: '800', marginBottom: 7 },
  optional: { color: colors.subtle, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  input: { minHeight: 54, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 11, backgroundColor: colors.panelRaised, color: colors.text, fontSize: 15, fontWeight: '700' },
  inputWithSuffix: { paddingRight: 64 },
  inputError: { borderColor: '#C96055' },
  suffix: { position: 'absolute', right: 14, top: 18, color: colors.muted, fontSize: 11, fontWeight: '800' },
  error: { color: '#E28378', fontSize: 11, fontWeight: '700', marginTop: 6 },
  jobTypes: { gap: 9 },
  choice: { minHeight: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, borderRadius: 11, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panelRaised },
  choiceSelected: { borderColor: '#A98A35', backgroundColor: '#282312' },
  check: { width: 24, height: 24, borderRadius: 7, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#46505B', marginRight: 11 },
  checkSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkText: { color: colors.background, fontSize: 13, fontWeight: '900' },
  choiceText: { color: colors.muted, fontSize: 14, fontWeight: '800' },
  choiceTextSelected: { color: colors.text },
  arrivalRow: { minHeight: 67, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 11, backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border },
  arrivalValue: { color: colors.text, fontSize: 14, fontWeight: '800' },
  locked: { color: '#6FAE8B', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  dateField: { minHeight: 67, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: colors.border, borderRadius: 11, backgroundColor: colors.panelRaised },
  dateValue: { color: colors.text, fontSize: 14, fontWeight: '900' },
  dateMeta: { color: colors.muted, fontSize: 9, fontWeight: '700', marginTop: 4 },
  editDate: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  recommendation: { marginTop: 10, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#5B4C24', backgroundColor: '#211D12' },
  recommendationTitle: { color: '#E7C66B', fontSize: 12, fontWeight: '900' },
  recommendationCopy: { color: '#A89A75', fontSize: 10, lineHeight: 15, marginTop: 3 },
  recommendationActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  smallAction: { flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#554D39' },
  smallActionPrimary: { backgroundColor: colors.accent, borderColor: colors.accent },
  smallActionText: { color: colors.text, fontSize: 10, fontWeight: '900' },
  smallActionPrimaryText: { color: colors.background, fontSize: 10, fontWeight: '900' },
  priorityRow: { flexDirection: 'row', gap: 8 },
  priority: { flex: 1, minHeight: 66, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 11, backgroundColor: colors.panelRaised },
  prioritySelected: { borderColor: '#A98A35', backgroundColor: '#282312' },
  priorityMarker: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#46505B' },
  priorityMarkerSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  priorityMarkerText: { color: colors.text, fontSize: 10, fontWeight: '900' },
  priorityText: { color: colors.muted, fontSize: 10, fontWeight: '900', marginTop: 6 },
  priorityTextSelected: { color: colors.text },
  navigation: { flexDirection: 'row', gap: 10, marginTop: 16 },
  previous: { flex: 0.42, minHeight: 60, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panel },
  previousText: { color: colors.text, fontSize: 14, fontWeight: '900' },
  next: { flex: 0.58, minHeight: 60, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.accent },
  nextText: { color: colors.background, fontSize: 15, fontWeight: '900' },
  nextArrow: { position: 'absolute', right: 16, color: colors.background, fontSize: 25 },
  pressed: { opacity: 0.76, transform: [{ scale: 0.99 }] },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', padding: 16, backgroundColor: 'rgba(0,0,0,0.72)' },
  dateModal: { padding: 18, paddingBottom: 22, borderRadius: 18, borderWidth: 1, borderColor: '#303842', backgroundColor: '#13171C' },
  dateModalEyebrow: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.4 },
  dateModalValue: { color: colors.text, fontSize: 25, fontWeight: '900', marginTop: 7 },
  dateControls: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 },
  dateControl: { width: '48.7%', minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 9, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panelRaised },
  dateControlText: { color: colors.text, fontSize: 12, fontWeight: '800' },
  modalActions: { flexDirection: 'row', gap: 9, marginTop: 17 },
  modalCancel: { flex: 0.42, minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  modalCancelText: { color: colors.text, fontSize: 13, fontWeight: '800' },
  modalSave: { flex: 0.58, minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: colors.accent },
  modalSaveText: { color: colors.background, fontSize: 13, fontWeight: '900' },
});
