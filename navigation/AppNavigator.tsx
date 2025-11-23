import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { User } from '../types';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import RoleSelectionScreen from '../screens/RoleSelectionScreen';
import CitizenTabNavigator from '../screens/citizen/CitizenTabNavigator';
import OfficialTabNavigator from '../screens/official/OfficialTabNavigator';

export type RootStackParamList = {
  Login: undefined;
  RoleSelection: { user: User };
  CitizenApp: { user: User };
  OfficialApp: { user: User };
};

const Stack = createStackNavigator<RootStackParamList>();

interface AppNavigatorProps {
  user: User | null;
  onLogin: (user: User) => void;
  onLogout: () => void;
}

const AppNavigator: React.FC<AppNavigatorProps> = ({ user, onLogin, onLogout }) => {
  const getInitialRouteName = () => {
    if (!user) return 'Login';
    if (!user.role) return 'RoleSelection';
    return user.role === 'citizen' ? 'CitizenApp' : 'OfficialApp';
  };

  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName={getInitialRouteName()}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login">
          {(props) => <LoginScreen {...props} onLogin={onLogin} />}
        </Stack.Screen>
        
        <Stack.Screen name="RoleSelection">
          {(props) => (
            <RoleSelectionScreen 
              {...props} 
              user={user!}
              onRoleSelected={onLogin}
            />
          )}
        </Stack.Screen>
        
        <Stack.Screen name="CitizenApp">
          {(props) => (
            <CitizenTabNavigator 
              {...props} 
              user={user!}
              onLogout={onLogout}
            />
          )}
        </Stack.Screen>
        
        <Stack.Screen name="OfficialApp">
          {(props) => (
            <OfficialTabNavigator 
              {...props} 
              user={user!}
              onLogout={onLogout}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;