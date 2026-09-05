import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/services/api';
import { colors, fonts, spacing, radii, statusColors, statusLabels } from '../../src/theme/theme';

interface Agendamento {
  id: string;
  dataHoraInicio: string;
  status: string;
  servico: { nome: string };
  barbeiro: { nome: string };
}

export default function MyAppointments() {
  const [lista, setLista] = useState<Agendamento[]>([]);

  useEffect(() => {
    api.get('/appointments/meus').then(({ data }) => setLista(data));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Meus agendamentos</Text>
      <FlatList
        data={lista}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: spacing.sm }}
        ListEmptyComponent={
          <View style={styles.vazio}>
            <Ionicons name="calendar-outline" size={32} color={colors.textMuted} />
            <Text style={styles.vazioTexto}>Você ainda não tem agendamentos</Text>
          </View>
        }
        renderItem={({ item }) => {
          const cor = statusColors[item.status] ?? colors.textMuted;
          return (
            <View style={styles.card}>
              <View style={styles.cardIcone}>
                <Ionicons name="cut-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.cardTexto}>
                <Text style={styles.servico}>{item.servico.nome}</Text>
                <Text style={styles.detalhe}>{item.barbeiro.nome}</Text>
                <Text style={styles.detalhe}>
                  {new Date(item.dataHoraInicio).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
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
  titulo: { fontFamily: fonts.display, fontSize: 32, color: colors.textPrimary, marginBottom: spacing.md },
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
  cardIcone: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTexto: { flex: 1 },
  servico: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.textPrimary },
  detalhe: { fontFamily: fonts.bodyRegular, fontSize: 13, color: colors.textSecondary },
  badge: { borderWidth: 1, borderRadius: radii.pill, paddingVertical: 4, paddingHorizontal: 10 },
  badgeTexto: { fontFamily: fonts.bodySemibold, fontSize: 11, letterSpacing: 0.3 },
  vazio: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.xxl },
  vazioTexto: { fontFamily: fonts.bodyRegular, color: colors.textMuted },
});
