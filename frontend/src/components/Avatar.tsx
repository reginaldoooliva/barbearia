import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../theme/theme';

export function Avatar({ nome, size = 44 }: { nome: string; size?: number }) {
  const iniciais = nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('');

  return (
    <View style={[styles.circulo, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.texto, { fontSize: size * 0.4 }]}>{iniciais}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circulo: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texto: {
    fontFamily: fonts.bodyBold,
    color: colors.primary,
  },
});
