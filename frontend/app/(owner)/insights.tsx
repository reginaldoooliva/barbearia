import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/services/api';
import { colors, fonts, spacing, radii } from '../../src/theme/theme';

interface RankingItem {
  nome: string;
  confirmados: number;
  cancelados: number;
}

interface Estatisticas {
  periodo: { dataInicio: string; dataFim: string };
  totalAgendamentos: number;
  confirmados: number;
  cancelados: number;
  taxaCancelamento: number;
  ocupacao: { slotsOcupados: number; slotsTotais: number; percentual: number };
  porBarbeiro: RankingItem[];
  porServico: RankingItem[];
}

function formatarISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

function hojeMenosDias(dias: number) {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return formatarISO(d);
}

const HOJE = formatarISO(new Date());

const PRESETS = [
  { label: 'Hoje', inicio: HOJE },
  { label: '7 dias', inicio: hojeMenosDias(6) },
  { label: '30 dias', inicio: hojeMenosDias(29) },
];

export default function OwnerInsights() {
  const [dataInicio, setDataInicio] = useState(hojeMenosDias(6));
  const [dataFim, setDataFim] = useState(HOJE);
  const [stats, setStats] = useState<Estatisticas | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!dataInicio || !dataFim) return;
    setCarregando(true);
    setErro('');
    api
      .get('/appointments/stats', { params: { dataInicio, dataFim } })
      .then(({ data }) => setStats(data))
      .catch(() => setErro('Não foi possível carregar as estatísticas.'))
      .finally(() => setCarregando(false));
  }, [dataInicio, dataFim]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.textSecondary} />
        </Pressable>
        <View>
          <Text style={styles.saudacao}>Painel do proprietário</Text>
          <Text style={styles.titulo}>Saúde do negócio</Text>
        </View>
      </View>

      <View style={styles.presets}>
        {PRESETS.map((p) => {
          const selecionado = dataInicio === p.inicio && dataFim === HOJE;
          return (
            <Pressable
              key={p.label}
              style={[styles.presetChip, selecionado && styles.presetChipSelecionado]}
              onPress={() => {
                setDataInicio(p.inicio);
                setDataFim(HOJE);
              }}
            >
              <Text style={[styles.presetTexto, selecionado && styles.presetTextoSelecionado]}>{p.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.periodoCustom}>
        <View style={styles.campoData}>
          <Text style={styles.rotulo}>De</Text>
          <TextInput
            style={styles.input}
            value={dataInicio}
            onChangeText={setDataInicio}
            placeholder="AAAA-MM-DD"
            placeholderTextColor={colors.textMuted}
          />
        </View>
        <View style={styles.campoData}>
          <Text style={styles.rotulo}>Até</Text>
          <TextInput
            style={styles.input}
            value={dataFim}
            onChangeText={setDataFim}
            placeholder="AAAA-MM-DD"
            placeholderTextColor={colors.textMuted}
          />
        </View>
      </View>

      {erro ? <Text style={styles.erro}>{erro}</Text> : null}
      {carregando && <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />}

      {stats && !carregando && (
        <>
          <View style={styles.kpiGrade}>
            <KpiCard label="Agendamentos" valor={String(stats.totalAgendamentos)} />
            <KpiCard label="Confirmados" valor={String(stats.confirmados)} cor={colors.success} />
            <KpiCard label="Cancelados" valor={String(stats.cancelados)} cor={colors.danger} />
            <KpiCard label="Cancelamento" valor={`${stats.taxaCancelamento.toFixed(0)}%`} cor={colors.danger} />
            <KpiCard label="Ocupação" valor={`${stats.ocupacao.percentual.toFixed(0)}%`} cor={colors.primary} />
          </View>

          <Ranking titulo="Barbeiros" itens={stats.porBarbeiro} />
          <Ranking titulo="Serviços" itens={stats.porServico} />
        </>
      )}
    </ScrollView>
  );
}

function KpiCard({ label, valor, cor }: { label: string; valor: string; cor?: string }) {
  return (
    <View style={styles.kpiCard}>
      <Text style={[styles.kpiValor, cor ? { color: cor } : null]}>{valor}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

function Ranking({ titulo, itens }: { titulo: string; itens: RankingItem[] }) {
  return (
    <View style={styles.secao}>
      <Text style={styles.secaoTitulo}>{titulo}</Text>
      {itens.length === 0 ? (
        <Text style={styles.vazioTexto}>Sem agendamentos no período</Text>
      ) : (
        itens.map((item) => (
          <View key={item.nome} style={styles.rankingLinha}>
            <Text style={styles.rankingNome}>{item.nome}</Text>
            <View style={styles.rankingNumeros}>
              <Text style={[styles.rankingNumero, { color: colors.success }]}>{item.confirmados}</Text>
              {item.cancelados > 0 && (
                <Text style={[styles.rankingNumero, { color: colors.danger }]}>-{item.cancelados}</Text>
              )}
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  saudacao: { fontFamily: fonts.bodySemibold, color: colors.primary, fontSize: 12, letterSpacing: 0.5, textTransform: 'uppercase' },
  titulo: { fontFamily: fonts.display, fontSize: 32, color: colors.textPrimary },
  presets: { flexDirection: 'row', gap: spacing.sm },
  presetChip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
  },
  presetChipSelecionado: { borderColor: colors.primary, backgroundColor: colors.primary },
  presetTexto: { fontFamily: fonts.bodySemibold, fontSize: 12, color: colors.textSecondary },
  presetTextoSelecionado: { color: colors.onPrimary },
  periodoCustom: { flexDirection: 'row', gap: spacing.sm },
  campoData: { flex: 1, gap: 4 },
  rotulo: { fontFamily: fonts.bodySemibold, fontSize: 11, color: colors.textMuted, textTransform: 'uppercase' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    fontFamily: fonts.bodyRegular,
    color: colors.textPrimary,
  },
  erro: { color: colors.danger, fontFamily: fonts.bodyRegular },
  kpiGrade: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  kpiCard: {
    minWidth: '30%',
    flexGrow: 1,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  kpiValor: { fontFamily: fonts.display, fontSize: 28, color: colors.textPrimary },
  kpiLabel: { fontFamily: fonts.bodyRegular, fontSize: 11, color: colors.textSecondary, textTransform: 'uppercase' },
  secao: { gap: spacing.sm },
  secaoTitulo: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.textPrimary },
  rankingLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  rankingNome: { fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.textPrimary },
  rankingNumeros: { flexDirection: 'row', gap: spacing.sm },
  rankingNumero: { fontFamily: fonts.bodyBold, fontSize: 14 },
  vazioTexto: { fontFamily: fonts.bodyRegular, color: colors.textMuted },
});
