import { View, Text, Image, ImageBackground, StyleSheet, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../src/components/Button';
import { colors, fonts, spacing } from '../src/theme/theme';

const WIDE_BREAKPOINT = 768;

export default function Home() {
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;

  const menu = (
    <>
      <Text style={styles.kicker}>DESDE O CORTE CLÁSSICO ATÉ O ESTILO MODERNO</Text>
      <Text style={styles.titulo}>Barbershop</Text>
      <Text style={styles.subtitulo}>Agende seu horário na melhor barbearia da cidade</Text>

      <View style={styles.botoes}>
        <Button label="Entrar como cliente" onPress={() => router.push('/(auth)/login-client')} />
        <Button
          label="Entrar como proprietário"
          variant="secondary"
          onPress={() => router.push('/(auth)/login-owner')}
        />
      </View>
    </>
  );

  if (isWide) {
    return (
      <View style={styles.wideContainer}>
        <View style={styles.wideImageSide}>
          <Image source={require('../assets/images/hero-shop.jpg')} style={styles.wideImage} resizeMode="cover" />
          <LinearGradient
            colors={['transparent', 'transparent', colors.background]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFillObject}
          />
        </View>
        <View style={styles.wideMenuSide}>
          <View style={styles.wideContent}>{menu}</View>
        </View>
      </View>
    );
  }

  return (
    <ImageBackground
      source={require('../assets/images/hero-shop.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(20,17,16,0.35)', 'rgba(20,17,16,0.75)', colors.background]}
        locations={[0, 0.55, 1]}
        style={styles.gradient}
      >
        <View style={styles.content}>{menu}</View>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  gradient: { flex: 1, justifyContent: 'flex-end' },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.sm },
  wideContainer: { flex: 1, flexDirection: 'row', backgroundColor: colors.background },
  wideImageSide: { flex: 1.2 },
  wideImage: { width: '100%', height: '100%' },
  wideMenuSide: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  wideContent: { width: '100%', maxWidth: 420, paddingHorizontal: spacing.xl, gap: spacing.sm },
  kicker: {
    fontFamily: fonts.bodySemibold,
    fontSize: 12,
    letterSpacing: 1.5,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  titulo: {
    fontFamily: fonts.display,
    fontSize: 64,
    lineHeight: 64,
    color: colors.textPrimary,
  },
  subtitulo: {
    fontFamily: fonts.bodyRegular,
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  botoes: { gap: spacing.sm },
});
