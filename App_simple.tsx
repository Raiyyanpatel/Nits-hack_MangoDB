import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import 'react-native-gesture-handler';

// Import services
import { AuthService } from './src/services/AuthService';
import { User } from './src/types';

// Import components
import LoadingScreen from './src/components/LoadingScreen';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      await AuthService.initialize();
      const currentUser = await AuthService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const loggedInUser = await AuthService.login('demo@disaster.gov', 'demo123');
      setUser(loggedInUser);
      Alert.alert('Success', `Welcome ${loggedInUser.name}!`);
    } catch (error) {
      Alert.alert('Login Failed', 'Please try again');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      setUser(null);
      Alert.alert('Logged Out', 'You have been logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const selectRole = (role: 'citizen' | 'official') => {
    if (user) {
      const updatedUser = { ...user, role };
      setUser(updatedUser);
      Alert.alert('Role Selected', `You are now logged in as ${role}`);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Login Screen
  if (!user) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.content}>
          <Text style={styles.title}>🚨 SurakshaSetu</Text>
          <Text style={styles.subtitle}>Disaster Management System</Text>
          
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
          >
            <Text style={styles.buttonText}>Demo Login</Text>
          </TouchableOpacity>
          
          <Text style={styles.helpText}>
            Emergency: 112 | Disaster Helpline: 1078
          </Text>
        </View>
      </View>
    );
  }

  // Role Selection Screen
  if (!user.role) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.content}>
          <Text style={styles.title}>Welcome, {user.name}!</Text>
          <Text style={styles.subtitle}>Select your role to continue</Text>
          
          <TouchableOpacity
            style={[styles.roleButton, styles.citizenButton]}
            onPress={() => selectRole('citizen')}
          >
            <Text style={styles.roleIcon}>👤</Text>
            <Text style={styles.buttonText}>Citizen</Text>
            <Text style={styles.roleDescription}>Report incidents & get alerts</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.roleButton, styles.officialButton]}
            onPress={() => selectRole('official')}
          >
            <Text style={styles.roleIcon}>🛡️</Text>
            <Text style={styles.buttonText}>Emergency Official</Text>
            <Text style={styles.roleDescription}>Manage responses & verify reports</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Main App Screen
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <Text style={styles.title}>🎉 Success!</Text>
        <Text style={styles.subtitle}>
          {user.role === 'citizen' ? '👤 Citizen Dashboard' : '🛡️ Official Dashboard'}
        </Text>
        <Text style={styles.welcomeText}>
          Welcome {user.name}! You are logged in as {user.role}.
        </Text>
        
        <View style={styles.featureGrid}>
          {user.role === 'citizen' ? (
            <>
              <TouchableOpacity style={styles.featureButton}>
                <Text style={styles.featureIcon}>🚨</Text>
                <Text style={styles.featureText}>Alerts</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.featureButton}>
                <Text style={styles.featureIcon}>📝</Text>
                <Text style={styles.featureText}>Report</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.featureButton}>
                <Text style={styles.featureIcon}>🗺️</Text>
                <Text style={styles.featureText}>Map</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.featureButton}>
                <Text style={styles.featureIcon}>🏥</Text>
                <Text style={styles.featureText}>Facilities</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.featureButton}>
                <Text style={styles.featureIcon}>📊</Text>
                <Text style={styles.featureText}>Dashboard</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.featureButton}>
                <Text style={styles.featureIcon}>✅</Text>
                <Text style={styles.featureText}>Verify</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.featureButton}>
                <Text style={styles.featureIcon}>📢</Text>
                <Text style={styles.featureText}>Broadcast</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.featureButton}>
                <Text style={styles.featureIcon}>🆘</Text>
                <Text style={styles.featureText}>SOS Feed</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 48,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 32,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
    minWidth: 200,
  },
  roleButton: {
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
    minWidth: 280,
    alignItems: 'center',
  },
  citizenButton: {
    backgroundColor: '#3b82f6',
  },
  officialButton: {
    backgroundColor: '#dc2626',
  },
  roleIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  roleDescription: {
    color: '#e5e7eb',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 32,
  },
  featureButton: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    margin: 8,
    alignItems: 'center',
    width: 120,
    height: 100,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#6b7280',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  helpText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
});