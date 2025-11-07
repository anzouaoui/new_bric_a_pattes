import { Stack } from 'expo-router';

export default function CheckoutModalLayout() {
  return (
    <Stack screenOptions={{
      headerShown: false, // Désactive le header pour tous les écrans du groupe
      presentation: 'modal',
    }}>
      <Stack.Screen name="SummaryScreen" />
      <Stack.Screen name="ShippingAddressScreen" />
      <Stack.Screen name="PaymentSuccessScreen" />
    </Stack>
  );
}
