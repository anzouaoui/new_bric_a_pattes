import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

export default function ProfileLayout() {
  const theme = useTheme();
  
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.background,
        },
        headerTintColor: theme.tabIconSelected,
        headerTitleStyle: {
          fontWeight: 'bold',
          color: theme.text,
        },
        contentStyle: {
          backgroundColor: theme.background,
        },
      }}
    >
      <Stack.Screen 
        name="[id]" 
        options={{
          title: 'Profil',
          headerBackTitle: 'Retour',
        }}
      />
      <Stack.Screen 
        name="edit-profile" 
        options={{
          title: 'Modifier le profil',
          headerBackTitle: 'Retour',
        }}
      />
    </Stack>
  );
}
