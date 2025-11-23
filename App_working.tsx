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
    console.log('Login button pressed!'); // Debug log
    setIsLoading(true);
    try {
      const loggedInUser = await AuthService.login('demo@disaster.gov', 'demo123');
      console.log('User logged in:', loggedInUser); // Debug log
      setUser(loggedInUser);
      Alert.alert('Success', `Welcome ${loggedInUser.name}!`);
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Login Failed', 'Please try again');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    console.log('Logout button pressed!'); // Debug log
    try {
      await AuthService.logout();
      setUser(null);
      Alert.alert('Logged Out', 'You have been logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const selectRole = (role: 'citizen' | 'official') => {
    console.log('Role selected:', role); // Debug log
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
          <Text style={styles.subtitle}>AI-Powered Disaster Management</Text>
          <Text style={styles.description}>
            Your safety is our priority. Complete disaster response solution.
          </Text>
          
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>🚀 Quick Demo Login</Text>
          </TouchableOpacity>
          
          <View style={styles.emergencyContainer}>
            <Text style={styles.emergencyTitle}>🆘 Emergency Numbers</Text>
            <Text style={styles.emergencyNumber}>Police: 100 | Fire: 101 | Ambulance: 108</Text>
            <Text style={styles.emergencyNumber}>National Emergency: 112 | Disaster: 1078</Text>
          </View>
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
            activeOpacity={0.8}
          >
            <Text style={styles.roleIcon}>👤</Text>
            <Text style={styles.buttonText}>Citizen</Text>
            <Text style={styles.roleDescription}>
              • Report incidents & emergencies{'\n'}
              • Receive disaster alerts{'\n'}
              • Find emergency facilities{'\n'}
              • Access safe routes
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.roleButton, styles.officialButton]}
            onPress={() => selectRole('official')}
            activeOpacity={0.8}
          >
            <Text style={styles.roleIcon}>🛡️</Text>
            <Text style={styles.buttonText}>Emergency Official</Text>
            <Text style={styles.roleDescription}>
              • Manage emergency responses{'\n'}
              • Verify incident reports{'\n'}
              • Broadcast alerts{'\n'}
              • Coordinate rescue operations
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Main App Dashboard
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>🎉 Welcome to SurakshaSetu!</Text>
          <Text style={styles.subtitle}>
            {user.role === 'citizen' ? '👤 Citizen Dashboard' : '🛡️ Official Command Center'}
          </Text>
          <Text style={styles.welcomeText}>
            Hello {user.name}, you're logged in as {user.role}.
          </Text>
        </View>
        
        <View style={styles.featureGrid}>
          {user.role === 'citizen' ? (
            <>
              <TouchableOpacity 
                style={styles.featureButton}
                onPress={() => Alert.alert('🚨 Alerts', 'Disaster alert system activated!\n\nFeatures:\n• Real-time notifications\n• Multi-language support\n• Severity indicators\n• Location-based alerts')}
              >
                <Text style={styles.featureIcon}>🚨</Text>
                <Text style={styles.featureText}>Disaster Alerts</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.featureButton}
                onPress={() => Alert.alert('📝 Report', 'Incident reporting system ready!\n\nFeatures:\n• Camera integration\n• GPS location\n• Photo evidence\n• Offline support')}
              >
                <Text style={styles.featureIcon}>📝</Text>
                <Text style={styles.featureText}>Report Incident</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.featureButton}
                onPress={() => Alert.alert('🗺️ Map', 'Interactive disaster map loaded!\n\nFeatures:\n• Danger zones\n• Safe routes\n• Real-time hazards\n• Facility locations')}
              >
                <Text style={styles.featureIcon}>🗺️</Text>
                <Text style={styles.featureText}>Danger Map</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.featureButton}
                onPress={() => Alert.alert('🏥 Facilities', 'Emergency facilities finder active!\n\nFeatures:\n• Nearby hospitals\n• Relief centers\n• Real-time capacity\n• Navigation support')}
              >
                <Text style={styles.featureIcon}>🏥</Text>
                <Text style={styles.featureText}>Emergency Facilities</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.featureButton, styles.sosButton]}
                onPress={() => Alert.alert('🆘 SOS ACTIVATED', 'Emergency SOS signal sent!\n\n✅ Location shared with authorities\n✅ Emergency contacts notified\n✅ Response team dispatched\n\nHelp is on the way!', [
                  { text: 'OK', style: 'default' }
                ])}
              >
                <Text style={styles.featureIcon}>🆘</Text>
                <Text style={styles.featureText}>SOS Emergency</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity 
                style={styles.featureButton}
                onPress={() => Alert.alert('📊 Dashboard', 'Analytics dashboard loaded!\n\nFeatures:\n• Incident heatmap\n• Response metrics\n• Real-time statistics\n• Trend analysis')}
              >
                <Text style={styles.featureIcon}>📊</Text>
                <Text style={styles.featureText}>Analytics</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.featureButton}
                onPress={() => Alert.alert('✅ Verify', 'Report verification system active!\n\nFeatures:\n• AI authenticity scoring\n• Image verification\n• Bulk processing\n• Status tracking')}
              >
                <Text style={styles.featureIcon}>✅</Text>
                <Text style={styles.featureText}>Verify Reports</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.featureButton}
                onPress={() => Alert.alert('📢 Broadcast', 'Alert broadcasting system ready!\n\nFeatures:\n• Geofenced alerts\n• Multi-language support\n• Severity targeting\n• Delivery tracking')}
              >
                <Text style={styles.featureIcon}>📢</Text>
                <Text style={styles.featureText}>Alert Broadcast</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.featureButton}
                onPress={() => Alert.alert('🆘 SOS Feed', 'Emergency SOS management active!\n\nFeatures:\n• Real-time SOS alerts\n• Response coordination\n• Status tracking\n• Priority management')}
              >
                <Text style={styles.featureIcon}>🆘</Text>
                <Text style={styles.featureText}>SOS Response</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.featureButton}
                onPress={() => Alert.alert('🚑 Dispatch', 'Emergency dispatch system online!\n\nFeatures:\n• Resource allocation\n• Team coordination\n• Route optimization\n• Status updates')}
              >
                <Text style={styles.featureIcon}>🚑</Text>
                <Text style={styles.featureText}>Emergency Dispatch</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutButtonText}>🚪 Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f9ff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#3730a3',
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 16,
    lineHeight: 24,
  },
  welcomeText: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 16,
  },
  loginButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 32,
    minWidth: 250,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  roleButton: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
    minWidth: 300,
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  citizenButton: {
    backgroundColor: '#2563eb',
  },
  officialButton: {
    backgroundColor: '#dc2626',
  },
  roleIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  roleDescription: {
    color: '#e2e8f0',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  emergencyContainer: {
    backgroundColor: '#fef2f2',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fca5a5',
    alignItems: 'center',
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 8,
  },
  emergencyNumber: {
    fontSize: 14,
    color: '#991b1b',
    textAlign: 'center',
    marginBottom: 4,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 32,
    maxWidth: 400,
  },
  featureButton: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    margin: 8,
    alignItems: 'center',
    width: 140,
    height: 120,
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sosButton: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
    borderWidth: 2,
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: '#6b7280',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});