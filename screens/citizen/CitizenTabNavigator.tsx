import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { User } from '../../types';

// Import citizen screens
import CitizenDisasterAlertScreen from './CitizenDisasterAlertScreen';
import ReportIncidentScreen from './ReportIncidentScreen';
import FacilitiesScreen from './FacilitiesScreen';
import DangerZoneMapScreen from './DangerZoneMapScreen';
import PendingQueueScreen from './PendingQueueScreen';

// Import SOS Button
import SOSButton from '../../components/SOSButton';

const Tab = createBottomTabNavigator();

interface CitizenTabNavigatorProps {
  user: User;
  onLogout: () => void;
}

const CitizenTabNavigator: React.FC<CitizenTabNavigatorProps> = ({ 
  user, 
  onLogout 
}) => {
  const handleSOSPress = () => {
    Alert.alert(
      '🚨 Emergency SOS',
      'This will send your location and emergency alert to authorities. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send SOS', 
          style: 'destructive',
          onPress: () => {
            // Implement SOS functionality
            Alert.alert('SOS Sent', 'Emergency services have been notified!');
          }
        },
      ]
    );
  };

  const TabBarIcon = ({ icon, focused }: { icon: string; focused: boolean }) => (
    <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>
      {icon}
    </Text>
  );

  const TabBarLabel = ({ label, focused }: { label: string; focused: boolean }) => (
    <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
      {label}
    </Text>
  );

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: '#3b82f6',
          tabBarInactiveTintColor: '#6b7280',
        }}
      >
        <Tab.Screen
          name="Alerts"
          options={{
            tabBarIcon: ({ focused }) => <TabBarIcon icon="🚨" focused={focused} />,
            tabBarLabel: ({ focused }) => <TabBarLabel label="Alerts" focused={focused} />,
          }}
        >
          {() => <CitizenDisasterAlertScreen user={user} />}
        </Tab.Screen>

        <Tab.Screen
          name="Report"
          options={{
            tabBarIcon: ({ focused }) => <TabBarIcon icon="📝" focused={focused} />,
            tabBarLabel: ({ focused }) => <TabBarLabel label="Report" focused={focused} />,
          }}
        >
          {() => <ReportIncidentScreen user={user} />}
        </Tab.Screen>

        <Tab.Screen
          name="Map"
          options={{
            tabBarIcon: ({ focused }) => <TabBarIcon icon="🗺️" focused={focused} />,
            tabBarLabel: ({ focused }) => <TabBarLabel label="Map" focused={focused} />,
          }}
        >
          {() => <DangerZoneMapScreen user={user} />}
        </Tab.Screen>

        <Tab.Screen
          name="Facilities"
          options={{
            tabBarIcon: ({ focused }) => <TabBarIcon icon="🏥" focused={focused} />,
            tabBarLabel: ({ focused }) => <TabBarLabel label="Facilities" focused={focused} />,
          }}
        >
          {() => <FacilitiesScreen user={user} />}
        </Tab.Screen>

        <Tab.Screen
          name="Queue"
          options={{
            tabBarIcon: ({ focused }) => <TabBarIcon icon="📥" focused={focused} />,
            tabBarLabel: ({ focused }) => <TabBarLabel label="Queue" focused={focused} />,
          }}
        >
          {() => <PendingQueueScreen user={user} />}
        </Tab.Screen>
      </Tab.Navigator>

      {/* Floating SOS Button */}
      <TouchableOpacity 
        style={styles.sosButton}
        onPress={handleSOSPress}
        activeOpacity={0.8}
      >
        <Text style={styles.sosText}>SOS</Text>
      </TouchableOpacity>

      {/* Header with logout */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Welcome, {user.name || 'Citizen'}
        </Text>
        <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    height: 80,
    paddingBottom: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  tabIconActive: {
    fontSize: 22,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  tabLabelActive: {
    fontWeight: '600',
  },
  sosButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000,
  },
  sosText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    zIndex: 100,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ef4444',
    borderRadius: 6,
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default CitizenTabNavigator;