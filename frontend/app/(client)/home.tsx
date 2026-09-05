import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { colors, fonts, spacing, radii } from '../../src/theme/theme';

export default function ClientHome() {
  const { logout } = useAuth();

  async function sair() {
    await logout();
    router.replace('/');
  }

  return (
    <View style={styles.flex}>
      <Image source={require('../../assets/images/hero-detail.jpg')} style={styles.banner} resizeMode="cover" />
      <View style={styles.overlay}>
        <Pressable onPress={sair} style={styles.sair} hitSlop={12}>
          <Ionicons name="log-out-outline" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.saudacao}>Bem-vindo de volta</Text>
        <Text style={styles.titulo}>O que vamos fazer hoje?</Text>
      </View>

      <View style={styles.container}>
        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => router.push('/(client)/choose-barber-service')}
        >
          <View style={styles.cardIcone}>
            <Ionicons name="calendar-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.cardTexto}>
            <Text style={styles.cardTitulo}>Agendar horário</Text>
            <Text style={styles.cardDescricao}>Escolha barbeiro, serviço e horário</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => router.push('/(client)/my-appointments')}
        >
          <View style={styles.cardIcone}>
            <Ionicons name="time-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.cardTexto}>
            <Text style={styles.cardTitulo}>Meus agendamentos</Text>
            <Text style={styles.cardDescricao}>Veja reservas e pagamentos</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  banner: { width: '100%', height: 180, position: 'absolute', top: 0 },
  overlay: {
    height: 180,
    backgroundColor: 'rgba(20,17,16,0.55)',
    justifyContent: 'flex-end',
    padding: spacing.lg,
  },
  sair: { position: 'absolute', top: spacing.lg, right: spacing.lg },
  saudacao: { fontFamily: fonts.bodySemibold, color: colors.primary, fontSize: 13, letterSpacing: 0.5 },
  titulo: { fontFamily: fonts.display, fontSize: 32, color: colors.textPrimary },
  container: { padding: spacing.lg, gap: spacing.md, marginTop: -spacing.lg },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  cardPressed: { opacity: 0.8 },
  cardIcone: {
    width: 48,
    height: 48,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTexto: { flex: 1 },
  cardTitulo: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.textPrimary },
  cardDescricao: { fontFamily: fonts.bodyRegular, fontSize: 13, color: colors.textSecondary, marginTop: 2 },
});
