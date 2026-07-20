import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getStatusColor, productionSequence } from '../data/departments';
import { CheckInResponse, Department, DepartmentName, Vehicle } from '../types';
import { colors } from '../theme/colors';

const checkInOptions: CheckInResponse[] = [
  'Everything Good',
  'Waiting on Booth',
  'Waiting on Parts',
  'Need Help',
];

const checkInColors: Record<CheckInResponse, string> = {
  'Everything Good': '#22C55E',
  'Waiting on Booth': '#F59E0B',
  'Waiting on Parts': '#8B5CF6',
  'Need Help': '#EF4444',
};

type Props = {
  department: Department | null;
  vehicle: Vehicle | null;
  onClose: () => void;
  onStatusChange: (status: string) => void;
  onCheckIn: (response: CheckInResponse) => void;
  onMoveVehicle: (destination: DepartmentName) => void;
};

export function VehicleDetailView({ department, vehicle, onClose, onStatusChange, onCheckIn, onMoveVehicle }: Props) {
  const insets = useSafeAreaInsets();

  if (!vehicle || !department) return null;

  const currentIndex = productionSequence.indexOf(department.name);
  const recommendedDepartment = productionSequence[currentIndex + 1];
  const moveChoices = productionSequence.filter((name) => name !== department.name);

  const requestMove = (destination: DepartmentName) => {
    Alert.alert(
      'Move Vehicle',
      `Move ${vehicle.make} ${vehicle.model} from ${department.name} to ${destination}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => onMoveVehicle(destination) },
      ],
    );
  };

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen" statusBarTranslucent={false} onRequestClose={onClose}>
      <SafeAreaView style={[styles.safe, { paddingTop: insets.top }]} edges={['bottom', 'left', 'right']}>
        <View style={styles.topBar}>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={`Back to ${department.name} Department`} accessibilityHint="Returns to the same position in the department queue" hitSlop={8} style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
            <Text style={styles.closeIcon}>‹</Text><Text style={styles.closeText}>Back to {department.name} Department</Text>
          </Pressable>
          <Text style={styles.topTitle}>VEHICLE DETAIL</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.eyebrow}>{vehicle.year} · {vehicle.color.toUpperCase()}</Text>
          <Text style={styles.title}>{vehicle.make}</Text>
          <Text style={styles.model}>{vehicle.model}</Text>

          <View style={[styles.currentStatus, { borderLeftColor: vehicle.statusColor }]}>
            <Text style={styles.sectionLabel}>CURRENT STATUS</Text>
            <View style={styles.statusLine}>
              <View style={[styles.statusDot, { backgroundColor: vehicle.statusColor }]} />
              <Text style={[styles.currentStatusText, { color: vehicle.statusColor }]}>{vehicle.status}</Text>
            </View>
            <Text style={styles.stageTime}>{vehicle.timeInStage} in stage</Text>
          </View>

          <View style={styles.infoGrid}>
            <Info label="STOCK" value={vehicle.stockNumber} />
            <Info label="DEPARTMENT" value={department.name} />
            <Info label="LOCATION" value={vehicle.location} />
            <Info label="PRIORITY" value={vehicle.priority ? 'Yes' : 'Standard'} />
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Update status</Text>
            <Text style={styles.sectionHint}>One tap updates the floor</Text>
          </View>
          <View style={styles.optionGrid}>
            {department.statusOptions.map((status) => {
              const selected = status === vehicle.status;
              const color = getStatusColor(status);
              return (
                <Pressable key={status} onPress={() => onStatusChange(status)} accessibilityRole="button" accessibilityState={{ selected }} style={({ pressed }) => [styles.option, selected && { borderColor: color, backgroundColor: `${color}18` }, pressed && styles.pressed]}>
                  <View style={[styles.optionDot, { backgroundColor: color }]} />
                  <Text style={[styles.optionText, selected && { color }]}>{status}</Text>
                  {selected && <Text style={[styles.check, { color }]}>✓</Text>}
                </Pressable>
              );
            })}
          </View>

          <View style={[styles.sectionHeader, styles.checkInHeader]}>
            <Text style={styles.sectionTitle}>Quick check-in</Text>
            <Text style={styles.sectionHint}>How is this vehicle going?</Text>
          </View>
          <View style={styles.optionGrid}>
            {checkInOptions.map((response) => {
              const selected = response === vehicle.checkIn;
              const color = checkInColors[response];
              return (
                <Pressable key={response} onPress={() => onCheckIn(response)} accessibilityRole="button" accessibilityState={{ selected }} style={({ pressed }) => [styles.checkInOption, selected && { borderColor: color, backgroundColor: `${color}18` }, pressed && styles.pressed]}>
                  <Text style={[styles.checkInText, selected && { color }]}>{response}</Text>
                  {selected && <Text style={[styles.check, { color }]}>✓</Text>}
                </Pressable>
              );
            })}
          </View>
          {vehicle.checkIn && <Text style={styles.saved}>CHECK-IN SAVED FOR THIS SESSION</Text>}

          <View style={[styles.sectionHeader, styles.moveHeader]}>
            <Text style={styles.sectionTitle}>Move Vehicle</Text>
            <Text style={styles.sectionHint}>Send forward or return to another department</Text>
          </View>
          <View style={styles.optionGrid}>
            {moveChoices.map((destination) => {
              const recommended = destination === recommendedDepartment;
              return (
                <Pressable
                  key={destination}
                  onPress={() => requestMove(destination)}
                  accessibilityRole="button"
                  accessibilityLabel={`${recommended ? 'Recommended. Send' : 'Move'} to ${destination}`}
                  style={({ pressed }) => [styles.moveOption, recommended && styles.moveOptionRecommended, pressed && styles.pressed]}
                >
                  <View style={[styles.moveArrow, recommended && styles.moveArrowRecommended]}><Text style={[styles.moveArrowText, recommended && styles.moveArrowTextRecommended]}>→</Text></View>
                  <View style={styles.moveCopy}>
                    {recommended && <Text style={styles.recommended}>RECOMMENDED NEXT STEP</Text>}
                    <Text style={[styles.moveText, recommended && styles.moveTextRecommended]}>{recommended ? 'Send' : 'Move'} to {destination}</Text>
                  </View>
                  <Text style={[styles.moveChevron, recommended && styles.moveChevronRecommended]}>›</Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <View style={styles.info}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: { minHeight: 62, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border },
  close: { flex: 1, minHeight: 52, flexDirection: 'row', alignItems: 'center', paddingRight: 12 },
  closeIcon: { color: colors.accent, fontSize: 36, lineHeight: 38, marginRight: 5 },
  closeText: { flexShrink: 1, color: colors.text, fontSize: 13, fontWeight: '800' },
  topTitle: { color: colors.muted, textAlign: 'right', fontSize: 10, fontWeight: '900', letterSpacing: 1.8 },
  content: { padding: 20, paddingBottom: 44 },
  eyebrow: { color: colors.accent, fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginTop: 4, marginBottom: 8 },
  title: { color: colors.text, fontSize: 35, fontWeight: '900', letterSpacing: -1 },
  model: { color: '#C9CED4', fontSize: 25, fontWeight: '700', marginTop: 1 },
  currentStatus: { backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border, borderLeftWidth: 6, borderRadius: 14, padding: 18, marginTop: 22 },
  sectionLabel: { color: colors.subtle, fontSize: 9, fontWeight: '900', letterSpacing: 1.4 },
  statusLine: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  statusDot: { width: 9, height: 9, borderRadius: 5, marginRight: 9 },
  currentStatusText: { fontSize: 20, fontWeight: '900' },
  stageTime: { color: colors.muted, fontSize: 12, marginTop: 6, marginLeft: 18 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, borderRadius: 14, marginTop: 14, padding: 6 },
  info: { width: '50%', padding: 12 },
  infoLabel: { color: colors.subtle, fontSize: 9, fontWeight: '900', letterSpacing: 1.1, marginBottom: 5 },
  infoValue: { color: '#D6DADE', fontSize: 13, fontWeight: '700' },
  sectionHeader: { marginTop: 28, marginBottom: 12 },
  checkInHeader: { marginTop: 32 },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '900' },
  sectionHint: { color: colors.muted, fontSize: 12, marginTop: 4 },
  optionGrid: { gap: 10 },
  option: { minHeight: 58, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panelRaised, borderRadius: 12, paddingHorizontal: 16 },
  optionDot: { width: 9, height: 9, borderRadius: 5, marginRight: 12 },
  optionText: { flex: 1, color: '#D6DADE', fontSize: 15, fontWeight: '800' },
  checkInOption: { minHeight: 56, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panelRaised, borderRadius: 12, paddingHorizontal: 16 },
  checkInText: { flex: 1, color: '#D6DADE', fontSize: 15, fontWeight: '800' },
  check: { fontSize: 18, fontWeight: '900' },
  saved: { color: colors.subtle, fontSize: 9, fontWeight: '900', letterSpacing: 1.2, textAlign: 'center', marginTop: 16 },
  moveHeader: { marginTop: 36 },
  moveOption: { minHeight: 62, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panelRaised, borderRadius: 12, paddingHorizontal: 14 },
  moveOptionRecommended: { minHeight: 76, borderColor: '#6E5718', backgroundColor: colors.accentSoft },
  moveArrow: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panel, marginRight: 12 },
  moveArrowRecommended: { backgroundColor: colors.accent },
  moveArrowText: { color: colors.muted, fontSize: 18, fontWeight: '900' },
  moveArrowTextRecommended: { color: colors.background },
  moveCopy: { flex: 1 },
  recommended: { color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 1.2, marginBottom: 4 },
  moveText: { color: '#D6DADE', fontSize: 15, fontWeight: '800' },
  moveTextRecommended: { color: colors.text, fontSize: 17, fontWeight: '900' },
  moveChevron: { color: colors.subtle, fontSize: 28 },
  moveChevronRecommended: { color: colors.accent },
  pressed: { opacity: 0.72 },
});
