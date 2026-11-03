import { TextStyle } from 'react-native';

export const fonts = {
  headline: 'HankenGrotesk_700Bold',
  headlineExtraBold: 'HankenGrotesk_800ExtraBold',
  body: 'PublicSans_400Regular',
  bodySemiBold: 'PublicSans_600SemiBold',
  mono: 'JetBrainsMono_600SemiBold',
};

type Style = TextStyle;

export const typography: Record<string, Style> = {
  displayLg: { fontFamily: fonts.headlineExtraBold, fontSize: 40, lineHeight: 46, letterSpacing: -0.5 },
  headlineLg: { fontFamily: fonts.headline, fontSize: 28, lineHeight: 34 },
  headlineMd: { fontFamily: fonts.headline, fontSize: 22, lineHeight: 28 },
  titleMd: { fontFamily: fonts.headline, fontSize: 18, lineHeight: 24 },
  bodyMd: { fontFamily: fonts.body, fontSize: 16, lineHeight: 22 },
  bodySm: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  bodySemiBold: { fontFamily: fonts.bodySemiBold, fontSize: 15, lineHeight: 20 },
  labelCaps: { fontFamily: fonts.mono, fontSize: 12, lineHeight: 16, letterSpacing: 0.6, textTransform: 'uppercase' },
  monoSm: { fontFamily: fonts.mono, fontSize: 12, lineHeight: 16 },
  statusIndicator: { fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: 18 },
};
