import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

export function OfficeScreen({ onBackToLobby }: { onBackToLobby: () => void }) {
  return (
    <View style={styles.page}>
      <Pressable onPress={onBackToLobby} accessibilityRole="button" style={({ pressed }) => [styles.back, pressed && styles.pressed]}><Text style={styles.backIcon}>‹</Text><Text style={styles.backText}>Shop Lobby</Text></Pressable>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>MANAGEMENT OFFICE</Text>
        <Text style={styles.title}>The Office</Text>
        <Text style={styles.message}>Office workspace coming next</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  back: { minHeight: 52, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border },
  backIcon: { color: colors.accent, fontSize: 29, lineHeight: 31, marginRight: 6 },
  backText: { color: colors.text, fontSize: 13, fontWeight: '800' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  eyebrow: { color: '#6F93AD', fontSize: 9, fontWeight: '900', letterSpacing: 1.8 },
  title: { color: colors.text, fontSize: 36, fontWeight: '900', letterSpacing: -1, marginTop: 7 },
  message: { color: colors.muted, fontSize: 13, fontWeight: '700', marginTop: 10 },
  pressed: { opacity: 0.72 },
});
