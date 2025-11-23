import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { User, HazardZone } from '../../types';

interface DangerZoneMapScreenProps {
  user: User;
}

const DangerZoneMapScreen: React.FC<DangerZoneMapScreenProps> = ({ user }) => {
  const [hazardZones, setHazardZones] = useState<HazardZone[]>([]);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    loadHazardZones();
    // TODO: Setup WebSocket connection for live updates
  }, []);

  const loadHazardZones = () => {
    // Mock hazard zone data
    const mockZones: HazardZone[] = [
      {
        id: '1',
        type: 'flood',
        severity: 'high',
        coordinates: [
          {
            latitude: 19.0760,
            longitude: 72.8777,
            address: 'South Mumbai Coastal Area',
          }
        ],
        lastUpdated: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        isActive: true,
      },
      {
        id: '2',
        type: 'landslide',
        severity: 'severe',
        coordinates: [
          {
            latitude: 19.0896,
            longitude: 72.8656,
            address: 'Malabar Hill Area',
          }
        ],
        lastUpdated: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        isActive: true,
      },
      {
        id: '3',
        type: 'fire',
        severity: 'moderate',
        coordinates: [
          {
            latitude: 19.0967,
            longitude: 72.8147,
            address: 'Andheri Industrial Area',
          }
        ],
        lastUpdated: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        isActive: true,
      },
    ];
    
    setHazardZones(mockZones);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe': return '#DC2626'; // red-600
      case 'high': return '#EA580C';   // orange-600
      case 'moderate': return '#D97706'; // amber-600
      default: return '#16A34A';       // green-600
    }
  };

  return (
    <View style={styles.container}>
      {/* Connection Status */}
      <View style={[styles.statusBar, { backgroundColor: isConnected ? '#DCFCE7' : '#FEE2E2' }]}>
        <Text style={[styles.statusText, { color: isConnected ? '#15803D' : '#DC2626' }]}>
          {isConnected ? 'Live Data Connected' : 'Offline Mode'}
        </Text>
      </View>

      {/* Main Map Area (Placeholder) */}
      <View style={styles.mapContainer}>
        <Text style={styles.mapIcon}>🗺️</Text>
        <Text style={styles.mapTitle}>
          Interactive Danger Zone Map
        </Text>
        <Text style={styles.mapSubtitle}>
          Real-time hazard zones and safety information would appear here with map integration
        </Text>

        {/* Legend */}
        <View style={styles.legendContainer}>
          <Text style={styles.legendTitle}>Legend</Text>
          <View>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: '#DC2626' }]} />
              <Text style={styles.legendText}>Severe Danger</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: '#EA580C' }]} />
              <Text style={styles.legendText}>High Risk</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: '#D97706' }]} />
              <Text style={styles.legendText}>Moderate Risk</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: '#16A34A' }]} />
              <Text style={styles.legendText}>Safe Zone</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Hazard Zone Information */}
      <View style={styles.infoContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.infoTitle}>
            Active Hazard Zones ({hazardZones.length})
          </Text>
          <TouchableOpacity 
            onPress={loadHazardZones}
            style={styles.refreshButton}
          >
            <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
          </TouchableOpacity>
        </View>

        {hazardZones.length === 0 ? (
          <Text style={styles.noDataText}>
            No active hazard zones in your area
          </Text>
        ) : (
          <View>
            {hazardZones.map((zone, index) => (
              <View key={zone.id} style={styles.zoneCard}>
                <View
                  style={[
                    styles.severityIndicator,
                    { backgroundColor: getSeverityColor(zone.severity) }
                  ]}
                />
                <View style={styles.zoneInfo}>
                  <Text style={styles.zoneType}>
                    {zone.type.charAt(0).toUpperCase() + zone.type.slice(1)} - {zone.severity.charAt(0).toUpperCase() + zone.severity.slice(1)}
                  </Text>
                  <Text style={styles.zoneDescription}>
                    {zone.coordinates[0]?.address || 'Location not specified'}
                  </Text>
                </View>
              </View>
            ))}

            {hazardZones.length > 0 && (
              <Text style={styles.updateInfo}>
                Last updated: {Math.floor((Date.now() - hazardZones[0].lastUpdated.getTime()) / (60 * 1000))} minutes ago
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Emergency Actions */}
      <View style={styles.emergencyContainer}>
        <View style={styles.emergencyRow}>
          <TouchableOpacity style={[styles.emergencyButton, styles.emergencyButtonRed]}>
            <Text style={styles.emergencyButtonText}>
              🚨 Report Emergency
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.emergencyButton, styles.emergencyButtonOrange]}>
            <Text style={styles.emergencyButtonText}>
              📍 Find Safe Route
            </Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.emergencyWarning}>
          Only use emergency features during actual emergencies
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  statusBar: {
    padding: 12,
  },
  statusText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapIcon: {
    color: '#6B7280',
    fontSize: 60,
    marginBottom: 16,
  },
  mapTitle: {
    color: '#374151',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  mapSubtitle: {
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  legendContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  legendTitle: {
    color: '#1F2937',
    fontWeight: '600',
    marginBottom: 12,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  legendText: {
    fontSize: 14,
    color: '#374151',
  },
  infoContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  refreshButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  noDataText: {
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 16,
  },
  zoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  severityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  zoneInfo: {
    flex: 1,
  },
  zoneType: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    textTransform: 'capitalize',
  },
  zoneDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  updateInfo: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    paddingTop: 8,
  },
  emergencyContainer: {
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#FCA5A5',
  },
  emergencyRow: {
    flexDirection: 'row',
    gap: 12,
  },
  emergencyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emergencyButtonRed: {
    backgroundColor: '#DC2626',
  },
  emergencyButtonOrange: {
    backgroundColor: '#EA580C',
  },
  emergencyButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '500',
  },
  emergencyWarning: {
    color: '#B91C1C',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default DangerZoneMapScreen;