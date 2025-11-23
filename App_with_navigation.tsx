import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthService } from './src/services/AuthService';
import AppNavigator from './src/navigation/AppNavigator';
import type { User } from './src/types';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = async (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = async () => {
    await AuthService.logout();
    setUser(null);
  };

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('🚀 Initializing app...');
      await AuthService.initialize();
      
      const currentUser = await AuthService.getCurrentUser();
      
      if (currentUser && currentUser.role) {
        console.log('✅ Found existing user:', currentUser.email, 'Role:', currentUser.role);
        setUser(currentUser);
      } else {
        console.log('📝 No existing user');
      }
    } catch (error) {
      console.error('❌ Error initializing app:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AppNavigator 
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
});
