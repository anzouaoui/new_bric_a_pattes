// Fichier : constants/theme.js
import { Dimensions } from 'react-native';
import Colors from './Colors';
import Typography from './Typography';

const { width, height } = Dimensions.get('window');

export default {
  // Dimensions de l'écran
  window: {
    width,
    height,
  },
  
  // Espacements
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  // Rayons de bordure
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    round: 9999, // Pour les boutons ronds
  },
  
  // Élévations (pour les ombres)
  elevation: {
    none: 0,
    xs: 1,
    sm: 2,
    md: 4,
    lg: 8,
    xl: 16,
  },
  
  // Couleurs
  colors: {
    ...Colors,
    // Alias pour une meilleure sémantique
    primary: Colors.primary,
    secondary: Colors.secondary,
    background: Colors.background,
    surface: Colors.surface,
    text: Colors.text,
    textSecondary: Colors.textSecondary,
    border: Colors.border,
    success: Colors.success,
    error: Colors.error,
    warning: Colors.warning,
    info: Colors.info,
  },
  
  // Typographie
  typography: {
    ...Typography,
    // Styles de texte prédéfinis
    h1: {
      fontSize: Typography.h1,
      fontWeight: Typography.bold,
      lineHeight: Typography.h1 * Typography.lineHeight.tight,
      color: Colors.text,
    },
    h2: {
      fontSize: Typography.h2,
      fontWeight: Typography.bold,
      lineHeight: Typography.h2 * Typography.lineHeight.tight,
      color: Colors.text,
    },
    h3: {
      fontSize: Typography.h3,
      fontWeight: Typography.semiBold,
      lineHeight: Typography.h3 * Typography.lineHeight.tight,
      color: Colors.text,
    },
    h4: {
      fontSize: Typography.h4,
      fontWeight: Typography.semiBold,
      lineHeight: Typography.h4 * Typography.lineHeight.tight,
      color: Colors.text,
    },
    body: {
      fontSize: Typography.body,
      fontWeight: Typography.regular,
      lineHeight: Typography.body * Typography.lineHeight.normal,
      color: Colors.text,
    },
    small: {
      fontSize: Typography.small,
      fontWeight: Typography.regular,
      lineHeight: Typography.small * Typography.lineHeight.normal,
      color: Colors.textSecondary,
    },
    button: {
      fontSize: Typography.body,
      fontWeight: Typography.semiBold,
      letterSpacing: Typography.letterSpacing.wide,
      textTransform: 'uppercase',
    },
  },
  
  // Styles de composants réutilisables
  components: {
    card: {
      backgroundColor: Colors.surface,
      borderRadius: 12,
      padding: 16,
      shadowColor: Colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    button: {
      primary: {
        backgroundColor: Colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
      },
      secondary: {
        backgroundColor: Colors.secondary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
      },
      text: {
        color: Colors.white,
        ...Typography.button,
      },
    },
    input: {
      backgroundColor: Colors.white,
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: Typography.body,
      color: Colors.text,
    },
  },
};
