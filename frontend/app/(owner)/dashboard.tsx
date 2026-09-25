import { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { colors, fonts, spacing, radii, statusColors, statusLabels } from '../../src/theme/theme';

interface Agendamento {
  id: string;
  dataHoraInicio: string;
  status: string;
  cliente: { nome: string };
  barbeiro: { nome: string };
  servico: { nome: string };
}

function formatarISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

function labelData(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
}

const HOJE_ISO = formatarISO(new Date());

export default function OwnerDashboard() {
  const { logout } = useAuth();
  const [lista, setLista] = useState<Agendamento[]>([]);
  const [dataSelecionada, setDataSelecionada] = useState(HOJE_ISO);

  useEffect(() => {
    api
      .get('/appointments/agenda', { params: { data: dataSelecionada } })
      .then(({ data }) => setLista(data))
      .catch(() => {});
  }, [dataSelecionada]);

  function mudarDia(delta: number) {
    const d = new Date(`${dataSelecionada}T00:00:00`);
    d.setDate(d.getDate() + delta);
    setDataSelecionada(formatarISO(d));
  }

  async function sair() {
    await logout();
    router.replace('/');
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.saudacao}>Painel do proprietário</Text>
          <Text style={styles.titulo}>Agenda</Text>
        </View>
        <View style={styles.headerAcoes}>
          <Pressable onPress={() => router.push('/(owner)/insights')} hitSlop={12}>
            <Ionicons name="stats-chart-outline" size={22} color={colors.textSecondary} />
          </Pressable>
          <Pressable onPress={sair} hitSlop={12}>
            <Ionicons name="log-out-outline" size={24} color={colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.seletorData}>
        <Pressable onPress={() => mudarDia(-1)} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.dataLabel}>{labelData(dataSelecionada)}</Text>
        <Pressable onPress={() => mudarDia(1)} hitSlop={12}>
          <Ionicons name="chevron-forward" size={22} color={colors.textSecondary} />
        </Pressable>
      </View>
      {dataSelecionada !== HOJE_ISO && (
        <Pressable onPress={() => setDataSelecionada(HOJE_ISO)}>
          <Text style={styles.hojeLink}>Voltar para hoje</Text>
        </Pressable>
      )}

      <FlatList
        data={lista}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: spacing.sm }}
        ListEmptyComponent={
          <View style={styles.vazio}>
            <Ionicons name="calendar-outline" size={32} color={colors.textMuted} />
            <Text style={styles.vazioTexto}>Nenhum agendamento nesse dia</Text>
          </View>
        }
        renderItem={({ item }) => {
          const cor = statusColors[item.status] ?? colors.textMuted;
          return (
            <View style={styles.card}>
              <View style={styles.horaBox}>
                <Text style={styles.hora}>
                  {new Date(item.dataHoraInicio).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <View style={styles.cardTexto}>
                <Text style={styles.cliente}>{item.cliente.nome}</Text>
                <Text style={styles.detalhe}>{item.servico.nome} com {item.barbeiro.nome}</Text>
              </View>
              <View style={[styles.badge, { borderColor: cor }]}>
                <Text style={[styles.badgeTexto, { color: cor }]}>{statusLabels[item.status] ?? item.status}</Text>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  headerAcoes: { flexDirection: 'row', gap: spacing.md },
  saudacao: { fontFamily: fonts.bodySemibold, color: colors.primary, fontSize: 12, letterSpacing: 0.5, textTransform: 'uppercase' },
  titulo: { fontFamily: fonts.display, fontSize: 32, color: colors.textPrimary },
  seletorData: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  dataLabel: {
    fontFamily: fonts.bodySemibold,
    fontSize: 14,
    color: colors.textPrimary,
    textTransform: 'capitalize',
  },
  hojeLink: {
    fontFamily: fonts.bodySemibold,
    fontSize: 12,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  horaBox: {
    minWidth: 56,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingRight: spacing.sm,
  },
  hora: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.primary },
  cardTexto: { flex: 1 },
  cliente: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.textPrimary },
  detalhe: { fontFamily: fonts.bodyRegular, fontSize: 13, color: colors.textSecondary },
  badge: { borderWidth: 1, borderRadius: radii.pill, paddingVertical: 4, paddingHorizontal: 10 },
  badgeTexto: { fontFamily: fonts.bodySemibold, fontSize: 11, letterSpacing: 0.3 },
  vazio: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.xxl },
  vazioTexto: { fontFamily: fonts.bodyRegular, color: colors.textMuted },
});
