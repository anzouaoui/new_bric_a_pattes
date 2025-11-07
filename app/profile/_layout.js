import { Stack, useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';

export default function ProfileLayout() {
  const theme = useTheme();
  const router = useRouter();
  
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Désactive le header par défaut pour tous les écrans
        contentStyle: {
          backgroundColor: theme.background,
        },
        animation: 'default', // Animation par défaut pour une meilleure cohérence
      }}
    >
      <Stack.Screen 
        name="[id]" 
        options={{
          headerShown: false,
          // Configuration spécifique pour l'écran de profil
          animation: 'default',
        }}
      />
      <Stack.Screen 
        name="edit-profile" 
        options={{
          headerShown: false,
          animation: 'default',
        }}
      />
      <Stack.Screen 
        name="MyListingsScreen" 
        options={{
          headerShown: false,
          animation: 'default',
          // Permet de personnaliser le bouton retour
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
              style={{ marginLeft: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen 
        name="MyfavoritsScreen" 
        options={{
          headerShown: false,
          animation: 'default',
        }}
      />
      <Stack.Screen 
        name="MyOrdersScreen" 
        options={{
          headerShown: false,
          animation: 'default',
        }}
      />
      <Stack.Screen 
        name="MySalesScreen" 
        options={{
          headerShown: false,
          animation: 'default',
        }}
      />
    </Stack>
  );
}
