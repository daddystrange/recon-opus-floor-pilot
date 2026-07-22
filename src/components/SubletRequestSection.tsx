import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

type Props = {
  onPress: () => void;
  pending?: boolean;
};

export function SubletRequestSection({ onPress, pending = false }: Props) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>External Vendor Work</Text>
      <Text style={styles.sectionDescription}>Requesting a Sublet removes this vehicle from normal production and sends the request for manager approval.</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={pending ? 'Sublet Request Pending' : 'Request Sublet'} accessibilityState={{ disabled: pending }} disabled={pending} onPress={onPress} style={({ pressed }) => [styles.button, pending && styles.disabled, pressed && styles.pressed]}>
        <View style={styles.icon}><Text style={styles.iconText}>↗</Text></View>
        <View style={styles.copy}><Text style={styles.title}>{pending ? 'Sublet Request Pending' : 'Request Sublet'}</Text><Text style={styles.subtitle}>{pending ? 'Awaiting Manager Approval' : 'Submit external work for manager approval'}</Text></View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 34, paddingTop: 25, paddingBottom: 8, borderTopWidth: 1, borderTopColor: colors.border },
  sectionTitle: { color: colors.text, fontSize: 19, fontWeight: '900' },
  sectionDescription: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 5, marginBottom: 14 },
  button: { minHeight: 68, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, backgroundColor: '#201A13', borderWidth: 1, borderColor: '#6A4B2B', borderRadius: 14 },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#332819', marginRight: 13 },
  iconText: { color: '#D99A50', fontSize: 19, fontWeight: '900' },
  copy: { flex: 1 },
  title: { color: colors.text, fontSize: 16, fontWeight: '900' },
  subtitle: { color: '#A98761', fontSize: 10, fontWeight: '700', marginTop: 4 },
  chevron: { color: '#C68A43', fontSize: 28, fontWeight: '700' },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.55 },
});
