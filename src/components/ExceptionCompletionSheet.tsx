import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProductionDepartmentName, Vehicle } from '../types';
import { colors } from '../theme/colors';
import { workflowColors } from '../theme/workflowColors';

type Props = {
  visible: boolean;
  vehicle: Vehicle | null;
  currentDepartment: ProductionDepartmentName | null;
  originDepartment: ProductionDepartmentName | null;
  recommendedDestination: ProductionDepartmentName | null;
  availableDestinations: ProductionDepartmentName[];
  onSelectDestination: (destination: ProductionDepartmentName) => void;
  onKeepHere: () => void;
  onCancel: () => void;
};

export function ExceptionCompletionSheet({ visible, vehicle, currentDepartment, originDepartment, recommendedDestination, availableDestinations, onSelectDestination, onKeepHere, onCancel }: Props) {
  if (!vehicle || !currentDepartment || !originDepartment || !recommendedDestination) return null;

  const recommendedIsHere = recommendedDestination === currentDepartment;
  const showOrigin = originDepartment !== currentDepartment && originDepartment !== recommendedDestination;
  const otherDestinations = availableDestinations.filter((department) => department !== currentDepartment && department !== recommendedDestination && department !== originDepartment);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onCancel} accessibilityLabel="Cancel corrective work completion" />
        <SafeAreaView style={styles.sheet} edges={['bottom', 'left', 'right']}>
          <View style={styles.handle} />
          <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <View style={styles.headingRow}>
              <View style={styles.headingCopy}><Text style={styles.kicker}>CORRECTIVE WORK COMPLETE</Text><Text style={styles.title}>Where does this vehicle go now?</Text></View>
              <Pressable onPress={onCancel} accessibilityRole="button" accessibilityLabel="Cancel" hitSlop={10} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable>
            </View>
            <Text style={styles.vehicle}>{vehicle.make} {vehicle.model} · {vehicle.stockNumber}</Text>

            <DestinationButton
              department={recommendedDestination}
              label="RECOMMENDED NEXT"
              detail={recommendedIsHere ? `Keep in ${currentDepartment}` : `Send to ${recommendedDestination}`}
              recommended
              onPress={recommendedIsHere ? onKeepHere : () => onSelectDestination(recommendedDestination)}
            />

            {!recommendedIsHere && <DestinationButton department={currentDepartment} label="KEEP HERE" detail="Corrective work is complete; continue work in this department." onPress={onKeepHere} />}
            {showOrigin && <DestinationButton department={originDepartment} label={`RETURN TO ${originDepartment.toUpperCase()}`} detail={`Send back to ${originDepartment}`} onPress={() => onSelectDestination(originDepartment)} />}

            {otherDestinations.length > 0 && <Text style={styles.otherLabel}>OTHER PRODUCTION DEPARTMENTS</Text>}
            {otherDestinations.map((department) => <DestinationButton key={department} department={department} label={department.toUpperCase()} detail={`Send to ${department}`} onPress={() => onSelectDestination(department)} />)}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function DestinationButton({ department, label, detail, recommended = false, onPress }: { department: ProductionDepartmentName; label: string; detail: string; recommended?: boolean; onPress: () => void }) {
  const departmentColor = workflowColors[department];
  return <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.option, recommended && styles.recommended, { borderLeftColor: departmentColor }, pressed && styles.pressed]}>
    <View style={styles.optionCopy}><Text style={[styles.optionLabel, recommended && styles.recommendedLabel]}>{label}</Text><Text style={styles.optionDetail}>{detail}</Text></View><Text style={[styles.chevron, { color: departmentColor }]}>›</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.66)' },
  sheet: { maxHeight: '90%', backgroundColor: colors.panel, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderBottomWidth: 0, borderColor: colors.border, overflow: 'hidden' },
  handle: { width: 42, height: 4, borderRadius: 2, backgroundColor: colors.subtle, alignSelf: 'center', marginTop: 10 },
  content: { padding: 20, paddingTop: 14, paddingBottom: 24 },
  headingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  headingCopy: { flex: 1 },
  kicker: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginBottom: 6 },
  title: { color: colors.text, fontSize: 25, lineHeight: 31, fontWeight: '900', letterSpacing: -0.5 },
  close: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panelRaised, borderRadius: 24 },
  closeText: { color: colors.muted, fontSize: 29, lineHeight: 31 },
  vehicle: { color: colors.muted, fontSize: 12, fontWeight: '800', marginTop: 10, marginBottom: 17 },
  option: { minHeight: 70, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.panelRaised, borderWidth: 1, borderLeftWidth: 5, borderColor: colors.border, borderRadius: 13, paddingHorizontal: 15, paddingVertical: 12, marginBottom: 9 },
  recommended: { minHeight: 82, backgroundColor: '#222617', borderColor: '#6E5718' },
  optionCopy: { flex: 1 },
  optionLabel: { color: colors.text, fontSize: 14, lineHeight: 18, fontWeight: '900' },
  recommendedLabel: { color: colors.accent, fontSize: 15 },
  optionDetail: { color: colors.muted, fontSize: 10, lineHeight: 15, fontWeight: '700', marginTop: 4 },
  chevron: { fontSize: 29, fontWeight: '700', marginLeft: 10 },
  otherLabel: { color: colors.subtle, fontSize: 8, fontWeight: '900', letterSpacing: 1.2, marginTop: 10, marginBottom: 8 },
  pressed: { opacity: 0.72 },
});
