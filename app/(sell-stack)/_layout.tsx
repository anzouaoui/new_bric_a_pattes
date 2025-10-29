import { Stack } from 'expo-router';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SellStackLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="select-category" 
        options={({ navigation }) => ({
          title: 'Choisir une catégorie',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={{ marginLeft: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
          ),
        })}
      />
      {/* Ajoutez d'autres écrans de la pile de vente ici */}
    </Stack>
  );
}
