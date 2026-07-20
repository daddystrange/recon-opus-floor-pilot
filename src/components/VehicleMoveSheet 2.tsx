import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { productionSequence } from '../data/departments';
import { DepartmentName, Vehicle } from '../types';
import { colors } from '../theme/colors';

type Props = {
  visible: boolean;
  vehicle: Vehicle | null;
  currentDepartment: DepartmentName | null;
  onClose: () => void;
  onConfirm: (destination: DepartmentName) => void;
};

export function VehicleMoveSheet({ visible, vehicle, currentDepartment, onClose, onConfirm }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [pendingDestination, setPendingDestination] = useState<DepartmentName | null>(null);

  useEffect(() => {
    if (visible) {
      setExpanded(false);
      setPendingDestination(null);
    }
  }, [visible, vehicle?.id]);

  if (!vehicle || !currentDepartment) return null;

  const currentIndex = productionSequence.indexOf(currentDepartment);
  const nextDepartment = productionSequence[currentIndex + 1];
  const otherDepartments = productionSequence.filter((name) => name !== currentDepartment && name !== nextDepartment);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close move vehicle sheet" />
        <SafeAreaView style={styles.sheet} edges={['bottom', 'left', 'right']}>
          <View style={styles.handle} />
          <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <View style={styles.headingRow}>
              <View>
                <Text style={styles.kicker}>PRODUCTION MOVE</Text>
                <Text style={styles.title}>Move Vehicle</Text>
              </View>
              <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={10} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable>
            </View>

            <View style={styles.vehicleRow}>
              <View style={styles.vehicleCopy}><Text style={styles.vehicleName}>{vehicle.make} {vehicle.model}</Text><Text style={styles.stock}>{vehicle.stockNumber}</Text></View>
              <View style={styles.departmentPill}><Text style={styles.departmentLabel}>CURRENT DEPARTMENT</Text><Text style={styles.departmentValue}>{currentDepartment}</Text></View>
            </View>

            {pendingDestination ? (
              <View style={styles.confirmation}>
                <Text style={styles.confirmLabel}>CONFIRM MOVE</Text>
                <Text style={styles.confirmText}>Move {vehicle.make} {vehicle.model} from {currentDepartment} to {pendingDestination}?</Text>
                <View style={styles.confirmActions}>
                  <Pressable onPress={() => setPendingDestination(null)} accessibilityRole="button" style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}><Text style={styles.cancelText}>Cancel</Text></Pressable>
                  <Pressable onPress={() => onConfirm(pendingDestination)} accessibilityRole="button" style={({ pressed }) => [styles.confirmButton, pressed && styles.pressed]}><Text style={styles.confirmButtonText}>Confirm Move</Text></Pressable>
                </View>
              </View>
            ) : (
              <>
                {nextDepartment ? (
                  <Pressable onPress={() => setPendingDestination(nextDepartment)} accessibilityRole="button" style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
                    <Text style={styles.primaryArrow}>→</Text>
                    <View style={styles.primaryCopy}><Text style={styles.primaryLabel}>RECOMMENDED NEXT STEP</Text><Text style={styles.primaryText}>Send to {nextDepartment}</Text></View>
                    <Text style={styles.primaryChevron}>›</Text>
                  </Pressable>
                ) : (
                  <View style={styles.flowEnd}><Text style={styles.flowEndText}>END OF PRODUCTION FLOW</Text></View>
                )}

                <Pressable onPress={() => setExpanded((value) => !value)} accessibilityRole="button" accessibilityState={{ expanded }} style={({ pressed }) => [styles.differentButton, pressed && styles.pressed]}>
                  <Text style={styles.differentText}>Choose Different Department</Text><Text style={styles.expandIcon}>{expanded ? '−' : '+'}</Text>
                </Pressable>

                {expanded && <View style={styles.departmentList}>
                  {otherDepartments.map((destination) => (
                    <Pressable key={destination} onPress={() => setPendingDestination(destination)} accessibilityRole="button" style={({ pressed }) => [styles.departmentChoice, pressed && styles.pressed]}>
                      <Text style={styles.departmentChoiceText}>Move to {destination}</Text><Text style={styles.choiceChevron}>›</Text>
                    </Pressable>
                  ))}
                </View>}
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.62)' },
  sheet: { maxHeight: '88%', backgroundColor: colors.panel, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderBottomWidth: 0, borderColor: colors.border, overflow: 'hidden' },
  handle: { width: 42, height: 4, borderRadius: 2, backgroundColor: colors.subtle, alignSelf: 'center', marginTop: 10 },
  content: { padding: 20, paddingTop: 14, paddingBottom: 18 },
  headingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kicker: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.6, marginBottom: 5 },
  title: { color: colors.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.7 },
  close: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panelRaised, borderRadius: 24 },
  closeText: { color: colors.muted, fontSize: 29, lineHeight: 31 },
  vehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20, marginBottom: 18 },
  vehicleCopy: { flex: 1 },
  vehicleName: { color: colors.text, fontSize: 16, fontWeight: '900' },
  stock: { color: colors.muted, fontSize: 11, fontWeight: '700', marginTop: 4 },
  departmentPill: { maxWidth: '52%', backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 8 },
  departmentLabel: { color: colors.subtle, fontSize: 7, fontWeight: '900', letterSpacing: 0.9, marginBottom: 3 },
  departmentValue: { color: '#D6DADE', fontSize: 12, fontWeight: '800' },
  primaryButton: { minHeight: 82, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.accent, borderRadius: 15, paddingHorizontal: 16 },
  primaryArrow: { color: colors.background, fontSize: 27, fontWeight: '900', marginRight: 13 },
  primaryCopy: { flex: 1 },
  primaryLabel: { color: '#5B460C', fontSize: 8, fontWeight: '900', letterSpacing: 1.1, marginBottom: 4 },
  primaryText: { color: colors.background, fontSize: 18, fontWeight: '900' },
  primaryChevron: { color: colors.background, fontSize: 31 },
  flowEnd: { minHeight: 56, borderWidth: 1, borderColor: colors.border, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  flowEndText: { color: colors.subtle, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  differentButton: { minHeight: 58, flexDirection: 'row', alignItems: 'center', marginTop: 10, paddingHorizontal: 4 },
  differentText: { flex: 1, color: '#D6DADE', fontSize: 15, fontWeight: '800' },
  expandIcon: { color: colors.accent, fontSize: 24, fontWeight: '600' },
  departmentList: { gap: 8 },
  departmentChoice: { minHeight: 54, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border, borderRadius: 11, paddingHorizontal: 15 },
  departmentChoiceText: { flex: 1, color: '#D6DADE', fontSize: 14, fontWeight: '800' },
  choiceChevron: { color: colors.subtle, fontSize: 25 },
  confirmation: { backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: '#6E5718', borderRadius: 15, padding: 18 },
  confirmLabel: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.3, marginBottom: 8 },
  confirmText: { color: colors.text, fontSize: 20, lineHeight: 27, fontWeight: '900' },
  confirmActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelButton: { minHeight: 54, flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 12 },
  cancelText: { color: '#D6DADE', fontSize: 14, fontWeight: '800' },
  confirmButton: { minHeight: 54, flex: 1.35, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent, borderRadius: 12 },
  confirmButtonText: { color: colors.background, fontSize: 14, fontWeight: '900' },
  pressed: { opacity: 0.72 },
});
