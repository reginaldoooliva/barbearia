import { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/services/api';
import { colors, fonts, spacing, radii } from '../../src/theme/theme';

export default function Payment() {
  const { agendamentoId } = useLocalSearchParams<{ agendamentoId: string }>();
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    async function criarCobranca() {
      try {
        const { data } = await api.post(`/payments/${agendamentoId}`);
        setQrCodeBase64(data.qrCodeBase64);
      } catch {
        setErro('Não foi possível gerar o pagamento. A reserva pode ter expirado.');
      }
    }
    criarCobranca();
  }, [agendamentoId]);

  // Em produção: dar polling em GET /appointments/meus (ou um endpoint de
  // status) até o status virar CONFIRMADO, refletido pelo webhook do
  // Mercado Pago — nunca confiar só na resposta local desta tela.

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name="qr-code-outline" size={26} color={colors.primary} />
      </View>
      <Text style={styles.titulo}>Pagamento via Pix</Text>

      {erro ? (
        <View style={styles.erroBox}>
          <Ionicons name="alert-circle-outline" size={20} color={colors.danger} />
          <Text style={styles.erro}>{erro}</Text>
        </View>
      ) : null}

      {!qrCodeBase64 && !erro && <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />}

      {qrCodeBase64 && (
        <View style={styles.qrCard}>
          <Image source={{ uri: `data:image/png;base64,${qrCodeBase64}` }} style={styles.qrCode} />
        </View>
      )}

      <View style={styles.avisoBox}>
        <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
        <Text style={styles.aviso}>
          Você tem alguns minutos para pagar antes que o horário seja liberado novamente.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, alignItems: 'center', gap: spacing.sm },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  titulo: { fontFamily: fonts.display, fontSize: 28, color: colors.textPrimary },
  qrCard: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  qrCode: { width: 220, height: 220 },
  avisoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  aviso: { fontFamily: fonts.bodyRegular, color: colors.textSecondary, textAlign: 'center', flexShrink: 1 },
  erroBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginTop: spacing.md,
  },
  erro: { color: colors.danger, fontFamily: fonts.bodyRegular, flexShrink: 1 },
});
