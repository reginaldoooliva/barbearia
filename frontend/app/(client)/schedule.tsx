import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/services/api';
import { colors, fonts, spacing, radii } from '../../src/theme/theme';

// Exemplo simplificado: horários fixos do dia. Na prática, viriam
// combinados com o horário de funcionamento do barbeiro no backend.
const HORARIOS = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];

const DATA = '2026-09-10';

export default function Schedule() {
  const { barbeiroId, servicoId } = useLocalSearchParams<{ barbeiroId: string; servicoId: string }>();
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  async function reservar(horario: string) {
    setErro('');
    setCarregando(true);
    try {
      const dataHoraInicio = `${DATA}T${horario}:00`;
      const { data } = await api.post('/appointments', {
        barbeiroId,
        servicoId,
        dataHoraInicio,
      });
      // Reserva criada com sucesso -> agora vai pra tela de pagamento
      router.push({ pathname: '/(client)/payment', params: { agendamentoId: data.id } });
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setErro('Esse horário acabou de ser reservado por outro cliente. Escolha outro.');
      } else {
        setErro('Não foi possível reservar. Tente novamente.');
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Escolha um horário</Text>
      <Text style={styles.subtitulo}>{DATA.split('-').reverse().join('/')}</Text>
      {erro ? <Text style={styles.erro}>{erro}</Text> : null}
      {carregando && <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.sm }} />}
      <View style={styles.grade}>
        {HORARIOS.map((h) => (
          <Pressable
            key={h}
            style={({ pressed }) => [styles.slot, pressed && styles.slotPressed]}
            onPress={() => reservar(h)}
            disabled={carregando}
          >
            <Ionicons name="time-outline" size={16} color={colors.primary} />
            <Text style={styles.slotTexto}>{h}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, gap: spacing.xs },
  titulo: { fontFamily: fonts.display, fontSize: 32, color: colors.textPrimary },
  subtitulo: { fontFamily: fonts.bodyRegular, fontSize: 14, color: colors.textSecondary, marginBottom: spacing.md },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    minWidth: '30%',
    justifyContent: 'center',
  },
  slotPressed: { borderColor: colors.primary, backgroundColor: colors.surfaceAlt },
  slotTexto: { fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.textPrimary },
  erro: { color: colors.danger, fontFamily: fonts.bodyRegular, marginBottom: spacing.xs },
});
