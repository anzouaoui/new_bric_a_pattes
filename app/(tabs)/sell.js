import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { auth } from '../../firebaseConfig';

export default function SellScreen() {
  const router = useRouter();

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    const user = auth.currentUser;
    
    if (!user) {
      // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
      router.replace('/(auth)/welcome');
      return;
    }
    
    // Utiliser push au lieu de replace pour permettre le retour
    router.push('/(sell-stack)/SelectCategoryScreen');
  }, [router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Stack.Screen 
        options={{ 
          headerShown: true,
          title: 'Vendre un article',
          headerBackTitle: 'Retour'
        }} 
      />
      <ActivityIndicator size="large" color="#95ba72" />
    </View>
  );
}
