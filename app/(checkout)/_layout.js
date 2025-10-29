import { Stack } from 'expo-router';

export default function CheckoutModalLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="summary" // C'est notre Ecran 30
        options={{ 
          headerShown: false, 
          presentation: 'modal',
        }}
      />
      {/* (On ajoutera l'écran de succès ici plus tard) */}
    </Stack>
  );
}
