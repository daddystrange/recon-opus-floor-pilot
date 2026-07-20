import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { COMPLETED_RETENTION_MS } from '../domain/vehicleLifecycle';
import { Vehicle } from '../types';
import { colors } from '../theme/colors';

type Props = { completed: Vehicle[]; archived: Vehicle[]; onBack: () => void };
export function VehicleHistoryScreen({ completed, archived, onBack }: Props) {
  const [section, setSection] = useState<'completed' | 'archived'>('completed');
  const [query, setQuery] = useState('');
  const source = section === 'completed' ? completed : archived;
  const normalized = query.trim().toLowerCase();
  const vehicles = source.filter((vehicle) => !normalized || `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.stockNumber}`.toLowerCase().includes(normalized));
  return <View style={styles.page}>
    <Pressable onPress={onBack} accessibilityRole="button" style={styles.back}><Text style={styles.backIcon}>‹</Text><Text style={styles.backText}>Back to Production Floor</Text></Pressable>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>LIFECYCLE RECORDS</Text><Text style={styles.title}>Vehicle History</Text><Text style={styles.subtitle}>Completed work remains operational for 30 days before moving into the searchable archive.</Text>
      <View style={styles.segment}><Pressable onPress={() => setSection('completed')} style={[styles.segmentItem, section === 'completed' && styles.segmentActive]}><Text style={[styles.segmentText, section === 'completed' && styles.segmentTextActive]}>Completed {completed.length}</Text></Pressable><Pressable onPress={() => setSection('archived')} style={[styles.segmentItem, section === 'archived' && styles.segmentActive]}><Text style={[styles.segmentText, section === 'archived' && styles.segmentTextActive]}>Archived {archived.length}</Text></Pressable></View>
      <TextInput value={query} onChangeText={setQuery} placeholder="Search year, vehicle, or stock number" placeholderTextColor={colors.subtle} style={styles.search} />
      <View style={styles.list}>{vehicles.map((vehicle) => <View key={vehicle.id} style={styles.card}><Text style={styles.eyebrow}>{vehicle.year} · {vehicle.stockNumber}</Text><Text style={styles.vehicle}>{vehicle.make} {vehicle.model}</Text><View style={styles.meta}><Text style={styles.metaText}>{vehicle.department}</Text><Text style={styles.metaText}>{vehicle.history.length} history events</Text></View>{section === 'completed' && <Text style={styles.retention}>{daysRemaining(vehicle.completedAt)} days remaining in operational history</Text>}{section === 'archived' && <Text style={styles.retention}>Archived {formatDate(vehicle.archivedAt)}</Text>}</View>)}</View>
      {vehicles.length === 0 && <View style={styles.empty}><Text style={styles.emptyTitle}>{query ? 'No matching records' : `No ${section} vehicles`}</Text><Text style={styles.emptyText}>{section === 'completed' ? 'Closing production will add vehicles here.' : 'Records automatically archive after 30 days.'}</Text></View>}
    </ScrollView>
  </View>;
}
const daysRemaining = (completedAt?: number) => Math.max(0, Math.ceil(((completedAt ?? Date.now()) + COMPLETED_RETENTION_MS - Date.now()) / 86400000));
const formatDate = (value?: number) => value ? new Date(value).toLocaleDateString() : '—';
const styles = StyleSheet.create({ page: { flex: 1 }, back: { minHeight: 50, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border }, backIcon: { color: colors.accent, fontSize: 32, marginRight: 6 }, backText: { color: colors.text, fontSize: 13, fontWeight: '800' }, content: { padding: 20, paddingBottom: 44 }, kicker: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.7 }, title: { color: colors.text, fontSize: 34, fontWeight: '900', marginTop: 7 }, subtitle: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 7 }, segment: { height: 48, flexDirection: 'row', backgroundColor: colors.panel, borderRadius: 12, padding: 4, marginTop: 22 }, segmentItem: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 9 }, segmentActive: { backgroundColor: colors.panelRaised }, segmentText: { color: colors.subtle, fontSize: 12, fontWeight: '800' }, segmentTextActive: { color: colors.text }, search: { minHeight: 50, color: colors.text, backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, marginTop: 12 }, list: { gap: 10, marginTop: 14 }, card: { backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border, borderRadius: 13, padding: 16 }, eyebrow: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1 }, vehicle: { color: colors.text, fontSize: 18, fontWeight: '900', marginTop: 5 }, meta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }, metaText: { color: colors.muted, fontSize: 10, fontWeight: '700' }, retention: { color: colors.accent, fontSize: 10, fontWeight: '800', marginTop: 10 }, empty: { alignItems: 'center', paddingTop: 52 }, emptyTitle: { color: colors.text, fontSize: 17, fontWeight: '900' }, emptyText: { color: colors.muted, fontSize: 12, marginTop: 6 }, });
