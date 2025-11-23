import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { User, SOSAlert, SOSStatus } from '../../types';

interface SOSFeedScreenProps {
  user: User;
}

const SOSFeedScreen: React.FC<SOSFeedScreenProps> = ({ user }) => {
  const [sosAlerts, setSosAlerts] = useState<SOSAlert[]>([]);
  const [filter, setFilter] = useState<'all' | SOSStatus>('all');

  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'acknowledged', label: 'Acknowledged' },
    { value: 'responding', label: 'Responding' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'false_alarm', label: 'False Alarm' },
  ] as const;

  useEffect(() => {
    loadSOSAlerts();
  }, []);

  const loadSOSAlerts = () => {
    // Mock SOS alerts data
    const mockAlerts: SOSAlert[] = [
      {
        id: 'SOS001',
        userId: 'citizen_001',
        location: {
          latitude: 19.0760,
          longitude: 72.8777,
          address: 'Andheri West, Mumbai',
        },
        timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        status: 'active',
      },
      {
        id: 'SOS002',
        userId: 'citizen_002',
        location: {
          latitude: 19.0896,
          longitude: 72.8656,
          address: 'Bandra East, Mumbai',
        },
        timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        status: 'responding',
        responderId: user.id,
        responseTime: new Date(Date.now() - 10 * 60 * 1000),
        notes: 'Fire department dispatched',
      },
      {
        id: 'SOS003',
        userId: 'citizen_003',
        location: {
          latitude: 19.1136,
          longitude: 72.8697,
          address: 'Powai, Mumbai',
        },
        timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
        status: 'resolved',
        responderId: 'responder_001',
        responseTime: new Date(Date.now() - 35 * 60 * 1000),
        notes: 'Medical emergency resolved, patient stable',
      },
    ];

    setSosAlerts(mockAlerts);
  };

  const filteredAlerts = sosAlerts.filter(alert => 
    filter === 'all' || alert.status === filter
  );

  const getStatusColor = (status: SOSStatus) => {
    switch (status) {
      case 'active': return styles.statusActive;
      case 'acknowledged': return styles.statusAcknowledged;
      case 'responding': return styles.statusResponding;
      case 'resolved': return styles.statusResolved;
      case 'false_alarm': return styles.statusFalseAlarm;
      default: return styles.statusDefault;
    }
  };

  const getPriorityColor = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes <= 5) return styles.priorityCritical;
    if (minutes <= 15) return styles.priorityHigh;
    if (minutes <= 30) return styles.priorityMedium;
    return styles.priorityLow;
  };

  const getFilterButtonStyle = (filterValue: typeof filter) => {
    return [
      styles.filterButton,
      filter === filterValue && styles.filterButtonActive
    ];
  };

  const getFilterTextStyle = (filterValue: typeof filter) => {
    return [
      styles.filterText,
      filter === filterValue && styles.filterTextActive
    ];
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m ago`;
    return `${minutes}m ago`;
  };

  const handleAcknowledge = (alertId: string) => {
    setSosAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, status: 'acknowledged' as SOSStatus, responderId: user.id }
        : alert
    ));
  };

  const handleRespond = (alertId: string) => {
    setSosAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { 
            ...alert, 
            status: 'responding' as SOSStatus, 
            responderId: user.id,
            responseTime: new Date()
          }
        : alert
    ));
  };

  const handleResolve = (alertId: string) => {
    Alert.prompt(
      'Mark as Resolved',
      'Please add notes about the resolution:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resolve',
          onPress: (notes?: string) => {
            setSosAlerts(prev => prev.map(alert => 
              alert.id === alertId 
                ? { 
                    ...alert, 
                    status: 'resolved' as SOSStatus,
                    notes: notes || 'Resolved without notes'
                  }
                : alert
            ));
          }
        }
      ]
    );
  };

  const handleMarkFalseAlarm = (alertId: string) => {
    Alert.alert(
      'Mark as False Alarm',
      'Are you sure this is a false alarm?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: () => {
            setSosAlerts(prev => prev.map(alert => 
              alert.id === alertId 
                ? { ...alert, status: 'false_alarm' as SOSStatus }
                : alert
            ));
          }
        }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => {} }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>
              SOS Emergency Feed
            </Text>
            <Text style={styles.headerSubtitle}>
              {filteredAlerts.length} alert(s) | {user.role?.replace('_', ' ')}
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={handleLogout}
            style={styles.logoutButton}
          >
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filterOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => setFilter(option.value)}
                style={getFilterButtonStyle(option.value)}
              >
                <Text style={getFilterTextStyle(option.value)}>
                  {option.label} ({
                    option.value === 'all' 
                      ? sosAlerts.length 
                      : sosAlerts.filter(a => a.status === option.value).length
                  })
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* SOS Alerts List */}
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.alertsContainer}>
          {filteredAlerts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No SOS alerts found
              </Text>
            </View>
          ) : (
            filteredAlerts.map((alert) => (
              <View 
                key={alert.id} 
                style={[styles.alertCard, getPriorityColor(alert.timestamp)]}
              >
                {/* Alert Header */}
                <View style={styles.alertHeader}>
                  <View style={styles.alertInfo}>
                    <Text style={styles.alertId}>
                      SOS Alert #{alert.id}
                    </Text>
                    <Text style={styles.alertTime}>
                      📅 {formatTimestamp(alert.timestamp)}
                    </Text>
                    <Text style={styles.alertUser}>
                      👤 User: {alert.userId}
                    </Text>
                  </View>

                  <View style={[styles.statusBadge, getStatusColor(alert.status)]}>
                    <Text style={styles.statusText}>
                      {alert.status.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Location */}
                <View style={styles.locationContainer}>
                  <Text style={styles.locationLabel}>
                    📍 Location:
                  </Text>
                  <Text style={styles.locationText}>
                    {alert.location.address || 
                     `${alert.location.latitude.toFixed(4)}, ${alert.location.longitude.toFixed(4)}`}
                  </Text>
                  <Text style={styles.coordinatesText}>
                    Coordinates: {alert.location.latitude.toFixed(6)}, {alert.location.longitude.toFixed(6)}
                  </Text>
                </View>

                {/* Response Info */}
                {alert.responderId && (
                  <View style={styles.responseContainer}>
                    <Text style={styles.responseTitle}>
                      🚨 Response Information
                    </Text>
                    {alert.responseTime && (
                      <Text style={styles.responseTime}>
                        Response Time: {formatTimestamp(alert.responseTime)}
                      </Text>
                    )}
                  </View>
                )}

                {/* Notes */}
                {alert.notes && (
                  <View style={styles.notesContainer}>
                    <Text style={styles.notesText}>
                      📝 {alert.notes}
                    </Text>
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  {alert.status === 'active' && (
                    <>
                      <TouchableOpacity
                        onPress={() => handleAcknowledge(alert.id)}
                        style={[styles.actionButton, styles.acknowledgeButton]}
                      >
                        <Text style={styles.actionButtonText}>
                          ✋ Acknowledge
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        onPress={() => handleRespond(alert.id)}
                        style={[styles.actionButton, styles.respondButton]}
                      >
                        <Text style={styles.actionButtonText}>
                          🚑 Respond
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        onPress={() => handleMarkFalseAlarm(alert.id)}
                        style={[styles.actionButton, styles.falseAlarmButton]}
                      >
                        <Text style={styles.actionButtonText}>
                          ❌ False Alarm
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {(alert.status === 'acknowledged' || alert.status === 'responding') && (
                    <>
                      <TouchableOpacity
                        onPress={() => handleResolve(alert.id)}
                        style={[styles.actionButton, styles.resolveButton]}
                      >
                        <Text style={styles.actionButtonText}>
                          ✅ Mark Resolved
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        onPress={() => handleMarkFalseAlarm(alert.id)}
                        style={[styles.actionButton, styles.falseAlarmButton]}
                      >
                        <Text style={styles.actionButtonText}>
                          ❌ False Alarm
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {(alert.status === 'resolved' || alert.status === 'false_alarm') && (
                    <TouchableOpacity style={styles.viewDetailsButton}>
                      <Text style={styles.viewDetailsButtonText}>
                        📋 View Full Details
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Emergency Actions Footer */}
      {filteredAlerts.some(a => a.status === 'active') && (
        <View style={styles.emergencyFooter}>
          <TouchableOpacity style={styles.emergencyButton}>
            <Text style={styles.emergencyButtonText}>
              🚨 EMERGENCY BROADCAST
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    color: '#6B7280',
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  filterContainer: {
    marginTop: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
  },
  alertsContainer: {
    padding: 16,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    borderRadius: 8,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#6B7280',
    fontSize: 18,
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  priorityCritical: {
    borderLeftColor: '#DC2626',
  },
  priorityHigh: {
    borderLeftColor: '#F97316',
  },
  priorityMedium: {
    borderLeftColor: '#EAB308',
  },
  priorityLow: {
    borderLeftColor: '#6B7280',
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  alertInfo: {
    flex: 1,
  },
  alertId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  alertTime: {
    color: '#6B7280',
    fontSize: 14,
  },
  alertUser: {
    color: '#6B7280',
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  statusActive: {
    backgroundColor: '#DC2626',
  },
  statusAcknowledged: {
    backgroundColor: '#F59E0B',
  },
  statusResponding: {
    backgroundColor: '#3B82F6',
  },
  statusResolved: {
    backgroundColor: '#10B981',
  },
  statusFalseAlarm: {
    backgroundColor: '#6B7280',
  },
  statusDefault: {
    backgroundColor: '#9CA3AF',
  },
  locationContainer: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  locationLabel: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  locationText: {
    color: '#374151',
    fontSize: 14,
  },
  coordinatesText: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 4,
  },
  responseContainer: {
    backgroundColor: '#EBF8FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  responseTitle: {
    color: '#1E40AF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  responseTime: {
    color: '#3B82F6',
    fontSize: 12,
  },
  notesContainer: {
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  notesText: {
    color: '#374151',
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: '45%',
  },
  acknowledgeButton: {
    backgroundColor: '#F59E0B',
  },
  respondButton: {
    backgroundColor: '#3B82F6',
  },
  resolveButton: {
    backgroundColor: '#10B981',
  },
  falseAlarmButton: {
    backgroundColor: '#6B7280',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  viewDetailsButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  viewDetailsButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 14,
  },
  emergencyFooter: {
    backgroundColor: '#DC2626',
    padding: 16,
  },
  emergencyButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  emergencyButtonText: {
    color: '#DC2626',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SOSFeedScreen;