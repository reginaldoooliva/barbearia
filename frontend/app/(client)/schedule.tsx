import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/services/api';
import { colors, fonts, spacing, radii } from '../../src/theme/theme';

// Exemplo simplificado: horários fixos candidatos por dia. Na prática, viriam
// combinados com o horário de funcionamento do barbeiro no backend.
const HORARIOS = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
const DIAS_A_MOSTRAR = 14;

function formatarISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

function paraHoraLocal(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function gerarProximosDias() {
  const dias: Date[] = [];
  for (let i = 0; i < DIAS_A_MOSTRAR; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dias.push(d);
  }
  return dias;
}

export default function Schedule() {
  const { barbeiroId, servicoId } = useLocalSearchParams<{ barbeiroId: string; servicoId: string }>();
  const dias = useMemo(() => gerarProximosDias(), []);
  const [dataSelecionada, setDataSelecionada] = useState(formatarISO(dias[0]));
  const [ocupados, setOcupados] = useState<string[]>([]);
  const [carregandoOcupados, setCarregandoOcupados] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;
    setCarregandoOcupados(true);
    api
      .get('/appointments/disponibilidade', { params: { barbeiroId, data: dataSelecionada } })
      .then(({ data }) => {
        if (!ativo) return;
        setOcupados(data.map((a: { dataHoraInicio: string }) => paraHoraLocal(a.dataHoraInicio)));
      })
      .catch(() => {})
      .finally(() => {
        if (ativo) setCarregandoOcupados(false);
      });
    return () => {
      ativo = false;
    };
  }, [dataSelecionada, barbeiroId]);

  async function reservar(horario: string) {
    setErro('');
    setCarregando(true);
    try {
      const dataHoraInicio = `${dataSelecionada}T${horario}:00`;
      await api.post('/appointments', { barbeiroId, servicoId, dataHoraInicio });
      // Agendamento confirmado — pagamento é feito na barbearia, não pelo app.
      router.replace('/(client)/my-appointments');
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setErro('Esse horário acabou de ser reservado por outro cliente. Escolha outro.');
        setOcupados((atual) => [...atual, horario]);
      } else {
        setErro('Não foi possível agendar. Tente novamente.');
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Escolha data e horário</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.diasScroll}
        contentContainerStyle={styles.diasContent}
      >
        {dias.map((d) => {
          const iso = formatarISO(d);
          const selecionado = iso === dataSelecionada;
          return (
            <Pressable
              key={iso}
              style={[styles.diaChip, selecionado && styles.diaChipSelecionado]}
              onPress={() => setDataSelecionada(iso)}
            >
              <Text style={[styles.diaSemana, selecionado && styles.diaTextoSelecionado]}>
                {d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
              </Text>
              <Text style={[styles.diaNumero, selecionado && styles.diaTextoSelecionado]}>{d.getDate()}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {erro ? <Text style={styles.erro}>{erro}</Text> : null}
      {(carregando || carregandoOcupados) && (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.sm }} />
      )}

      <View style={styles.grade}>
        {HORARIOS.map((h) => {
          const ocupado = ocupados.includes(h);
          return (
            <Pressable
              key={h}
              style={({ pressed }) => [
                styles.slot,
                pressed && !ocupado && styles.slotPressed,
                ocupado && styles.slotOcupado,
              ]}
              onPress={() => reservar(h)}
              disabled={carregando || ocupado}
            >
              <Ionicons name="time-outline" size={16} color={ocupado ? colors.textMuted : colors.primary} />
              <Text style={[styles.slotTexto, ocupado && styles.slotTextoOcupado]}>{h}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, gap: spacing.xs },
  titulo: { fontFamily: fonts.display, fontSize: 32, color: colors.textPrimary, marginBottom: spacing.xs },
  diasScroll: { flexGrow: 0, marginBottom: spacing.md },
  diasContent: { gap: spacing.sm, paddingRight: spacing.md },
  diaChip: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 2,
  },
  diaChipSelecionado: { borderColor: colors.primary, backgroundColor: colors.primary },
  diaSemana: {
    fontFamily: fonts.bodySemibold,
    fontSize: 11,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  diaNumero: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.textPrimary },
  diaTextoSelecionado: { color: colors.onPrimary },
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
  slotOcupado: { opacity: 0.4 },
  slotTexto: { fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.textPrimary },
  slotTextoOcupado: { color: colors.textMuted },
  erro: { color: colors.danger, fontFamily: fonts.bodyRegular, marginBottom: spacing.xs },
});
