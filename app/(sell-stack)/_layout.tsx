import { Stack, useNavigation } from 'expo-router';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SellStackLayout() {
  const navigation = useNavigation();
  return (
    <Stack screenOptions={{
      headerShown: false, // Désactive le header par défaut pour tous les écrans
      presentation: 'modal',
      animation: 'slide_from_bottom'
    }}>
      <Stack.Screen 
        name="select-category" 
        options={{
          headerShown: true,
          title: 'Choisir une catégorie',
          headerLeft: () => {
            return (
              <TouchableOpacity 
                onPress={() => {
                  // Vérifier s'il y a une navigation précédente
                  if (navigation.canGoBack()) {
                    navigation.goBack();
                  } else {
                    // Si pas de navigation précédente, rediriger vers l'écran d'accueil
                    // @ts-ignore - Ignorer l'erreur de typage pour la navigation
                    navigation.navigate('(tabs)');
                  }
                }}
                style={{ marginLeft: 10 }}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            );
          },
        }}
      />
      <Stack.Screen 
        name="add-details" 
        options={{
          headerShown: true,
          title: 'Détails de l\'annonce',
          headerLeft: () => {
            return (
              <TouchableOpacity 
                onPress={() => navigation.goBack()}
                style={{ marginLeft: 10 }}
              >
                <Ionicons name="arrow-back" size={24} color="#000" />
              </TouchableOpacity>
            );
          },
        }}
      />
      <Stack.Screen 
        name="add-photos" 
        options={{
          headerShown: true,
          title: 'Ajouter des photos',
          headerLeft: () => {
            return (
              <TouchableOpacity 
                onPress={() => navigation.goBack()}
                style={{ marginLeft: 10 }}
              >
                <Ionicons name="arrow-back" size={24} color="#000" />
              </TouchableOpacity>
            );
          },
        }}
      />
      <Stack.Screen 
        name="publish-success" 
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
