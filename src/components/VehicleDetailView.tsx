import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { productionSequence } from '../data/departments';
import { Department, ProductionDepartmentName, Vehicle } from '../types';
import { colors } from '../theme/colors';
import { workflowColors } from '../theme/workflowColors';
import { SubletRequestSection } from './SubletRequestSection';

type Props = {
  department: Department | null;
  vehicle: Vehicle | null;
  onClose: () => void;
  onCompletePhase: (destination: ProductionDepartmentName) => void;
  onRequestRevision: () => void;
  onSendToSublet: () => void;
  onCloseProduction: () => void;
  onCompleteException: () => void;
};

export function VehicleDetailView({ department, vehicle, onClose, onCompletePhase, onRequestRevision, onSendToSublet, onCloseProduction, onCompleteException }: Props) {
  const insets = useSafeAreaInsets();
  if (!vehicle || !department || department.name === 'Revision Needed') return null;

  const currentIndex = productionSequence.indexOf(department.name);
  const nextDepartment = productionSequence[currentIndex + 1];
  const productionException = vehicle.activeException?.active ? vehicle.activeException : null;
  const departmentColor = workflowColors[department.name];

  const requestCompletion = () => {
    if (!nextDepartment) return;
    Alert.alert(
      'Complete Current Phase',
      `Send ${vehicle.make} ${vehicle.model} to ${nextDepartment}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => onCompletePhase(nextDepartment) },
      ],
    );
  };
  const requestCloseProduction = () => Alert.alert('Close Production', `Close production for ${vehicle.make} ${vehicle.model}?`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Confirm', onPress: onCloseProduction }]);
  const requestExceptionCompletion = () => productionException && onCompleteException();

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen" statusBarTranslucent={false} onRequestClose={onClose}>
      <SafeAreaView style={[styles.safe, { paddingTop: insets.top }]} edges={['bottom', 'left', 'right']}>
        <View style={styles.topBar}>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={`Back to ${department.name} Department`} accessibilityHint="Returns to the same position in the department queue" hitSlop={8} style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
            <Text style={styles.closeIcon}>‹</Text><Text style={styles.closeText}>Back to {department.name} Department</Text>
          </Pressable>
          <View style={styles.topTitleArea} pointerEvents="none"><Text style={styles.topTitle}>VEHICLE DETAIL</Text></View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78} style={[styles.departmentHeading, { color: departmentColor }]}>{department.name.toUpperCase()}</Text>
          <Text style={styles.eyebrow}>{vehicle.year} · {vehicle.color.toUpperCase()}</Text>
          <Text style={styles.title}>{vehicle.make}</Text>
          <Text style={styles.model}>{vehicle.model}</Text>

          <View style={[styles.currentStatus, { borderLeftColor: vehicle.statusColor }]}>
            <Text style={styles.label}>CURRENT STATUS</Text>
            <View style={styles.statusLine}><View style={[styles.statusDot, { backgroundColor: vehicle.statusColor }]} /><Text style={[styles.currentStatusText, { color: vehicle.statusColor }]}>{vehicle.status}</Text></View>
            <Text style={styles.stageTime}>{vehicle.timeInStage} {vehicle.department === 'Parts Hold' ? 'on parts hold' : 'in stage'}</Text>
          </View>

          <View style={styles.infoGrid}>
            <Info label="STOCK" value={vehicle.stockNumber} />
            <Info label="DEPARTMENT" value={department.name} />
            <Info label="LOCATION" value={vehicle.location} />
            <Info label="PRIORITY" value={vehicle.priority ? 'Yes' : 'Standard'} />
          </View>

          {productionException && <View style={styles.exceptionSummary}><Text style={styles.exceptionKicker}>PRODUCTION EXCEPTION</Text><InfoLine label="ORIGINATING DEPARTMENT" value={productionException.originDepartment} /><InfoLine label="REASON" value={productionException.reason} /><InfoLine label="CORRECTIVE TASK" value={productionException.correctiveTask} /></View>}

          <View style={styles.workflowHeader}>
            <Text style={styles.sectionTitle}>{productionException ? 'Corrective work' : 'Production action'}</Text>
            <Text style={styles.sectionHint}>{productionException ? `Returns automatically to ${productionException.originDepartment}.` : 'One direction. Complete the phase or request review.'}</Text>
          </View>

          {productionException ? <Pressable onPress={requestExceptionCompletion} accessibilityRole="button" style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}><View style={styles.primaryIcon}><Text style={styles.primaryIconText}>✓</Text></View><View style={styles.actionCopy}><Text style={styles.primaryTitle}>Complete Corrective Work</Text><Text style={styles.primarySubtitle}>Choose where this vehicle goes next</Text></View><Text style={styles.primaryChevron}>›</Text></Pressable> : nextDepartment ? (
            <Pressable onPress={requestCompletion} accessibilityRole="button" style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}>
              <View style={styles.primaryIcon}><Text style={styles.primaryIconText}>→</Text></View>
              <View style={styles.actionCopy}><Text style={styles.primaryTitle}>Complete Current Phase</Text><Text style={styles.primarySubtitle}>Send to {nextDepartment}</Text></View>
              <Text style={styles.primaryChevron}>›</Text>
            </Pressable>
          ) : (
            <Pressable onPress={requestCloseProduction} accessibilityRole="button" style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}><View style={styles.primaryIcon}><Text style={styles.primaryIconText}>✓</Text></View><View style={styles.actionCopy}><Text style={styles.primaryTitle}>Close Production</Text><Text style={styles.primarySubtitle}>Move to 30-day operational history</Text></View><Text style={styles.primaryChevron}>›</Text></Pressable>
          )}

          {!productionException && <Pressable onPress={onRequestRevision} accessibilityRole="button" style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressed]}>
            <View style={styles.secondaryIcon}><Text style={styles.secondaryIconText}>!</Text></View>
            <View style={styles.actionCopy}><Text style={styles.secondaryTitle}>Request Revision</Text><Text style={styles.secondarySubtitle}>Send an exception to manager review</Text></View>
            <Text style={styles.secondaryChevron}>›</Text>
          </Pressable>}
          {!productionException && <SubletRequestSection onPress={onSendToSublet} pending={Boolean(vehicle.activeSubletRequest)} />}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <View style={styles.info}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>;
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return <View style={styles.exceptionLine}><Text style={styles.exceptionLabel}>{label}</Text><Text style={styles.exceptionValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: { minHeight: 62, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border },
  close: { flex: 1.4, minHeight: 52, flexDirection: 'row', alignItems: 'center', paddingRight: 8 },
  closeIcon: { color: colors.accent, fontSize: 36, lineHeight: 38, marginRight: 5 },
  closeText: { flexShrink: 1, color: colors.text, fontSize: 13, fontWeight: '800' },
  topTitleArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topTitle: { color: colors.muted, textAlign: 'center', fontSize: 10, fontWeight: '900', letterSpacing: 1.8 },
  content: { padding: 20, paddingBottom: 44 },
  departmentHeading: { fontSize: 17, lineHeight: 22, fontWeight: '900', letterSpacing: 2.2, marginTop: 3, marginBottom: 13 },
  eyebrow: { color: colors.muted, fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 8 },
  title: { color: colors.text, fontSize: 35, fontWeight: '900', letterSpacing: -1 },
  model: { color: '#C9CED4', fontSize: 25, fontWeight: '700', marginTop: 1 },
  currentStatus: { backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border, borderLeftWidth: 6, borderRadius: 14, padding: 18, marginTop: 22 },
  label: { color: colors.subtle, fontSize: 9, fontWeight: '900', letterSpacing: 1.4 },
  statusLine: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  statusDot: { width: 9, height: 9, borderRadius: 5, marginRight: 9 },
  currentStatusText: { fontSize: 20, fontWeight: '900' },
  stageTime: { color: colors.muted, fontSize: 12, marginTop: 6, marginLeft: 18 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, borderRadius: 14, marginTop: 14, padding: 6 },
  info: { width: '50%', padding: 12 },
  infoLabel: { color: colors.subtle, fontSize: 9, fontWeight: '900', letterSpacing: 1.1, marginBottom: 5 },
  infoValue: { color: '#D6DADE', fontSize: 13, fontWeight: '700' },
  exceptionSummary: { marginTop: 14, padding: 16, backgroundColor: '#1D1A14', borderWidth: 1, borderColor: '#5B4820', borderLeftWidth: 5, borderLeftColor: '#D99A2B', borderRadius: 13 }, exceptionKicker: { color: '#E8B44F', fontSize: 9, fontWeight: '900', letterSpacing: 1.1, marginBottom: 10 }, exceptionLine: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 7 }, exceptionLabel: { width: 122, color: colors.subtle, fontSize: 8, lineHeight: 13, fontWeight: '900', letterSpacing: 0.7 }, exceptionValue: { flex: 1, color: '#D8C69F', fontSize: 12, lineHeight: 16, fontWeight: '800' },
  workflowHeader: { marginTop: 30, marginBottom: 13 },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '900' },
  sectionHint: { color: colors.muted, fontSize: 12, marginTop: 4 },
  primaryAction: { minHeight: 88, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, backgroundColor: colors.accent, borderRadius: 15 },
  primaryIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, marginRight: 13 },
  primaryIconText: { color: colors.accent, fontSize: 22, fontWeight: '900' },
  actionCopy: { flex: 1 },
  primaryTitle: { color: colors.background, fontSize: 17, fontWeight: '900' },
  primarySubtitle: { color: '#5B460C', fontSize: 12, fontWeight: '800', marginTop: 4 },
  primaryChevron: { color: colors.background, fontSize: 31 },
  secondaryAction: { minHeight: 72, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginTop: 12, backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border, borderRadius: 14 },
  secondaryIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#342E17', marginRight: 13 },
  secondaryIconText: { color: colors.accent, fontSize: 18, fontWeight: '900' },
  secondaryTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  secondarySubtitle: { color: colors.muted, fontSize: 11, fontWeight: '600', marginTop: 4 },
  secondaryChevron: { color: colors.subtle, fontSize: 27 },
  flowComplete: { padding: 18, backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border, borderRadius: 14 },
  flowCompleteText: { color: '#D6DADE', fontSize: 15, fontWeight: '800', marginTop: 7 },
  pressed: { opacity: 0.72 },
});
