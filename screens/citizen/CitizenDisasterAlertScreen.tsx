import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { User, DisasterAlert, AlertSeverity } from '../../types';
import SocketService from '../../services/SocketService';

interface CitizenDisasterAlertScreenProps {
  user: User;
}

const CitizenDisasterAlertScreen: React.FC<CitizenDisasterAlertScreenProps> = ({ 
  user 
}) => {
  const [alerts, setAlerts] = useState<DisasterAlert[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    console.log('🔵 CitizenDisasterAlertScreen mounted, attempting to connect...');
    
    // Connect to Socket.IO and listen for alerts
    const initializeSocket = async () => {
      try {
        console.log('🔌 Connecting to Socket.IO with user:', user.id);
        await SocketService.connect(user);
        setIsConnected(true);
        console.log('✅ CitizenDisasterAlertScreen: Connected to Socket.IO');

        // Show success alert
        setTimeout(() => {
          Alert.alert(
            '✅ Connected',
            'Now receiving real-time disaster alerts',
            [{ text: 'OK' }]
          );
        }, 500);

        // Listen for disaster alerts
        SocketService.onDisasterAlert((alert: DisasterAlert) => {
          console.log('🚨 Received new alert:', alert.title);

          // Add to alerts list
          setAlerts(prevAlerts => [alert, ...prevAlerts]);

          // Show notification
          Alert.alert(
            '🚨 NEW DISASTER ALERT',
            `${alert.severity.toUpperCase()}: ${alert.title}\n\n${alert.description}`,
            [
              {
                text: 'Acknowledge',
                onPress: () => {
                  SocketService.acknowledgeAlert(alert.id, user.id);
                }
              }
            ],
            { cancelable: false }
          );
        });

      } catch (error: any) {
        console.error('❌ Failed to connect to Socket.IO:', error);
        setIsConnected(false);
        Alert.alert(
          '❌ Connection Failed',
          `Failed to connect to server at ${SocketService.getServerUrl()}\n\nError: ${error.message}\n\nPlease check:\n1. Server is running\n2. IP address is correct\n3. Same Wi-Fi network`,
          [{ text: 'OK' }]
        );
      }
    };

    initializeSocket();

    // Cleanup on unmount
    return () => {
      console.log('🔴 CitizenDisasterAlertScreen unmounting, disconnecting...');
      SocketService.offDisasterAlert();
      SocketService.disconnect();
    };
  }, [user]);

  const handleLanguageToggle = () => {
    setSelectedLanguage(prev => prev === 'en' ? 'hi' : 'en');
  };

  const handleEmergencyCall = () => {
    Alert.alert(
      'Emergency Call',
      'This will call emergency services. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => console.log('Calling 112...') },
      ]
    );
  };

  const getSeverityColor = (severity: AlertSeverity) => {
    switch (severity) {
      case 'severe': return '#dc2626';
      case 'high': return '#ea580c';
      case 'moderate': return '#d97706';
      case 'low': return '#059669';
      default: return '#6b7280';
    }
  };

  const getSeverityTextColor = (severity: AlertSeverity) => {
    switch (severity) {
      case 'severe': return '#dc2626';
      case 'high': return '#ea580c';
      case 'moderate': return '#d97706';
      case 'low': return '#059669';
      default: return '#6b7280';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            🚨 Disaster Alerts {selectedLanguage === 'en' ? '' : '(हिंदी)'}
          </Text>
          <TouchableOpacity
            onPress={handleLanguageToggle}
            style={styles.languageButton}
          >
            <Text style={styles.languageButtonText}>
              {selectedLanguage === 'en' ? 'हिं' : 'EN'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Connection Status */}
        <View style={[styles.connectionBanner, isConnected ? styles.connectionBannerConnected : styles.connectionBannerDisconnected]}>
          <Text style={styles.connectionBannerText}>
            {isConnected ? '🟢 Live: Receiving real-time alerts' : '🔴 Offline: Not connected to server'}
          </Text>
        </View>

        {/* Emergency Button */}
        <TouchableOpacity
          onPress={handleEmergencyCall}
          style={styles.emergencyButton}
        >
          <Text style={styles.emergencyButtonText}>
            📞 Emergency Hotline: 112
          </Text>
        </TouchableOpacity>

        {/* Alerts Section */}
        <Text style={styles.sectionTitle}>
          Active Alerts
        </Text>

        {alerts.length === 0 ? (
          <View style={styles.noAlertsContainer}>
            <Text style={styles.noAlertsText}>No active alerts</Text>
          </View>
        ) : (
          alerts.map((alert) => (
            <View key={alert.id} style={styles.alertCard}>
              {/* Alert Header */}
              <View style={[styles.alertHeader, { backgroundColor: getSeverityColor(alert.severity) }]}>
                <Text style={styles.alertHeaderText}>
                  {alert.severity.toUpperCase()} ALERT
                </Text>
              </View>

              {/* Alert Content */}
              <Text style={styles.alertTitle}>
                {alert.languages?.[selectedLanguage]?.title || alert.title}
              </Text>

              <Text style={styles.alertDescription}>
                {alert.languages?.[selectedLanguage]?.description || alert.description}
              </Text>

              {/* Alert Footer */}
              <View style={styles.alertFooter}>
                <Text style={[styles.alertSeverity, { color: getSeverityTextColor(alert.severity) }]}>
                  {alert.severity.toUpperCase()}
                </Text>
                {alert.expiresAt && (
                  <Text style={styles.alertExpiry}>
                    Expires: {alert.expiresAt.toLocaleDateString()}
                  </Text>
                )}
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  languageButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  languageButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  emergencyButton: {
    backgroundColor: '#dc2626',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  emergencyButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  noAlertsContainer: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  noAlertsText: {
    color: '#6b7280',
  },
  alertCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  alertHeader: {
    padding: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    marginHorizontal: -16,
    marginTop: -16,
    marginBottom: 16,
  },
  alertHeaderText: {
    color: '#ffffff',
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  alertDescription: {
    color: '#6b7280',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  alertSeverity: {
    fontWeight: '500',
  },
  alertExpiry: {
    fontSize: 14,
    color: '#6b7280',
  },
  connectionBanner: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  connectionBannerConnected: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  connectionBannerDisconnected: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  connectionBannerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
});

export default CitizenDisasterAlertScreen;