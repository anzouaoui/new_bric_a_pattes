import { Stack } from 'expo-router';

export default function BoostModalLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="boost-options" // C'est notre Ecran 26
        options={{ 
          headerShown: false, 
          presentation: 'modal',
        }}
      />
      {/* (On ajoutera l'écran de paiement ici plus tard) */}
    </Stack>
  );
}
