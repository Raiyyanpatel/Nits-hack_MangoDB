import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { User } from '../../types';

// Official Screens
import OfficialAnalyticsDashboard from './OfficialAnalyticsDashboard';
import ReportVerificationScreen from './ReportVerificationScreen';
import AlertBroadcastScreen from './AlertBroadcastScreen';
import SOSFeedScreen from './SOSFeedScreen';

interface OfficialTabNavigatorProps {
  user: User;
  onLogout: () => void;
}

type TabName = 'Dashboard' | 'Verify' | 'Broadcast' | 'SOS';

const OfficialTabNavigator: React.FC<OfficialTabNavigatorProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<TabName>('Dashboard');

  const tabs = [
    { name: 'Dashboard' as TabName, icon: '📊', label: 'Dashboard' },
    { name: 'Verify' as TabName, icon: '✅', label: 'Verify' },
    { name: 'Broadcast' as TabName, icon: '📢', label: 'Broadcast' },
    { name: 'SOS' as TabName, icon: '🆘', label: 'SOS Feed' },
  ];

  const renderScreen = () => {
    switch (activeTab) {
      case 'Dashboard':
        return <OfficialAnalyticsDashboard user={user} />;
      case 'Verify':
        return <ReportVerificationScreen user={user} />;
      case 'Broadcast':
        return <AlertBroadcastScreen user={user} />;
      case 'SOS':
        return <SOSFeedScreen user={user} />;
      default:
        return <OfficialAnalyticsDashboard user={user} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {renderScreen()}
      </View>
      
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.name}
            style={styles.tabItem}
            onPress={() => setActiveTab(tab.name)}
          >
            <Text style={[
              styles.tabIcon,
              { color: activeTab === tab.name ? '#ef4444' : '#6b7280' }
            ]}>
              {tab.icon}
            </Text>
            <Text style={[
              styles.tabLabel,
              { color: activeTab === tab.name ? '#ef4444' : '#6b7280' }
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingBottom: 20,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
});

export default OfficialTabNavigator;