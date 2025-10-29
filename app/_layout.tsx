// Fichier: app/_layout.tsx

import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { ThemeProvider as CustomThemeProvider } from '@/contexts/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import { User } from 'firebase/auth'; // Importer le type User
import { useEffect, useState } from 'react';
import { ActivityIndicator, View, useColorScheme } from 'react-native';
import 'react-native-reanimated';
import { auth } from '../firebaseConfig';

// 'unstable_settings' n'est plus nécessaire car nous gérons la redirection
// export const unstable_settings = { ... };

export default function RootLayout() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const systemColorScheme = useColorScheme();
  const colorScheme = systemColorScheme || 'light';

  // HOOKS DE NAVIGATION
  const router = useRouter();
  const segments = useSegments(); // Pour savoir où on est

  // 1. Écouteur d'authentification
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. "Gardien" de redirection (s'exécute si user, segments, ou loading change)
  useEffect(() => {
    if (loading) {
      return; // Ne fait rien tant qu'on ne connaît pas l'état d'authentification
    }

    const inAuthGroup = segments[0] === '(auth)';

    if (user && inAuthGroup) {
      // Utilisateur connecté, mais sur une page (auth)
      // -> Redirige vers l'accueil
      router.replace('/(tabs)');
    } else if (!user && !inAuthGroup) {
      // Utilisateur non connecté, mais sur une page protégée
      // -> Redirige vers la page de bienvenue
      router.replace('/(auth)/welcome');
    }
  }, [user, segments, loading, router]); // Dépendances du gardien

  // Affiche un spinner pendant la vérification initiale
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#34D399" />
      </View>
    );
  }

  // L'état est connu, on affiche la navigation STABLE
  return (
    <CustomThemeProvider>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      {/**
       * CHANGEMENT PRINCIPAL : 
       * Il n'y a PLUS de condition '!user' ici.
       * Le Stack déclare TOUTES les routes, TOUT LE TEMPS.
       */}
      <Stack>
        {/* Groupe 1: Auth */}
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        
        {/* Groupe 2: Tabs */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        
        {/* Groupe 3: Sell Modal */}
        <Stack.Screen 
          name="(sell-stack)" 
          options={{ 
            headerShown: false,
            presentation: 'modal',
            animation: 'slide_from_bottom'
          }}
        />
      </Stack>
    </CustomThemeProvider>
  );
}