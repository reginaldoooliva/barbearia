import { useState } from 'react';
import { View, Text, TextInput, Image, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { Button } from '../../src/components/Button';
import { colors, fonts, spacing, radii } from '../../src/theme/theme';

export default function Register() {
  const { register, logando } = useAuth();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');

  async function cadastrar() {
    setErro('');
    if (!nome || !email || !senha) {
      setErro('Preencha todos os campos');
      return;
    }
    if (senha.length < 6) {
      setErro('A senha precisa ter pelo menos 6 caracteres');
      return;
    }
    try {
      await register(nome, email, senha);
      router.replace('/(client)/home');
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setErro('Esse e-mail já está cadastrado');
      } else {
        setErro('Não foi possível cadastrar. Tente novamente.');
      }
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.flex} keyboardShouldPersistTaps="handled">
        <Image source={require('../../assets/images/hero-shave.jpg')} style={styles.banner} resizeMode="cover" />
        <View style={styles.container}>
          <View style={styles.iconWrap}>
            <Ionicons name="person-add-outline" size={22} color={colors.primary} />
          </View>
          <Text style={styles.titulo}>Criar conta</Text>
          <Text style={styles.subtitulo}>Leva menos de um minuto</Text>

          <TextInput
            style={styles.input}
            placeholder="Nome"
            placeholderTextColor={colors.textMuted}
            value={nome}
            onChangeText={setNome}
          />
          <TextInput
            style={styles.input}
            placeholder="E-mail"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Senha (mínimo 6 caracteres)"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            value={senha}
            onChangeText={setSenha}
          />
          {erro ? <Text style={styles.erro}>{erro}</Text> : null}

          <Button label="Cadastrar" onPress={cadastrar} loading={logando} style={styles.botao} />

          <Text style={styles.link} onPress={() => router.replace('/(auth)/login-client')}>
            Já tem conta? <Text style={styles.linkDestaque}>Entrar</Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flexGrow: 1, backgroundColor: colors.background },
  banner: { width: '100%', height: 200 },
  container: { flex: 1, padding: spacing.lg, gap: spacing.sm, marginTop: -spacing.lg },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  titulo: { fontFamily: fonts.display, fontSize: 34, color: colors.textPrimary },
  subtitulo: { fontFamily: fonts.bodyRegular, fontSize: 15, color: colors.textSecondary, marginBottom: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    padding: 14,
    color: colors.textPrimary,
    fontFamily: fonts.bodyRegular,
    fontSize: 16,
  },
  botao: { marginTop: spacing.sm },
  link: {
    fontFamily: fonts.bodyRegular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  linkDestaque: { fontFamily: fonts.bodySemibold, color: colors.primary },
  erro: { color: colors.danger, fontFamily: fonts.bodyRegular },
});
