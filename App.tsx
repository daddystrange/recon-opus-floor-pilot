import { useCallback, useEffect, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { Alert, Animated, Easing, Pressable, StatusBar, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { DepartmentPage } from './src/components/DepartmentPage';
import { VehicleDetailView } from './src/components/VehicleDetailView';
import { VehicleMoveSheet } from './src/components/VehicleMoveSheet';
import { RevisionQueuePage } from './src/components/RevisionQueuePage';
import { RevisionReviewScreen } from './src/components/RevisionReviewScreen';
import { ProductionFloorScreen } from './src/components/ProductionFloorScreen';
import { VehicleHistoryScreen } from './src/components/VehicleHistoryScreen';
import { EntranceScreen } from './src/components/EntranceScreen';
import { ExceptionCompletionSheet } from './src/components/ExceptionCompletionSheet';
import { SubletCreationSheet } from './src/components/SubletCreationSheet';
import { SubletsQueueScreen } from './src/components/SubletsQueueScreen';
import { SubletReturnSheet } from './src/components/SubletReturnSheet';
import { SubletApprovalReviewScreen } from './src/components/SubletApprovalReviewScreen';
import { SubletDenialRoutingSheet } from './src/components/SubletDenialRoutingSheet';
import { defaultStartingStatuses, departments as initialDepartments, getStatusColor, productionSequence } from './src/data/departments';
import { initialSublets } from './src/data/sublets';
import { colors } from './src/theme/colors';
import { DepartmentName, ProductionDepartmentName, RevisionReason, SubletCategory, SubletQueueItem, Vehicle, VehicleSublet } from './src/types';
import { approveSubletRequest, closeProduction, completeProductionException, denySubletRequest, partitionCompleted, recommendedExceptionDestination, recordPhaseMove, requestSubletApproval, returnSubletToProduction, routeDeniedSubletRequest, sendToRevision, startProductionException } from './src/domain/vehicleLifecycle';
import { FacilityMovement } from './src/domain/facilityGeometry';

const FLOOR_FADE_IN_MS = 650;
const WHITE_LIGHT_FADE_OUT_MS = 650;
const FIRST_TRACER_DELAY_MS = 2000;

export default function App() {
  const { width } = useWindowDimensions();
  const scrollPositions = useRef<Partial<Record<DepartmentName, number>>>({});
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const floorRevealOpacity = useRef(new Animated.Value(1)).current;
  const whiteTransitionOpacity = useRef(new Animated.Value(0)).current;
  const [screen, setScreen] = useState<{ kind: 'entrance' } | { kind: 'floor' } | { kind: 'department'; name: ProductionDepartmentName } | { kind: 'revision' } | { kind: 'sublets' } | { kind: 'history' }>({ kind: 'entrance' });
  const [floorMotionEnabled, setFloorMotionEnabled] = useState(false);
  const [departments, setDepartments] = useState(initialDepartments);
  const [selected, setSelected] = useState<{ departmentIndex: number; vehicleId: string } | null>(null);
  const [moveSheetSelection, setMoveSheetSelection] = useState<{ departmentIndex: number; vehicleId: string; initialMode: 'actions' | 'revision' } | null>(null);
  const [exitingMove, setExitingMove] = useState<{ sourceIndex: number; vehicleId: string; destination: ProductionDepartmentName; direction: -1 | 1 } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [revisionReviewVehicleId, setRevisionReviewVehicleId] = useState<string | null>(null);
  const [exceptionCompletionSelection, setExceptionCompletionSelection] = useState<{ departmentIndex: number; vehicleId: string } | null>(null);
  const [subletCreationSelection, setSubletCreationSelection] = useState<{ departmentIndex: number; vehicleId: string } | null>(null);
  const [sublets, setSublets] = useState<SubletQueueItem[]>(initialSublets);
  const [subletHistory, setSubletHistory] = useState<VehicleSublet[]>([]);
  const [subletReturnId, setSubletReturnId] = useState<string | null>(null);
  const [subletDenialRoutingVehicleId, setSubletDenialRoutingVehicleId] = useState<string | null>(null);
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
  const subletDenialRoutingVehicle = revisionDepartment?.vehicles.find(({ id }) => id === subletDenialRoutingVehicleId) ?? null;
  const exceptionCompletionDepartment = exceptionCompletionSelection ? departments[exceptionCompletionSelection.departmentIndex] ?? null : null;
  const exceptionCompletionVehicle = exceptionCompletionDepartment?.vehicles.find(({ id }) => id === exceptionCompletionSelection?.vehicleId) ?? null;
  const exceptionCompletionCurrentDepartment = exceptionCompletionDepartment?.name === 'Revision Needed' ? null : exceptionCompletionDepartment?.name ?? null;
  const exceptionCompletionRecommendation = exceptionCompletionVehicle && exceptionCompletionCurrentDepartment
    ? recommendedExceptionDestination(exceptionCompletionVehicle, exceptionCompletionCurrentDepartment, productionSequence)
    : null;
  const subletCreationDepartment = subletCreationSelection ? departments[subletCreationSelection.departmentIndex] ?? null : null;
  const subletCreationVehicle = subletCreationDepartment?.vehicles.find(({ id }) => id === subletCreationSelection?.vehicleId) ?? null;
  const subletReturnItem = sublets.find(({ sublet }) => sublet.id === subletReturnId) ?? null;
  const previousSubletDepartment = subletReturnItem?.sublet.productionLocationBeforeSublet;
  const previousSubletIndex = previousSubletDepartment ? productionSequence.indexOf(previousSubletDepartment) : -1;
  const subletRecommendedDestination = (previousSubletIndex >= 0 ? productionSequence[previousSubletIndex + 1] : undefined) ?? previousSubletDepartment ?? 'Arrival & Inspection';
  const deniedPreviousDepartment = subletDenialRoutingVehicle?.activeSubletRequest?.previousProductionLocation;
  const deniedPreviousIndex = deniedPreviousDepartment ? productionSequence.indexOf(deniedPreviousDepartment) : -1;
  const deniedRecommendedDestination = (deniedPreviousIndex >= 0 ? productionSequence[deniedPreviousIndex + 1] : undefined) ?? deniedPreviousDepartment ?? 'Arrival & Inspection';
  const currentQueue = screen.kind === 'department' ? departments.find(({ name }) => name === screen.name) ?? null : null;
  const productionFloorWip = departments.filter(({ name }) => name !== 'Revision Needed').reduce((total, department) => total + department.vehicles.length, 0);
  const revisionWip = revisionDepartment?.vehicles.length ?? 0;
  const totalShopWip = productionFloorWip + revisionWip + sublets.length;
  // Retained for a future management dashboard; technician views do not render this aggregate.
  void totalShopWip;

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

  useEffect(() => () => {
    if (startupTimer.current) clearTimeout(startupTimer.current);
    floorRevealOpacity.stopAnimation();
    whiteTransitionOpacity.stopAnimation();
  }, [floorRevealOpacity, whiteTransitionOpacity]);

  const enterProductionFloor = useCallback(() => {
    floorRevealOpacity.setValue(0);
    whiteTransitionOpacity.setValue(1);
    setFloorMotionEnabled(false);
    setScreen({ kind: 'floor' });
    requestAnimationFrame(() => {
      Animated.parallel([
        Animated.timing(floorRevealOpacity, {
          toValue: 1,
          duration: FLOOR_FADE_IN_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(whiteTransitionOpacity, {
          toValue: 0,
          duration: WHITE_LIGHT_FADE_OUT_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (!finished) return;
        startupTimer.current = setTimeout(() => setFloorMotionEnabled(true), FIRST_TRACER_DELAY_MS);
      });
    });
  }, [floorRevealOpacity, whiteTransitionOpacity]);

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
    if (sourceVehicle.department !== 'Revision Needed' && sourceVehicle.department !== 'Sublets') setLastMovement({ id: Date.now(), from: sourceVehicle.department, to: destination });

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
    if (!selected || !selectedVehicle?.activeException?.active) return;
    setExceptionCompletionSelection({ ...selected });
    setSelected(null);
  };

  const cancelExceptionCompletion = () => {
    if (exceptionCompletionSelection && exceptionCompletionVehicle) setSelected({ ...exceptionCompletionSelection });
    setExceptionCompletionSelection(null);
  };

  const commitExceptionCompletion = (selection: ProductionDepartmentName | 'keep-here') => {
    const productionException = exceptionCompletionVehicle?.activeException;
    if (!exceptionCompletionSelection || !exceptionCompletionVehicle || !exceptionCompletionCurrentDepartment || !productionException?.active) return;
    const sourceIndex = exceptionCompletionSelection.departmentIndex;
    const destination = selection === 'keep-here' ? exceptionCompletionCurrentDepartment : selection;
    const destinationIndex = departments.findIndex(({ name }) => name === destination);
    if (destinationIndex < 0) return;
    const completedAt = Date.now();
    const keepHere = destination === exceptionCompletionCurrentDepartment;
    const destinationStatus = keepHere ? exceptionCompletionVehicle.status : defaultStartingStatuses[destination];
    const destinationStatusColor = keepHere ? exceptionCompletionVehicle.statusColor : getStatusColor(destinationStatus);
    const completedVehicle = completeProductionException(exceptionCompletionVehicle, 'Floor Pilot Technician', destination, destinationStatus, destinationStatusColor, completedAt);
    if (!keepHere) setLastMovement({ id: completedAt, from: exceptionCompletionCurrentDepartment, to: destination });
    setDepartments((current) => current.map((department, index) => {
      if (sourceIndex === destinationIndex && index === sourceIndex) return { ...department, vehicles: department.vehicles.map((vehicle) => vehicle.id === completedVehicle.id ? completedVehicle : vehicle) };
      if (index === sourceIndex) return { ...department, vehicles: department.vehicles.filter(({ id }) => id !== completedVehicle.id) };
      if (index === destinationIndex) return { ...department, vehicles: [...department.vehicles.filter(({ id }) => id !== completedVehicle.id), completedVehicle] };
      return department;
    }));
    setExceptionCompletionSelection(null);
    finishVehicleAction();
    showSuccess(keepHere
      ? `✓ Corrective work complete — vehicle remains in ${destination}`
      : `✓ Corrective work complete — vehicle sent to ${destination}`);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const completeAnimatedMove = () => {
    if (!exitingMove) return;
    commitVehicleMove(exitingMove.sourceIndex, exitingMove.vehicleId, exitingMove.destination);
    setExitingMove(null);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const requestSubletFromDetail = () => {
    if (!selected || !selectedVehicle) return;
    if (selectedVehicle.activeException?.active) { Alert.alert('Production Exception Active', 'Complete corrective work before requesting a Sublet.'); return; }
    if (selectedVehicle.activeSubletRequest) { Alert.alert('Sublet Request Pending', 'This vehicle already has an open Sublet request.'); return; }
    setSubletCreationSelection({ ...selected });
    setSelected(null);
  };

  const cancelSubletCreation = () => {
    if (subletCreationSelection && subletCreationVehicle) setSelected({ ...subletCreationSelection });
    setSubletCreationSelection(null);
  };

  const commitSubletCreation = (category: SubletCategory, vendor: string, description: string, expectedTiming: string, notes: string) => {
    if (!subletCreationSelection || !subletCreationVehicle || !subletCreationDepartment || subletCreationDepartment.name === 'Revision Needed') return;
    const sourceIndex = subletCreationSelection.departmentIndex;
    const createdAt = Date.now();
    const requestedVehicle = requestSubletApproval(subletCreationVehicle, category, description, vendor, expectedTiming, notes, 'Floor Pilot Technician', createdAt);
    setDepartments((current) => current.map((department, index) => {
      if (index === sourceIndex) return { ...department, vehicles: department.vehicles.filter(({ id }) => id !== requestedVehicle.id) };
      if (department.name === 'Revision Needed') return { ...department, vehicles: [...department.vehicles.filter(({ id }) => id !== requestedVehicle.id), requestedVehicle] };
      return department;
    }));
    setLastMovement({ id: createdAt, from: subletCreationDepartment.name, to: 'revision' });
    setSubletCreationSelection(null);
    finishVehicleAction();
    showSuccess('Sublet request sent for manager approval');
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const advanceSublet = (item: SubletQueueItem) => {
    setSubletReturnId(item.sublet.id);
  };

  const approveSublet = (category: SubletCategory, vendor: string, service: string, expectedTiming: string, notes: string) => {
    if (!revisionReviewVehicle?.activeSubletRequest || revisionDepartmentIndex < 0) return;
    const approvedAt = Date.now();
    const item = approveSubletRequest(revisionReviewVehicle, category, service, vendor, expectedTiming, notes, 'Floor Pilot Manager', approvedAt);
    setDepartments((current) => current.map((department) => department.name === 'Revision Needed' ? { ...department, vehicles: department.vehicles.filter(({ id }) => id !== item.vehicle.id) } : department));
    setSublets((current) => [...current.filter(({ vehicle }) => vehicle.id !== item.vehicle.id), item]);
    setLastMovement({ id: approvedAt, from: 'revision', to: 'sublets' });
    setRevisionReviewVehicleId(null);
    finishVehicleAction();
    showSuccess('Vehicle approved and sent to Sublet');
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const denySublet = (reason: string) => {
    if (!revisionReviewVehicle?.activeSubletRequest || revisionDepartmentIndex < 0) return;
    const deniedVehicle = denySubletRequest(revisionReviewVehicle, reason, 'Floor Pilot Manager');
    setDepartments((current) => current.map((department) => department.name === 'Revision Needed' ? { ...department, vehicles: department.vehicles.map((vehicle) => vehicle.id === deniedVehicle.id ? deniedVehicle : vehicle) } : department));
    setRevisionReviewVehicleId(null);
    setSubletDenialRoutingVehicleId(deniedVehicle.id);
  };

  const commitDeniedSubletRouting = (destination: ProductionDepartmentName) => {
    if (!subletDenialRoutingVehicle) return;
    const destinationStatus = defaultStartingStatuses[destination];
    const routedAt = Date.now();
    const routedVehicle = routeDeniedSubletRequest(subletDenialRoutingVehicle, destination, destinationStatus, getStatusColor(destinationStatus), routedAt);
    setDepartments((current) => current.map((department) => {
      if (department.name === 'Revision Needed') return { ...department, vehicles: department.vehicles.filter(({ id }) => id !== routedVehicle.id) };
      if (department.name === destination) return { ...department, vehicles: [...department.vehicles.filter(({ id }) => id !== routedVehicle.id), routedVehicle] };
      return department;
    }));
    setLastMovement({ id: routedAt, from: 'revision', to: destination });
    setSubletDenialRoutingVehicleId(null);
    finishVehicleAction();
    showSuccess(`✓ Sublet request denied — vehicle sent to ${destination}`);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const commitSubletReturn = (destination: ProductionDepartmentName) => {
    if (!subletReturnItem) return;
    const destinationIndex = departments.findIndex(({ name }) => name === destination);
    if (destinationIndex < 0) return;
    const returnedAt = Date.now();
    const destinationStatus = defaultStartingStatuses[destination];
    const { vehicle, completedSublet } = returnSubletToProduction(subletReturnItem, destination, destinationStatus, getStatusColor(destinationStatus), returnedAt);
    setSublets((current) => current.filter(({ sublet }) => sublet.id !== subletReturnItem.sublet.id));
    setSubletHistory((current) => [...current, completedSublet]);
    setDepartments((current) => current.map((department, index) => index === destinationIndex ? { ...department, vehicles: [...department.vehicles.filter(({ id }) => id !== vehicle.id), vehicle] } : department));
    setLastMovement({ id: returnedAt, from: 'sublets', to: destination });
    setSubletReturnId(null);
    finishVehicleAction();
    showSuccess(`✓ ${vehicle.make} ${vehicle.model} returned to ${destination}`);
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
    <SafeAreaProvider style={styles.provider}>
      {screen.kind === 'entrance' ? (
        <EntranceScreen onReplaceWithProductionFloor={enterProductionFloor} />
      ) : (
        <View style={styles.appRoute}>
        <Animated.View style={[styles.appScreen, { opacity: floorRevealOpacity }]}>
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
          <StatusBar barStyle="light-content" backgroundColor={colors.background} />
          {screen.kind !== 'floor' && screen.kind !== 'department' && !selected && <View style={styles.brandBar}>
            <View style={styles.brandMark}><View style={styles.markLine} /><View style={[styles.markLine, styles.markLineShort]} /><View style={styles.markLine} /></View>
            <Text style={styles.brand}>RECON OPUS</Text>
          </View>}
          {screen.kind !== 'floor' && screen.kind !== 'department' && <View style={styles.globalNav}>
            <Pressable onPress={() => setScreen({ kind: 'revision' })} accessibilityRole="tab" accessibilityState={{ selected: screen.kind === 'revision' }} style={[styles.globalNavItem, screen.kind === 'revision' && styles.globalNavItemActive]}><Text style={[styles.globalNavText, screen.kind === 'revision' && styles.globalNavTextActive]}>Production Exceptions</Text><View style={styles.revisionBadge}><Text style={styles.revisionBadgeText}>{revisionDepartment?.vehicles.length ?? 0}</Text></View></Pressable>
          </View>}
          <View style={styles.screen}>
          {screen.kind === 'floor' && <ProductionFloorScreen departments={departments} revisionCount={revisionWip} subletCount={sublets.length} motionEnabled={floorMotionEnabled} movement={lastMovement} onMovementComplete={completeFacilityMovement} onOpenDepartment={openDepartment} onOpenRevisions={() => setScreen({ kind: 'revision' })} onOpenSublets={() => setScreen({ kind: 'sublets' })} onOpenHistory={() => setScreen({ kind: 'history' })} />}
          {screen.kind === 'revision' && revisionDepartment && <RevisionQueuePage department={revisionDepartment} width={width} scrollOffset={scrollPositions.current['Revision Needed'] ?? 0} onScrollOffsetChange={(offset) => { scrollPositions.current['Revision Needed'] = offset; }} onVehiclePress={(vehicle) => vehicle.activeSubletRequest?.status === 'denied_pending_routing' ? setSubletDenialRoutingVehicleId(vehicle.id) : setRevisionReviewVehicleId(vehicle.id)} onBackToFloor={() => setScreen({ kind: 'floor' })} />}
          {screen.kind === 'sublets' && <SubletsQueueScreen items={sublets} onBackToFloor={() => setScreen({ kind: 'floor' })} onAdvanceStatus={advanceSublet} />}
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
          onSendToSublet={requestSubletFromDetail}
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
        <ExceptionCompletionSheet
          visible={Boolean(exceptionCompletionSelection)}
          vehicle={exceptionCompletionVehicle}
          currentDepartment={exceptionCompletionCurrentDepartment}
          originDepartment={exceptionCompletionVehicle?.activeException?.originDepartment ?? null}
          recommendedDestination={exceptionCompletionRecommendation}
          availableDestinations={productionSequence}
          onSelectDestination={commitExceptionCompletion}
          onKeepHere={() => commitExceptionCompletion('keep-here')}
          onCancel={cancelExceptionCompletion}
        />
        <SubletCreationSheet visible={Boolean(subletCreationSelection)} vehicle={subletCreationVehicle} onCancel={cancelSubletCreation} onSubmit={commitSubletCreation} />
        <SubletReturnSheet item={subletReturnItem} recommendedDestination={subletRecommendedDestination} destinations={productionSequence} onSelect={commitSubletReturn} onCancel={() => setSubletReturnId(null)} />
        <RevisionReviewScreen
          vehicle={revisionReviewVehicle}
          productionDepartments={departments.filter(({ name }) => name !== 'Revision Needed')}
          onClose={() => setRevisionReviewVehicleId(null)}
          onConfirm={resolveRevision}
        />
        <SubletApprovalReviewScreen vehicle={revisionReviewVehicle?.activeSubletRequest ? revisionReviewVehicle : null} onClose={() => setRevisionReviewVehicleId(null)} onApprove={approveSublet} onDeny={denySublet} />
        <SubletDenialRoutingSheet vehicle={subletDenialRoutingVehicle} recommended={deniedRecommendedDestination} destinations={productionSequence} onSelect={commitDeniedSubletRouting} onCancel={() => setSubletDenialRoutingVehicleId(null)} />
        </SafeAreaView>
        </Animated.View>
        <Animated.View pointerEvents="none" style={[styles.whiteTransition, { opacity: whiteTransitionOpacity }]} />
        {toast && <ToastOverlay message={toast} />}
        </View>
      )}
    </SafeAreaProvider>
  );
}

function ToastOverlay({ message }: { message: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="none" style={[styles.toastOverlay, { bottom: Math.max(22, insets.bottom + 12) }]}>
      <View accessibilityRole="alert" style={styles.toast}><View style={styles.toastDot} /><Text style={styles.toastText}>{message}</Text></View>
    </View>
  );
}

const styles = StyleSheet.create({
  provider: { flex: 1, backgroundColor: colors.background },
  appRoute: { flex: 1, position: 'relative', backgroundColor: colors.background },
  appScreen: { flex: 1 },
  whiteTransition: { ...StyleSheet.absoluteFillObject, zIndex: 100, backgroundColor: '#FFFFFF' },
  safe: { flex: 1, backgroundColor: colors.background },
  brandBar: { height: 44, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border },
  brandMark: { width: 24, height: 24, borderRadius: 6, backgroundColor: colors.accent, justifyContent: 'center', paddingHorizontal: 5, gap: 2, marginRight: 8 },
  markLine: { height: 1.5, backgroundColor: colors.background, borderRadius: 1 },
  markLineShort: { width: 9 },
  brand: { color: colors.text, fontSize: 12.5, fontWeight: '900', letterSpacing: 1.5 },
  globalNav: { height: 54, flexDirection: 'row', paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  globalNavItem: { flex: 1, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  globalNavItemActive: { borderBottomColor: colors.accent },
  globalNavText: { color: colors.subtle, fontSize: 12, fontWeight: '800' },
  globalNavTextActive: { color: colors.text },
  revisionBadge: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F97316' },
  revisionBadgeText: { color: colors.background, fontSize: 9, fontWeight: '900' },
  screen: { flex: 1 },
  toastOverlay: { position: 'absolute', left: 0, right: 0, zIndex: 10000, elevation: 1000 },
  toast: { minHeight: 54, marginHorizontal: 20, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: '#17241D', borderWidth: 1, borderColor: '#315E43', borderRadius: 13, zIndex: 10001, elevation: 1001 },
  toastDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2DD47A', marginRight: 11 },
  toastText: { flex: 1, color: '#B8F0CC', fontSize: 14, fontWeight: '800' },
});
