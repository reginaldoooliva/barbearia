import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/services/api';
import { Avatar } from '../../src/components/Avatar';
import { Button } from '../../src/components/Button';
import { colors, fonts, spacing, radii } from '../../src/theme/theme';

interface Barbeiro {
  id: string;
  nome: string;
}

interface Servico {
  id: string;
  nome: string;
  duracaoMin: number;
  precoCentavos: number;
}

export default function ChooseBarberService() {
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [barbeiroId, setBarbeiroId] = useState<string | null>(null);
  const [servicoId, setServicoId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    Promise.all([api.get('/barbeiros'), api.get('/services-catalog')])
      .then(([resBarbeiros, resServicos]) => {
        setBarbeiros(resBarbeiros.data);
        setServicos(resServicos.data);
      })
      .catch(() => setErro('Não foi possível carregar barbeiros e serviços.'))
      .finally(() => setCarregando(false));
  }, []);

  function continuar() {
    if (!barbeiroId || !servicoId) return;
    router.push({
      pathname: '/(client)/schedule',
      params: { barbeiroId, servicoId },
    });
  }

  if (carregando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Novo agendamento</Text>
      <Text style={styles.subtitulo}>Escolha o profissional e o serviço desejado</Text>
      {erro ? <Text style={styles.erro}>{erro}</Text> : null}

      <Text style={styles.secao}>Barbeiro</Text>
      {barbeiros.length === 0 && <Text style={styles.vazio}>Nenhum barbeiro cadastrado ainda.</Text>}
      {barbeiros.map((b) => {
        const selecionado = barbeiroId === b.id;
        return (
          <Pressable
            key={b.id}
            style={[styles.opcao, selecionado && styles.opcaoSelecionada]}
            onPress={() => setBarbeiroId(b.id)}
          >
            <Avatar nome={b.nome} />
            <Text style={styles.opcaoTexto}>{b.nome}</Text>
            {selecionado && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
          </Pressable>
        );
      })}

      <Text style={styles.secao}>Serviço</Text>
      {servicos.length === 0 && <Text style={styles.vazio}>Nenhum serviço cadastrado ainda.</Text>}
      {servicos.map((s) => {
        const selecionado = servicoId === s.id;
        return (
          <Pressable
            key={s.id}
            style={[styles.opcao, selecionado && styles.opcaoSelecionada]}
            onPress={() => setServicoId(s.id)}
          >
            <View style={styles.servicoIcone}>
              <Ionicons name="cut-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.opcaoTextoWrap}>
              <Text style={styles.opcaoTexto}>{s.nome}</Text>
              <Text style={styles.opcaoDetalhe}>
                {s.duracaoMin} min · R$ {(s.precoCentavos / 100).toFixed(2)}
              </Text>
            </View>
            {selecionado && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
          </Pressable>
        );
      })}

      <Button
        label="Continuar"
        onPress={continuar}
        disabled={!barbeiroId || !servicoId}
        style={styles.botao}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  centro: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  container: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },
  titulo: { fontFamily: fonts.display, fontSize: 32, color: colors.textPrimary },
  subtitulo: { fontFamily: fonts.bodyRegular, fontSize: 14, color: colors.textSecondary, marginBottom: spacing.sm },
  secao: {
    fontFamily: fonts.bodySemibold,
    fontSize: 13,
    letterSpacing: 0.5,
    color: colors.primary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  vazio: { color: colors.textMuted, fontFamily: fonts.bodyRegular },
  opcao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.sm,
  },
  opcaoSelecionada: { borderColor: colors.primary, backgroundColor: colors.surfaceAlt },
  opcaoTextoWrap: { flex: 1 },
  opcaoTexto: { fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.textPrimary, flex: 1 },
  opcaoDetalhe: { fontFamily: fonts.bodyRegular, fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  servicoIcone: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botao: { marginTop: spacing.lg },
  erro: { color: colors.danger, fontFamily: fonts.bodyRegular },
});
