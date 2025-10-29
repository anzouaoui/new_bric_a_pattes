import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AuthStack from './AuthStack';

const RootStack = createStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen 
          name="Auth" 
          component={AuthStack} 
        />
        {/* Ajoutez d'autres stacks ici (ex: MainStack) */}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
