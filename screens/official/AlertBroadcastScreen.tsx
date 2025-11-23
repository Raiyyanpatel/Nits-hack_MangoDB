import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
} from 'react-native';
import { User, DisasterAlert, AlertSeverity, DisasterType } from '../../types';
import SocketService from '../../services/SocketService';

interface AlertBroadcastScreenProps {
  user: User;
}

const AlertBroadcastScreen: React.FC<AlertBroadcastScreenProps> = ({ user }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<AlertSeverity | null>(null);
  const [selectedType, setSelectedType] = useState<DisasterType | null>(null);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['en']);
  const [radius, setRadius] = useState('5');
  const [isGeofenced, setIsGeofenced] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Connect to Socket.IO on component mount
  useEffect(() => {
    console.log('🔵 AlertBroadcastScreen mounted, attempting to connect...');
    
    const connectToSocket = async () => {
      try {
        console.log('🔌 Connecting to Socket.IO with user:', user.id);
        await SocketService.connect(user);
        setIsConnected(true);
        console.log('✅ AlertBroadcastScreen: Connected to Socket.IO');
        
        // Show success alert
        setTimeout(() => {
          Alert.alert(
            '✅ Connected',
            'Successfully connected to alert server',
            [{ text: 'OK' }]
          );
        }, 500);
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

    connectToSocket();

    return () => {
      // Cleanup on unmount
      console.log('🔴 AlertBroadcastScreen unmounting, disconnecting...');
      SocketService.disconnect();
    };
  }, [user]);

  const severityLevels: Array<{ value: AlertSeverity; label: string; color: any; icon: string }> = [
    { value: 'low', label: 'Low', color: styles.severityLow, icon: 'ℹ️' },
    { value: 'moderate', label: 'Moderate', color: styles.severityModerate, icon: '⚠️' },
    { value: 'high', label: 'High', color: styles.severityHigh, icon: '🔶' },
    { value: 'severe', label: 'Severe', color: styles.severitySevere, icon: '🚨' },
  ];

  const disasterTypes: Array<{ value: DisasterType; label: string; icon: string }> = [
    { value: 'flood', label: 'Flood', icon: '🌊' },
    { value: 'fire', label: 'Fire', icon: '🔥' },
    { value: 'earthquake', label: 'Earthquake', icon: '⚰️' },
    { value: 'landslide', label: 'Landslide', icon: '⛰️' },
    { value: 'cyclone', label: 'Cyclone', icon: '🌪️' },
    { value: 'other', label: 'Other', icon: '⚠️' },
  ];

  const availableLanguages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
    { code: 'mr', name: 'Marathi', flag: '🇮🇳' },
    { code: 'gu', name: 'Gujarati', flag: '🇮🇳' },
    { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
    { code: 'te', name: 'Telugu', flag: '🇮🇳' },
  ];

  const handleLanguageToggle = (langCode: string) => {
    setSelectedLanguages(prev => 
      prev.includes(langCode)
        ? prev.filter(l => l !== langCode)
        : [...prev, langCode]
    );
  };

  const handleBroadcast = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Error', 'Please fill in title and description');
      return;
    }

    if (!selectedSeverity) {
      Alert.alert('Error', 'Please select severity level');
      return;
    }

    if (!selectedType) {
      Alert.alert('Error', 'Please select disaster type');
      return;
    }

    if (!isConnected) {
      Alert.alert('Error', 'Not connected to server. Please check your connection.');
      return;
    }

    setIsBroadcasting(true);

    const alert: Partial<DisasterAlert> = {
      title: title.trim(),
      description: description.trim(),
      severity: selectedSeverity,
      type: selectedType,
      languages: selectedLanguages.reduce((acc, lang) => {
        acc[lang] = { title: title.trim(), description: description.trim() };
        return acc;
      }, {} as Record<string, { title: string; description: string }>),
      isActive: true,
      issuedAt: new Date(),
      radius: parseFloat(radius),
      location: {
        latitude: 19.0760,
        longitude: 72.8777,
      },
    };

    try {
      // Broadcast alert via Socket.IO
      const response = await SocketService.broadcastDisasterAlert(alert);
      
      setIsBroadcasting(false);

      Alert.alert(
        '✅ Alert Broadcast Successfully',
        `Alert sent to ${response.recipientCount} connected device(s)\n\nLanguages: ${selectedLanguages.length}\nRadius: ${radius}km`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setTitle('');
              setDescription('');
              setSelectedSeverity(null);
              setSelectedType(null);
              setSelectedLanguages(['en']);
              setRadius('5');
            }
          }
        ]
      );
    } catch (error: any) {
      setIsBroadcasting(false);
      console.error('Broadcast error:', error);
      Alert.alert(
        'Broadcast Failed',
        error.message || 'Failed to broadcast alert. Please check server connection.',
        [{ text: 'OK' }]
      );
    }
  };

  const getSeverityButtonStyle = (severity: AlertSeverity) => {
    return [
      styles.severityButton,
      selectedSeverity === severity && styles.severityButtonSelected,
      severityLevels.find(s => s.value === severity)?.color
    ];
  };

  const getTypeButtonStyle = (type: DisasterType) => {
    return [
      styles.typeButton,
      selectedType === type && styles.typeButtonSelected
    ];
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          Emergency Alert Broadcast
        </Text>

        {/* Alert Title */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Alert Title
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Enter alert title..."
            style={styles.textInput}
          />
        </View>

        {/* Alert Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Alert Description
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Enter detailed description..."
            multiline
            numberOfLines={4}
            style={[styles.textInput, styles.textArea]}
          />
        </View>

        {/* Severity Level */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Severity Level
          </Text>
          <View style={styles.severityGrid}>
            {severityLevels.map((severity) => (
              <TouchableOpacity
                key={severity.value}
                onPress={() => setSelectedSeverity(severity.value)}
                style={getSeverityButtonStyle(severity.value)}
              >
                <Text style={styles.severityIcon}>{severity.icon}</Text>
                <Text style={[
                  styles.severityText,
                  selectedSeverity === severity.value && styles.severityTextSelected
                ]}>
                  {severity.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Disaster Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Disaster Type
          </Text>
          <View style={styles.typeGrid}>
            {disasterTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                onPress={() => setSelectedType(type.value)}
                style={getTypeButtonStyle(type.value)}
              >
                <Text style={styles.typeIcon}>{type.icon}</Text>
                <Text style={[
                  styles.typeText,
                  selectedType === type.value && styles.typeTextSelected
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Geographic Targeting */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Geographic Targeting
          </Text>
          
          <View style={styles.geofenceToggle}>
            <TouchableOpacity
              onPress={() => setIsGeofenced(!isGeofenced)}
              style={[
                styles.toggleButton,
                isGeofenced && styles.toggleButtonActive
              ]}
            >
              <Text style={[
                styles.toggleText,
                isGeofenced && styles.toggleTextActive
              ]}>
                📍 Enable Geofencing
              </Text>
            </TouchableOpacity>
          </View>

          {isGeofenced && (
            <View style={styles.radiusContainer}>
              <Text style={styles.radiusLabel}>
                Broadcast Radius: {radius} km
              </Text>
              <View style={styles.radiusButtons}>
                {['1', '5', '10', '25', '50'].map((r) => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setRadius(r)}
                    style={[
                      styles.radiusButton,
                      radius === r && styles.radiusButtonSelected
                    ]}
                  >
                    <Text style={[
                      styles.radiusButtonText,
                      radius === r && styles.radiusButtonTextSelected
                    ]}>
                      {r}km
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Language Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Languages ({selectedLanguages.length} selected)
          </Text>
          <View style={styles.languageGrid}>
            {availableLanguages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                onPress={() => handleLanguageToggle(lang.code)}
                style={[
                  styles.languageButton,
                  selectedLanguages.includes(lang.code) && styles.languageButtonSelected
                ]}
              >
                <Text style={styles.languageFlag}>{lang.flag}</Text>
                <Text style={[
                  styles.languageText,
                  selectedLanguages.includes(lang.code) && styles.languageTextSelected
                ]}>
                  {lang.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Preview */}
        {title && description && selectedSeverity && selectedType && (
          <View style={styles.previewSection}>
            <Text style={styles.sectionTitle}>Alert Preview</Text>
            <View style={styles.previewCard}>
              <View style={styles.previewHeader}>
                <Text style={styles.previewSeverity}>
                  {severityLevels.find(s => s.value === selectedSeverity)?.icon} {selectedSeverity?.toUpperCase()}
                </Text>
                <Text style={styles.previewType}>
                  {disasterTypes.find(t => t.value === selectedType)?.icon} {selectedType?.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.previewTitle}>{title}</Text>
              <Text style={styles.previewDescription}>{description}</Text>
              <Text style={styles.previewMeta}>
                Languages: {selectedLanguages.join(', ')} | Radius: {radius}km
              </Text>
            </View>
          </View>
        )}

        {/* Connection Status */}
        <View style={styles.connectionStatus}>
          <View style={[styles.statusIndicator, isConnected ? styles.statusConnected : styles.statusDisconnected]} />
          <Text style={styles.statusText}>
            {isConnected ? '🟢 Connected to server' : '🔴 Not connected'}
          </Text>
        </View>

        {/* Broadcast Button */}
        <TouchableOpacity
          onPress={handleBroadcast}
          style={[
            styles.broadcastButton,
            (!title || !description || !selectedSeverity || !selectedType || !isConnected || isBroadcasting) && styles.broadcastButtonDisabled
          ]}
          disabled={!title || !description || !selectedSeverity || !selectedType || !isConnected || isBroadcasting}
        >
          <Text style={styles.broadcastButtonText}>
            {isBroadcasting ? '⏳ Broadcasting...' : '🚨 Broadcast Emergency Alert'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  severityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  severityButton: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  severityButtonSelected: {
    borderColor: '#374151',
  },
  severityLow: {
    backgroundColor: '#10B981',
  },
  severityModerate: {
    backgroundColor: '#F59E0B',
  },
  severityHigh: {
    backgroundColor: '#F97316',
  },
  severitySevere: {
    backgroundColor: '#EF4444',
  },
  severityIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  severityText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  severityTextSelected: {
    fontWeight: 'bold',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    minWidth: '30%',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  typeButtonSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EBF8FF',
  },
  typeIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  typeText: {
    color: '#374151',
    fontSize: 12,
  },
  typeTextSelected: {
    color: '#1D4ED8',
    fontWeight: 'bold',
  },
  geofenceToggle: {
    marginBottom: 16,
  },
  toggleButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  toggleButtonActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#EBF8FF',
  },
  toggleText: {
    color: '#374151',
    fontWeight: '500',
  },
  toggleTextActive: {
    color: '#1D4ED8',
  },
  radiusContainer: {
    marginTop: 16,
  },
  radiusLabel: {
    color: '#6B7280',
    marginBottom: 8,
  },
  radiusButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  radiusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  radiusButtonSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  radiusButtonText: {
    color: '#374151',
    fontSize: 14,
  },
  radiusButtonTextSelected: {
    color: '#FFFFFF',
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  languageButton: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  languageButtonSelected: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  languageFlag: {
    fontSize: 20,
    marginBottom: 4,
  },
  languageText: {
    color: '#374151',
    fontSize: 12,
  },
  languageTextSelected: {
    color: '#047857',
    fontWeight: 'bold',
  },
  previewSection: {
    marginBottom: 24,
  },
  previewCard: {
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 8,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  previewSeverity: {
    color: '#FEF3C7',
    fontSize: 12,
    fontWeight: 'bold',
  },
  previewType: {
    color: '#DBEAFE',
    fontSize: 12,
    fontWeight: 'bold',
  },
  previewTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  previewDescription: {
    color: '#E5E7EB',
    marginBottom: 8,
  },
  previewMeta: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  broadcastButton: {
    backgroundColor: '#DC2626',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 32,
  },
  broadcastButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  broadcastButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusConnected: {
    backgroundColor: '#10B981',
  },
  statusDisconnected: {
    backgroundColor: '#EF4444',
  },
  statusText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default AlertBroadcastScreen;