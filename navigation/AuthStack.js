import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import WelcomeScreen from '../app/WelcomeScreen';
import SignUpScreen from '../app/SignUpScreen';

const Stack = createStackNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator 
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#FFFFFF' },
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen 
        name="SignUp" 
        component={SignUpScreen} 
        options={{
          headerShown: true,
          headerTitle: 'Créer un compte',
          headerTitleAlign: 'center',
          headerStyle: {
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
        }}
      />
    </Stack.Navigator>
  );
};

export default AuthStack;
