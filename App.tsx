import { useCallback, useEffect, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { Alert, Pressable, StatusBar, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { DepartmentPage } from './src/components/DepartmentPage';
import { VehicleDetailView } from './src/components/VehicleDetailView';
import { VehicleMoveSheet } from './src/components/VehicleMoveSheet';
import { RevisionQueuePage } from './src/components/RevisionQueuePage';
import { RevisionReviewScreen } from './src/components/RevisionReviewScreen';
import { ProductionFloorScreen } from './src/components/ProductionFloorScreen';
import { VehicleHistoryScreen } from './src/components/VehicleHistoryScreen';
import { EntranceScreen } from './src/components/EntranceScreen';
import { defaultStartingStatuses, departments as initialDepartments, getStatusColor, productionSequence } from './src/data/departments';
import { colors } from './src/theme/colors';
import { DepartmentName, ProductionDepartmentName, RevisionReason, Vehicle } from './src/types';
import { closeProduction, completeProductionException, partitionCompleted, recordPhaseMove, sendToRevision, startProductionException } from './src/domain/vehicleLifecycle';
import { FacilityMovement } from './src/domain/facilityGeometry';

export default function App() {
  const { width } = useWindowDimensions();
  const scrollPositions = useRef<Partial<Record<DepartmentName, number>>>({});
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [screen, setScreen] = useState<{ kind: 'entrance' } | { kind: 'floor' } | { kind: 'department'; name: ProductionDepartmentName } | { kind: 'revision' } | { kind: 'history' }>({ kind: 'entrance' });
  const [departments, setDepartments] = useState(initialDepartments);
  const [selected, setSelected] = useState<{ departmentIndex: number; vehicleId: string } | null>(null);
  const [moveSheetSelection, setMoveSheetSelection] = useState<{ departmentIndex: number; vehicleId: string; initialMode: 'actions' | 'revision' } | null>(null);
  const [exitingMove, setExitingMove] = useState<{ sourceIndex: number; vehicleId: string; destination: ProductionDepartmentName; direction: -1 | 1 } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [revisionReviewVehicleId, setRevisionReviewVehicleId] = useState<string | null>(null);
  const [completedVehicles, setCompletedVehicles] = useState<Vehicle[]>([]);
  const [archivedVehicles, setArchivedVehicles] = useState<Vehicle[]>([]);
  const [lastMovement, setLastMovement] = useState<FacilityMovement | null>(null);

  const selectedDepartment = selected ? departments[selected.departmentIndex] ?? null : null;
  const selectedVehicle = selectedDepartment?.vehicles.find(({ id }) => id === selected?.vehicleId) ?? null;
  const moveSheetDepartment = moveSheetSelection ? departments[moveSheetSelection.departmentIndex] ?? null : null;
  const moveSheetVehicle = moveSheetDepartment?.vehicles.find(({ id }) => id === moveSheetSelection?.vehicleId) ?? null;
  const revisionDepartmentIndex = departments.findIndex(({ name }) => name === 'Revision Needed');
  const revisionDepartment = departments[revisionDepartmentIndex] ?? null;
  const revisionReviewVehicle = revisionDepartment?.vehicles.find(({ id }) => id === revisionReviewVehicleId) ?? null;
  const currentQueue = screen.kind === 'department' ? departments.find(({ name }) => name === screen.name) ?? null : null;
  const totalWip = departments.reduce((total, department) => total + department.vehicles.filter(({ lifecycleState }) => lifecycleState === 'active_production' || lifecycleState === 'revision_needed').length, 0);

  useEffect(() => {
    const applyRetention = () => setCompletedVehicles((completed) => {
      const { retained, expired } = partitionCompleted(completed);
      if (expired.length) setArchivedVehicles((archived) => [...archived, ...expired.filter((vehicle) => !archived.some(({ id }) => id === vehicle.id))]);
      return retained;
    });
    applyRetention();
    const interval = setInterval(applyRetention, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const openDepartment = (name: ProductionDepartmentName) => setScreen({ kind: 'department', name });

  const openVehicle = (vehicle: Vehicle) => {
    const departmentIndex = departments.findIndex(({ vehicles }) => vehicles.some(({ id }) => id === vehicle.id));
    if (departmentIndex >= 0) setSelected({ departmentIndex, vehicleId: vehicle.id });
  };

  const showSuccess = (message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };

  const completeFacilityMovement = useCallback((movementId: number) => {
    setLastMovement((current) => current?.id === movementId ? null : current);
  }, []);

  const finishVehicleAction = useCallback(() => {
    setScreen({ kind: 'floor' });
  }, []);

  const commitVehicleMove = (sourceIndex: number, vehicleId: string, destination: ProductionDepartmentName) => {
    const sourceVehicle = departments[sourceIndex]?.vehicles.find(({ id }) => id === vehicleId);
    if (!sourceVehicle) return;
    if (sourceVehicle.department !== 'Revision Needed') setLastMovement({ id: Date.now(), from: sourceVehicle.department, to: destination });

    setDepartments((current) => {
      const currentVehicle = current[sourceIndex]?.vehicles.find(({ id }) => id === vehicleId);
      const destinationIndex = current.findIndex(({ name }) => name === destination);
      if (!currentVehicle || destinationIndex < 0) return current;

      const destinationStatus = defaultStartingStatuses[destination];
      const movedVehicle = recordPhaseMove(currentVehicle, destination, destinationStatus, getStatusColor(destinationStatus));

      return current.map((department, index) => {
        if (index === sourceIndex) return { ...department, vehicles: department.vehicles.filter(({ id }) => id !== vehicleId) };
        if (index === destinationIndex) return { ...department, vehicles: [...department.vehicles, movedVehicle] };
        return department;
      });
    });

    finishVehicleAction();
    showSuccess(`✓ ${sourceVehicle.make} ${sourceVehicle.model} sent to ${destination}`);
  };

  const completePhaseFromDetail = (destination: ProductionDepartmentName) => {
    if (!selected) return;
    if (selectedVehicle?.activeException?.active) { Alert.alert('Production Exception Active', 'Complete the current corrective work before starting another workflow action.'); return; }
    const direction: -1 | 1 = 1;
    setExitingMove({ sourceIndex: selected.departmentIndex, vehicleId: selected.vehicleId, destination, direction });
    setSelected(null);
    void Haptics.selectionAsync();
  };

  const requestRevisionFromDetail = () => {
    if (!selected) return;
    if (selectedVehicle?.activeException?.active) { Alert.alert('Production Exception Active', 'This vehicle already has active corrective work. Complete it before requesting another exception.'); return; }
    setMoveSheetSelection({ ...selected, initialMode: 'revision' });
    setSelected(null);
  };

  const openMoveSheet = (vehicle: Vehicle) => {
    if (vehicle.activeException?.active) { Alert.alert('Production Exception Active', 'Open the vehicle and complete its corrective work before moving it.'); return; }
    const departmentIndex = departments.findIndex(({ vehicles }) => vehicles.some(({ id }) => id === vehicle.id));
    if (departmentIndex < 0) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMoveSheetSelection({ departmentIndex, vehicleId: vehicle.id, initialMode: 'actions' });
  };

  const startAnimatedMove = (destination: ProductionDepartmentName) => {
    if (!moveSheetSelection) return;
    const sourceDepartment = departments[moveSheetSelection.departmentIndex]?.name;
    if (!sourceDepartment || sourceDepartment === 'Revision Needed') return;
    const expectedDestination = productionSequence[productionSequence.indexOf(sourceDepartment) + 1];
    if (destination !== expectedDestination) return;
    const destinationIndex = departments.findIndex(({ name }) => name === destination);
    if (destinationIndex < 0) return;
    setExitingMove({ sourceIndex: moveSheetSelection.departmentIndex, vehicleId: moveSheetSelection.vehicleId, destination, direction: 1 });
    setMoveSheetSelection(null);
    void Haptics.selectionAsync();
  };

  const createRevisionRequest = (reason: RevisionReason, notes: string) => {
    if (!moveSheetSelection || !moveSheetVehicle || !moveSheetDepartment) return;
    if (moveSheetDepartment.name === 'Revision Needed') return;
    if (moveSheetVehicle.activeException?.active) { setMoveSheetSelection(null); Alert.alert('Production Exception Active', 'Only one production exception may be active for a vehicle.'); return; }
    const sourceIndex = moveSheetSelection.departmentIndex;
    const vehicleId = moveSheetVehicle.id;
    const requestedAt = Date.now();
    setLastMovement({ id: requestedAt, from: moveSheetDepartment.name as ProductionDepartmentName, to: 'revision' });
    setDepartments((current) => current.map((department, index) => {
      if (index === sourceIndex) return { ...department, vehicles: department.vehicles.filter(({ id }) => id !== vehicleId) };
      if (department.name === 'Revision Needed') return { ...department, vehicles: [...department.vehicles, sendToRevision(moveSheetVehicle, moveSheetDepartment.name as ProductionDepartmentName, reason, notes, requestedAt)] };
      return department;
    }));
    setMoveSheetSelection(null);
    finishVehicleAction();
    showSuccess('Revision requested — vehicle sent to Production Exceptions');
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const resolveRevision = (destination: ProductionDepartmentName, status: string, resolutionNote: string) => {
    const revision = revisionReviewVehicle?.activeRevision;
    if (!revisionReviewVehicle || !revision || revisionDepartmentIndex < 0) return;
    const vehicle = revisionReviewVehicle;
    if (vehicle.activeException?.active) { Alert.alert('Production Exception Active', 'Resolve the current exception before assigning another one.'); return; }
    const createdAt = Date.now();
    setLastMovement({ id: createdAt, from: 'revision', to: destination });
    setDepartments((current) => current.map((department) => {
      if (department.name === 'Revision Needed') return { ...department, vehicles: department.vehicles.filter(({ id }) => id !== vehicle.id) };
      if (department.name === destination) return { ...department, vehicles: [...department.vehicles, {
        ...startProductionException(vehicle, destination, status, getStatusColor(status), resolutionNote, createdAt),
        revisionHistory: [...(vehicle.revisionHistory ?? []), {
          originalDepartment: revision.originalDepartment,
          reason: revision.reason,
          notes: revision.notes,
          requestedAt: revision.requestedAt,
          destination,
          destinationStatus: status,
          resolutionNote,
          resolvedAt: createdAt,
        }],
      }] };
      return department;
    }));
    setRevisionReviewVehicleId(null);
    finishVehicleAction();
    showSuccess(`${vehicle.make} ${vehicle.model} assigned to ${destination} for corrective work`);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const completeExceptionFromDetail = () => {
    const productionException = selectedVehicle?.activeException;
    if (!selected || !selectedVehicle || !productionException?.active) return;
    const sourceIndex = selected.departmentIndex;
    const destinationIndex = departments.findIndex(({ name }) => name === productionException.originDepartment);
    if (destinationIndex < 0) return;
    const completedAt = Date.now();
    const returnedVehicle = completeProductionException(selectedVehicle, 'Floor Pilot Technician', completedAt);
    setLastMovement({ id: completedAt, from: productionException.receivingDepartment, to: productionException.originDepartment });
    setDepartments((current) => current.map((department, index) => {
      if (sourceIndex === destinationIndex && index === sourceIndex) return { ...department, vehicles: department.vehicles.map((vehicle) => vehicle.id === selectedVehicle.id ? returnedVehicle : vehicle) };
      if (index === sourceIndex) return { ...department, vehicles: department.vehicles.filter(({ id }) => id !== selectedVehicle.id) };
      if (index === destinationIndex) return { ...department, vehicles: [...department.vehicles, returnedVehicle] };
      return department;
    }));
    setSelected(null);
    finishVehicleAction();
    showSuccess(`✓ ${selectedVehicle.make} ${selectedVehicle.model} returned to ${productionException.originDepartment}`);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const completeAnimatedMove = () => {
    if (!exitingMove) return;
    commitVehicleMove(exitingMove.sourceIndex, exitingMove.vehicleId, exitingMove.destination);
    setExitingMove(null);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const closeSelectedProduction = () => {
    if (!selected || !selectedVehicle) return;
    const sourceIndex = selected.departmentIndex;
    const closedVehicle = closeProduction(selectedVehicle);
    setLastMovement({ id: Date.now(), from: 'Delivery', to: 'exit' });
    setDepartments((current) => current.map((department, index) => index === sourceIndex ? { ...department, vehicles: department.vehicles.filter(({ id }) => id !== selectedVehicle.id) } : department));
    setCompletedVehicles((completed) => [...completed, closedVehicle]);
    setSelected(null);
    finishVehicleAction();
    showSuccess(`✓ ${selectedVehicle.make} ${selectedVehicle.model} production closed`);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <SafeAreaProvider>
      {screen.kind === 'entrance' ? (
        <EntranceScreen onReplaceWithProductionFloor={() => setScreen({ kind: 'floor' })} />
      ) : (
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
          <StatusBar barStyle="light-content" backgroundColor={colors.background} />
          <View style={styles.brandBar}>
            <View style={styles.brandMark}><View style={styles.markLine} /><View style={[styles.markLine, styles.markLineShort]} /><View style={styles.markLine} /></View>
            <View><Text style={styles.brand}>RECON OPUS</Text><Text style={styles.brandSub}>FLOOR PILOT</Text></View>
            <View style={styles.live}><View style={styles.liveDot} /><Text style={styles.liveText}>LOCAL</Text></View>
          </View>
          {screen.kind !== 'floor' && <View style={styles.globalNav}>
            <Pressable onPress={() => setScreen({ kind: 'revision' })} accessibilityRole="tab" accessibilityState={{ selected: screen.kind === 'revision' }} style={[styles.globalNavItem, screen.kind === 'revision' && styles.globalNavItemActive]}><Text style={[styles.globalNavText, screen.kind === 'revision' && styles.globalNavTextActive]}>Production Exceptions</Text><View style={styles.revisionBadge}><Text style={styles.revisionBadgeText}>{revisionDepartment?.vehicles.length ?? 0}</Text></View></Pressable>
          </View>}
          <View style={styles.screen}>
          {screen.kind === 'floor' && <ProductionFloorScreen departments={departments} totalWip={totalWip} revisionCount={revisionDepartment?.vehicles.length ?? 0} movement={lastMovement} onMovementComplete={completeFacilityMovement} onOpenDepartment={openDepartment} onOpenRevisions={() => setScreen({ kind: 'revision' })} onOpenHistory={() => setScreen({ kind: 'history' })} />}
          {screen.kind === 'revision' && revisionDepartment && <RevisionQueuePage department={revisionDepartment} width={width} scrollOffset={scrollPositions.current['Revision Needed'] ?? 0} onScrollOffsetChange={(offset) => { scrollPositions.current['Revision Needed'] = offset; }} onVehiclePress={(vehicle) => setRevisionReviewVehicleId(vehicle.id)} onBackToFloor={() => setScreen({ kind: 'floor' })} />}
          {screen.kind === 'department' && currentQueue && <DepartmentPage
            department={currentQueue}
            width={width}
            scrollOffset={scrollPositions.current[currentQueue.name] ?? 0}
            liftedVehicleId={moveSheetSelection?.departmentIndex === departments.findIndex(({ name }) => name === currentQueue.name) ? moveSheetSelection.vehicleId : undefined}
            exitingVehicleId={exitingMove?.sourceIndex === departments.findIndex(({ name }) => name === currentQueue.name) ? exitingMove.vehicleId : undefined}
            exitDirection={exitingMove?.direction}
            onScrollOffsetChange={(offset) => { scrollPositions.current[currentQueue.name] = offset; }}
            onVehiclePress={openVehicle}
            onVehicleLongPress={openMoveSheet}
            onVehicleExitComplete={completeAnimatedMove}
            onBackToFloor={() => setScreen({ kind: 'floor' })}
          />}
          {screen.kind === 'history' && <VehicleHistoryScreen completed={completedVehicles} archived={archivedVehicles} onBack={() => setScreen({ kind: 'floor' })} />}
          </View>
          <VehicleDetailView
          department={selectedDepartment}
          vehicle={selectedVehicle}
          onClose={() => setSelected(null)}
          onCompletePhase={completePhaseFromDetail}
          onRequestRevision={requestRevisionFromDetail}
          onCloseProduction={closeSelectedProduction}
          onCompleteException={completeExceptionFromDetail}
        />
        <VehicleMoveSheet
          visible={Boolean(moveSheetSelection)}
          initialMode={moveSheetSelection?.initialMode ?? 'actions'}
          vehicle={moveSheetVehicle}
          currentDepartment={moveSheetDepartment?.name === 'Revision Needed' ? null : moveSheetDepartment?.name ?? null}
          onClose={() => setMoveSheetSelection(null)}
          onConfirmNext={startAnimatedMove}
          onRevisionRequest={createRevisionRequest}
        />
        <RevisionReviewScreen
          vehicle={revisionReviewVehicle}
          productionDepartments={departments.filter(({ name }) => name !== 'Revision Needed')}
          onClose={() => setRevisionReviewVehicleId(null)}
          onConfirm={resolveRevision}
        />
          {toast && <View accessibilityRole="alert" style={styles.toast}><View style={styles.toastDot} /><Text style={styles.toastText}>{toast}</Text></View>}
        </SafeAreaView>
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  brandBar: { height: 62, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border },
  brandMark: { width: 29, height: 29, borderRadius: 7, backgroundColor: colors.accent, justifyContent: 'center', paddingHorizontal: 6, gap: 3, marginRight: 10 },
  markLine: { height: 2, backgroundColor: colors.background, borderRadius: 1 },
  markLineShort: { width: 11 },
  brand: { color: colors.text, fontSize: 13, fontWeight: '900', letterSpacing: 1.6 },
  brandSub: { color: colors.muted, fontSize: 8, fontWeight: '700', letterSpacing: 2.1, marginTop: 2 },
  live: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', backgroundColor: '#10271D', borderRadius: 12, paddingHorizontal: 9, paddingVertical: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2DD47A', marginRight: 6 },
  liveText: { color: '#68E49A', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  globalNav: { height: 54, flexDirection: 'row', paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  globalNavItem: { flex: 1, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  globalNavItemActive: { borderBottomColor: colors.accent },
  globalNavText: { color: colors.subtle, fontSize: 12, fontWeight: '800' },
  globalNavTextActive: { color: colors.text },
  revisionBadge: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F97316' },
  revisionBadgeText: { color: colors.background, fontSize: 9, fontWeight: '900' },
  screen: { flex: 1 },
  toast: { position: 'absolute', left: 20, right: 20, bottom: 22, minHeight: 54, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: '#17241D', borderWidth: 1, borderColor: '#315E43', borderRadius: 13 },
  toastDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2DD47A', marginRight: 11 },
  toastText: { flex: 1, color: '#B8F0CC', fontSize: 14, fontWeight: '800' },
});
