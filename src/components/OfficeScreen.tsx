import { useEffect, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { Animated, Easing, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { workflowColors } from '../theme/workflowColors';
import { ProductionDepartmentName, Technician, UnassignedJob } from '../types';

const officeInteriorImage = require('../../assets/recon-opus-office-command-center-v2.png');

type OfficeView = 'landing' | 'queue' | 'assignment';

type Props = {
  jobs: UnassignedJob[];
  technicians: Technician[];
  startingDepartments: ProductionDepartmentName[];
  exceptionCount: number;
  onBackToLobby: () => void;
  onOpenExceptions: () => void;
  onAssign: (jobId: string, department: ProductionDepartmentName, technicianId: string) => void;
};

export function OfficeScreen({ jobs, technicians, startingDepartments, exceptionCount, onBackToLobby, onOpenExceptions, onAssign }: Props) {
  const [view, setView] = useState<OfficeView>('landing');
  const [selectedJob, setSelectedJob] = useState<UnassignedJob | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<ProductionDepartmentName | null>(null);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const successProgress = useRef(new Animated.Value(0)).current;
  const completionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (completionTimer.current) clearTimeout(completionTimer.current);
    successProgress.stopAnimation();
  }, [successProgress]);

  const openJob = (job: UnassignedJob) => {
    setSelectedJob(job);
    setSelectedDepartment(null);
    setSelectedTechnicianId(null);
    setView('assignment');
  };

  const chooseDepartment = (department: ProductionDepartmentName) => {
    setSelectedDepartment(department);
    setSelectedTechnicianId(null);
    void Haptics.selectionAsync();
  };

  const assign = () => {
    if (!selectedJob || !selectedDepartment || !selectedTechnicianId) return;
    const technician = technicians.find(({ id }) => id === selectedTechnicianId);
    if (!technician) return;
    setSuccessMessage(`${selectedJob.make} ${selectedJob.model} assigned`);
    successProgress.setValue(0);
    onAssign(selectedJob.id, selectedDepartment, selectedTechnicianId);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.sequence([
      Animated.timing(successProgress, { toValue: 1, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.delay(340),
      Animated.timing(successProgress, { toValue: 0, duration: 180, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
    ]).start();
    completionTimer.current = setTimeout(() => {
      setSuccessMessage(null);
      setSelectedJob(null);
      setView(jobs.length === 1 ? 'landing' : 'queue');
    }, 720);
  };

  const availableTechnicians = selectedDepartment
    ? technicians.filter(({ department }) => department === selectedDepartment)
    : [];
  const successScale = successProgress.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] });

  return (
    <View style={styles.page}>
      <Image source={officeInteriorImage} resizeMode="cover" style={styles.officeEnvironment} />
      <View pointerEvents="none" style={styles.environmentWash} />
      <View style={styles.header}>
        <Pressable onPress={view === 'landing' ? onBackToLobby : () => setView(view === 'assignment' ? 'queue' : 'landing')} accessibilityRole="button" style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
          <Text style={styles.backIcon}>‹</Text>
          <Text style={styles.backText}>{view === 'landing' ? 'Shop Lobby' : view === 'assignment' ? 'Assign Job' : 'The Office'}</Text>
        </Pressable>
      </View>

      {view === 'landing' && <OfficeLanding count={jobs.length} exceptionCount={exceptionCount} technicianCount={technicians.length} onOpen={() => setView('queue')} onOpenExceptions={onOpenExceptions} />}
      {view === 'queue' && <AssignmentQueue jobs={jobs} onOpenJob={openJob} />}
      {view === 'assignment' && selectedJob && (
        <AssignmentEditor
          job={selectedJob}
          departments={startingDepartments}
          technicians={availableTechnicians}
          selectedDepartment={selectedDepartment}
          selectedTechnicianId={selectedTechnicianId}
          onSelectDepartment={chooseDepartment}
          onSelectTechnician={setSelectedTechnicianId}
          onAssign={assign}
        />
      )}

      {successMessage && (
        <Animated.View pointerEvents="none" style={[styles.successOverlay, { opacity: successProgress, transform: [{ scale: successScale }] }]}>
          <View style={styles.successMark}><Text style={styles.successMarkText}>✓</Text></View>
          <Text style={styles.successTitle}>{successMessage}</Text>
          <Text style={styles.successHint}>Production plan released</Text>
        </Animated.View>
      )}
    </View>
  );
}

function OfficeLanding({ count, exceptionCount, technicianCount, onOpen, onOpenExceptions }: { count: number; exceptionCount: number; technicianCount: number; onOpen: () => void; onOpenExceptions: () => void }) {
  return (
    <View style={styles.landing}>
      <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={`Assign Job, ${count} waiting`} style={({ pressed }) => [styles.primaryAction, pressed && styles.primaryActionPressed]}>
        <View>
          <Text style={styles.primaryKicker}>WORK RELEASE</Text>
          <Text style={styles.primaryTitle}>Assign Job</Text>
          <Text style={styles.primaryStatus}>{count ? `${count} waiting for assignment` : 'Every vehicle is assigned'}</Text>
        </View>
        {count > 0 ? <View style={styles.liveBadge}><Text style={styles.liveBadgeText}>{count}</Text></View> : <View style={styles.allAssigned}><Text style={styles.allAssignedText}>✓</Text></View>}
      </Pressable>
      <Pressable onPress={onOpenExceptions} accessibilityRole="button" accessibilityLabel={`Exceptions, ${exceptionCount} waiting`} style={({ pressed }) => [styles.exceptionsAction, pressed && styles.primaryActionPressed]}>
        <View style={styles.exceptionsIcon}><Text style={styles.exceptionsIconText}>!</Text></View>
        <View style={styles.flex}><Text style={styles.exceptionsTitle}>Exceptions</Text><Text style={styles.exceptionsStatus}>{exceptionCount ? `${exceptionCount} waiting for review` : 'No exceptions waiting'}</Text></View>
        <View style={[styles.exceptionsBadge, exceptionCount === 0 && styles.exceptionsBadgeClear]}><Text style={[styles.exceptionsBadgeText, exceptionCount === 0 && styles.exceptionsBadgeTextClear]}>{exceptionCount}</Text></View>
        <Text style={styles.exceptionsChevron}>›</Text>
      </Pressable>
      <View style={styles.operationsSummary}>
        <Text style={styles.summaryTitle}>OPERATIONS NOW</Text>
        <View style={styles.summaryMetrics}>
          <SummaryMetric value={count} label="WAITING ASSIGNMENT" />
          <View style={styles.summaryDivider} />
          <SummaryMetric value={exceptionCount} label="EXCEPTIONS" />
          <View style={styles.summaryDivider} />
          <SummaryMetric value={technicianCount} label="TECHNICIANS" />
        </View>
      </View>
      {!count && <View style={styles.emptyConfirmation}><Text style={styles.emptyCheck}>✓</Text><View><Text style={styles.emptyTitle}>Every vehicle has been assigned.</Text><Text style={styles.emptyText}>No waiting jobs.</Text></View></View>}
    </View>
  );
}

function SummaryMetric({ value, label }: { value: number; label: string }) {
  return <View style={styles.summaryMetric}><Text style={styles.summaryValue}>{value}</Text><Text numberOfLines={2} style={styles.summaryLabel}>{label}</Text></View>;
}

function AssignmentQueue({ jobs, onOpenJob }: { jobs: UnassignedJob[]; onOpenJob: (job: UnassignedJob) => void }) {
  return (
    <View style={styles.flex}>
      <View style={styles.sectionHeader}><Text style={styles.sectionEyebrow}>ASSIGN JOB</Text><Text style={styles.sectionTitle}>Waiting for a plan</Text><Text style={styles.sectionSubtitle}>{jobs.length} unassigned {jobs.length === 1 ? 'vehicle' : 'vehicles'}</Text></View>
      {jobs.length ? (
        <ScrollView contentContainerStyle={styles.queue} showsVerticalScrollIndicator={false}>
          {jobs.map((job) => <JobCard key={job.id} job={job} onPress={() => onOpenJob(job)} />)}
        </ScrollView>
      ) : (
        <View style={styles.queueEmpty}><Text style={styles.queueEmptyMark}>✓</Text><Text style={styles.queueEmptyTitle}>Every vehicle has been assigned.</Text><Text style={styles.queueEmptyText}>No waiting jobs.</Text></View>
      )}
    </View>
  );
}

function JobCard({ job, onPress }: { job: UnassignedJob; onPress: () => void }) {
  const priorityColor = job.priority === 'Critical' ? '#F07167' : job.priority === 'Priority' ? '#E4A84D' : '#55788E';
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.jobCard, pressed && styles.cardPressed]}>
      <View style={styles.vehiclePhoto}><Text style={styles.vehicleGlyph}>◆</Text><Text style={styles.photoLabel}>INTAKE PHOTO</Text></View>
      <View style={styles.jobContent}>
        <View style={styles.jobTop}><View style={styles.flex}><Text style={styles.jobVehicle}>{job.year} {job.make}</Text><Text style={styles.jobModel}>{job.model}</Text></View><View style={[styles.priority, { borderColor: priorityColor }]}><View style={[styles.priorityDot, { backgroundColor: priorityColor }]} /><Text style={[styles.priorityText, { color: priorityColor }]}>{job.priority.toUpperCase()}</Text></View></View>
        <Text style={styles.jobIdentity}>{job.roNumber}{job.customerName ? `  ·  ${job.customerName}` : ''}</Text>
        <View style={styles.jobMeta}><Meta label="DAYS ON LOT" value={`${job.daysOnLot}`} /><Meta label="TARGET" value={job.estimatedCompletionDate} /><Meta label="REPAIR" value={job.repairType} /></View>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

function AssignmentEditor({ job, departments, technicians, selectedDepartment, selectedTechnicianId, onSelectDepartment, onSelectTechnician, onAssign }: {
  job: UnassignedJob;
  departments: ProductionDepartmentName[];
  technicians: Technician[];
  selectedDepartment: ProductionDepartmentName | null;
  selectedTechnicianId: string | null;
  onSelectDepartment: (department: ProductionDepartmentName) => void;
  onSelectTechnician: (id: string) => void;
  onAssign: () => void;
}) {
  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.editor} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionEyebrow}>ASSIGNMENT PLAN</Text>
      <Text style={styles.editorVehicle}>{job.year} {job.make} {job.model}</Text>
      <Text style={styles.editorRo}>{job.roNumber} · {job.repairType}</Text>

      <Text style={styles.fieldTitle}>Starting Department</Text>
      <View style={styles.departmentGrid}>
        {departments.map((department) => {
          const selected = department === selectedDepartment;
          const color = workflowColors[department];
          return <Pressable key={department} onPress={() => onSelectDepartment(department)} style={({ pressed }) => [styles.departmentChoice, selected && { borderColor: color, backgroundColor: `${color}16` }, pressed && styles.pressed]}><View style={[styles.departmentStripe, { backgroundColor: color }]} /><Text style={[styles.departmentText, selected && { color }]}>{department}</Text>{selected && <Text style={[styles.choiceCheck, { color }]}>✓</Text>}</Pressable>;
        })}
      </View>

      <Text style={styles.fieldTitle}>Technician</Text>
      {!selectedDepartment && <Text style={styles.selectionPrompt}>Choose a starting department first.</Text>}
      {selectedDepartment && technicians.map((technician) => <TechnicianCard key={technician.id} technician={technician} selected={technician.id === selectedTechnicianId} onPress={() => onSelectTechnician(technician.id)} />)}

      <Pressable disabled={!selectedDepartment || !selectedTechnicianId} onPress={onAssign} style={({ pressed }) => [styles.assignButton, (!selectedDepartment || !selectedTechnicianId) && styles.assignDisabled, pressed && styles.assignPressed]}><Text style={styles.assignButtonText}>Assign Job</Text><Text style={styles.assignArrow}>→</Text></Pressable>
    </ScrollView>
  );
}

function TechnicianCard({ technician, selected, onPress }: { technician: Technician; selected: boolean; onPress: () => void }) {
  const loadLevel = technician.activeJobs >= 6 ? 3 : technician.activeJobs >= 4 ? 2 : 1;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.technicianCard, selected && styles.technicianSelected, pressed && styles.cardPressed]}>
      <View style={styles.avatar}><Text style={styles.avatarText}>{technician.initials}</Text></View>
      <View style={styles.flex}><Text style={styles.technicianName}>{technician.name}</Text><Text style={styles.technicianRole}>{technician.role}</Text><Text style={styles.technicianJobs}>{technician.activeJobs} Active Jobs</Text></View>
      <View style={styles.loadMeter}>{[1, 2, 3].map((level) => <View key={level} style={[styles.loadBar, level <= loadLevel && styles.loadBarActive]} />)}</View>
      {selected && <Text style={styles.technicianCheck}>✓</Text>}
    </Pressable>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return <View style={styles.meta}><Text style={styles.metaLabel}>{label}</Text><Text style={styles.metaValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background }, flex: { flex: 1 },
  officeEnvironment: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  environmentWash: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(4, 7, 10, 0.38)' },
  header: { height: 46, backgroundColor: 'rgba(7, 11, 14, 0.66)', borderBottomWidth: 1, borderBottomColor: 'rgba(91, 118, 136, 0.28)' }, back: { position: 'absolute', left: 8, minHeight: 46, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', zIndex: 2 }, backIcon: { color: '#69A6CA', fontSize: 29, lineHeight: 31, marginRight: 4 }, backText: { color: colors.text, fontSize: 11, fontWeight: '800' },
  landing: { flex: 1, justifyContent: 'flex-start', paddingHorizontal: 22, paddingTop: 28, paddingBottom: 42 },
  primaryAction: { minHeight: 176, padding: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(12, 24, 32, 0.86)', borderWidth: 1, borderColor: 'rgba(83, 146, 183, 0.72)', borderRadius: 20, shadowColor: '#2A79A8', shadowOpacity: 0.22, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 8 }, primaryActionPressed: { opacity: 0.84, transform: [{ scale: 0.985 }] }, primaryKicker: { color: '#80AAC2', fontSize: 9, fontWeight: '900', letterSpacing: 1.6 }, primaryTitle: { color: colors.white, fontSize: 32, fontWeight: '900', letterSpacing: -0.8, marginTop: 8 }, primaryStatus: { color: '#9CB0BC', fontSize: 11, fontWeight: '700', marginTop: 8 }, liveBadge: { minWidth: 52, height: 52, paddingHorizontal: 12, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2D78A5' }, liveBadgeText: { color: colors.white, fontSize: 20, fontWeight: '900' }, allAssigned: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: '#153429' }, allAssignedText: { color: '#5DD29B', fontSize: 21, fontWeight: '900' },
  exceptionsAction: { minHeight: 76, marginTop: 14, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(31, 17, 20, 0.88)', borderWidth: 1, borderColor: 'rgba(130, 58, 68, 0.76)', borderRadius: 15 }, exceptionsIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#8A3039', marginRight: 12 }, exceptionsIconText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' }, exceptionsTitle: { color: '#F2D6D8', fontSize: 15, fontWeight: '900' }, exceptionsStatus: { color: '#BA858A', fontSize: 9, fontWeight: '700', marginTop: 4 }, exceptionsBadge: { minWidth: 29, height: 29, paddingHorizontal: 7, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#A53B45' }, exceptionsBadgeClear: { backgroundColor: '#283138' }, exceptionsBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' }, exceptionsBadgeTextClear: { color: '#84909A' }, exceptionsChevron: { color: '#BB626A', fontSize: 24, marginLeft: 8 },
  operationsSummary: { marginTop: 16, paddingHorizontal: 15, paddingTop: 12, paddingBottom: 13, backgroundColor: 'rgba(10, 16, 20, 0.80)', borderWidth: 1, borderColor: 'rgba(79, 101, 116, 0.43)', borderRadius: 13 }, summaryTitle: { color: '#7890A0', fontSize: 7.5, fontWeight: '900', letterSpacing: 1.25 }, summaryMetrics: { minHeight: 48, marginTop: 8, flexDirection: 'row', alignItems: 'center' }, summaryMetric: { flex: 1, alignItems: 'center' }, summaryValue: { color: '#DCE5EA', fontSize: 20, fontWeight: '900' }, summaryLabel: { color: '#80909A', fontSize: 6.5, lineHeight: 9, fontWeight: '800', letterSpacing: 0.55, textAlign: 'center', marginTop: 3 }, summaryDivider: { width: 1, height: 32, backgroundColor: 'rgba(105, 124, 137, 0.30)' },
  emptyConfirmation: { marginTop: 18, minHeight: 66, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: '#101A16', borderRadius: 13, borderWidth: 1, borderColor: '#234638' }, emptyCheck: { color: '#59C991', fontSize: 21, marginRight: 12 }, emptyTitle: { color: '#BDE9D3', fontSize: 12, fontWeight: '800' }, emptyText: { color: '#668978', fontSize: 10, marginTop: 3 },
  sectionHeader: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 13 }, sectionEyebrow: { color: '#6F93AD', fontSize: 9, fontWeight: '900', letterSpacing: 1.5 }, sectionTitle: { color: colors.text, fontSize: 27, fontWeight: '900', letterSpacing: -0.7, marginTop: 5 }, sectionSubtitle: { color: colors.muted, fontSize: 11, marginTop: 4 }, queue: { paddingHorizontal: 16, paddingBottom: 36, gap: 11 },
  jobCard: { minHeight: 130, flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: 'rgba(13, 18, 23, 0.90)', borderWidth: 1, borderColor: 'rgba(73, 88, 100, 0.62)', borderRadius: 15, overflow: 'hidden' }, vehiclePhoto: { width: 84, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(20, 31, 39, 0.92)', borderRadius: 10, borderWidth: 1, borderColor: '#293944' }, vehicleGlyph: { color: '#6C9AB5', fontSize: 29 }, photoLabel: { color: '#526B7A', fontSize: 5.5, fontWeight: '900', letterSpacing: 0.7, marginTop: 7 }, jobContent: { flex: 1, paddingLeft: 12 }, jobTop: { flexDirection: 'row', alignItems: 'flex-start' }, jobVehicle: { color: colors.text, fontSize: 11, fontWeight: '800' }, jobModel: { color: colors.white, fontSize: 15, fontWeight: '900', marginTop: 2 }, jobIdentity: { color: colors.muted, fontSize: 8.5, fontWeight: '700', marginTop: 6 }, priority: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, height: 20, borderRadius: 10, borderWidth: 1 }, priorityDot: { width: 4, height: 4, borderRadius: 2, marginRight: 4 }, priorityText: { fontSize: 5.5, fontWeight: '900', letterSpacing: 0.5 }, jobMeta: { flexDirection: 'row', gap: 12, marginTop: 11 }, meta: { minWidth: 45 }, metaLabel: { color: colors.subtle, fontSize: 5.5, fontWeight: '900', letterSpacing: 0.6 }, metaValue: { color: '#C2C9CF', fontSize: 8, fontWeight: '800', marginTop: 3 }, chevron: { color: '#60798A', fontSize: 24, marginLeft: 4 },
  queueEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 70 }, queueEmptyMark: { color: '#58C892', fontSize: 34, fontWeight: '900' }, queueEmptyTitle: { color: colors.text, fontSize: 17, fontWeight: '900', marginTop: 14 }, queueEmptyText: { color: colors.muted, fontSize: 11, marginTop: 6 },
  editor: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 42 }, editorVehicle: { color: colors.text, fontSize: 24, lineHeight: 29, fontWeight: '900', letterSpacing: -0.6, marginTop: 6 }, editorRo: { color: '#98A3AB', fontSize: 10, fontWeight: '700', marginTop: 5 }, fieldTitle: { color: '#D5DBE0', fontSize: 12, fontWeight: '900', marginTop: 24, marginBottom: 10 }, departmentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, departmentChoice: { width: '48.7%', minHeight: 54, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(13, 18, 23, 0.90)', borderWidth: 1, borderColor: 'rgba(73, 88, 100, 0.62)', borderRadius: 11, overflow: 'hidden' }, departmentStripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 }, departmentText: { flex: 1, color: '#B7BFC6', fontSize: 10, fontWeight: '800' }, choiceCheck: { fontSize: 13, fontWeight: '900' }, selectionPrompt: { color: '#88949D', fontSize: 11, fontWeight: '700', paddingVertical: 18 },
  technicianCard: { minHeight: 84, marginBottom: 9, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(13, 18, 23, 0.90)', borderWidth: 1, borderColor: 'rgba(73, 88, 100, 0.62)', borderRadius: 14 }, technicianSelected: { backgroundColor: 'rgba(12, 31, 43, 0.94)', borderColor: '#4D91B8' }, avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: '#21313C', borderWidth: 1, borderColor: '#425A68', marginRight: 12 }, avatarText: { color: '#A9C9DC', fontSize: 13, fontWeight: '900' }, technicianName: { color: colors.text, fontSize: 13, fontWeight: '900' }, technicianRole: { color: '#7391A3', fontSize: 8.5, fontWeight: '700', marginTop: 3 }, technicianJobs: { color: colors.muted, fontSize: 9, fontWeight: '800', marginTop: 5 }, loadMeter: { height: 25, flexDirection: 'row', alignItems: 'flex-end', gap: 3, marginHorizontal: 8 }, loadBar: { width: 4, height: 8, borderRadius: 2, backgroundColor: '#293139' }, loadBarActive: { backgroundColor: '#5D94B3' }, technicianCheck: { color: '#78BEE6', fontSize: 17, fontWeight: '900' },
  assignButton: { minHeight: 62, marginTop: 18, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#2D78A5', borderRadius: 14 }, assignDisabled: { backgroundColor: '#20262C', opacity: 0.58 }, assignPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] }, assignButtonText: { color: colors.white, fontSize: 15, fontWeight: '900' }, assignArrow: { color: colors.white, fontSize: 22, fontWeight: '700' },
  successOverlay: { position: 'absolute', left: 28, right: 28, top: '37%', minHeight: 146, alignItems: 'center', justifyContent: 'center', backgroundColor: '#10251C', borderWidth: 1, borderColor: '#3C8D67', borderRadius: 18, zIndex: 50, elevation: 20, shadowColor: '#4AC48A', shadowOpacity: 0.24, shadowRadius: 22 }, successMark: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1D5A3C' }, successMarkText: { color: '#8AE6B8', fontSize: 21, fontWeight: '900' }, successTitle: { color: '#D8F5E6', fontSize: 14, fontWeight: '900', marginTop: 12 }, successHint: { color: '#6AA887', fontSize: 9, fontWeight: '800', marginTop: 5 },
  pressed: { opacity: 0.7 }, cardPressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
});
