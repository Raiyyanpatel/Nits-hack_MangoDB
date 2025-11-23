import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { User, OfflineQueue, IncidentReport, SOSAlert } from '../../types';

interface PendingQueueScreenProps {
  user: User;
}

const PendingQueueScreen: React.FC<PendingQueueScreenProps> = ({ user }) => {
  const [queue, setQueue] = useState<OfflineQueue>({
    reports: [],
    sosAlerts: [],
    lastSync: new Date(),
    pendingUploads: [],
  });
  const [isOnline, setIsOnline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadOfflineQueue();
    // TODO: Set up network listener
    setIsOnline(false); // Simulate offline mode for demo
  }, []);

  const loadOfflineQueue = () => {
    // Mock offline queue data
    const mockReports: IncidentReport[] = [
      {
        id: 'report_1',
        type: 'fire',
        description: 'Traffic accident at Marine Drive intersection',
        location: {
          latitude: 18.9220,
          longitude: 72.8347,
          address: 'Marine Drive, Mumbai',
        },
        userId: user.id,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        status: 'pending',
        media: [],
        isOffline: true,
      },
      {
        id: 'report_2',
        type: 'earthquake',
        description: 'Person collapsed on street - needs immediate medical attention',
        location: {
          latitude: 19.0760,
          longitude: 72.8777,
          address: 'Gateway of India, Mumbai',
        },
        userId: user.id,
        timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
        status: 'pending',
        media: [],
        isOffline: true,
      },
    ];

    const mockSOSAlerts: SOSAlert[] = [
      {
        id: 'sos_1',
        userId: user.id,
        location: {
          latitude: 19.0330,
          longitude: 72.8570,
          address: 'Worli, Mumbai',
        },
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        status: 'active',
      },
    ];

    setQueue({
      reports: mockReports,
      sosAlerts: mockSOSAlerts,
      lastSync: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      pendingUploads: [],
    });
  };

  const syncOfflineData = async () => {
    setIsSyncing(true);
    
    // TODO: Implement actual sync logic with backend
    setTimeout(() => {
      setQueue(prev => ({
        ...prev,
        reports: [],
        sosAlerts: [],
        lastSync: new Date(),
      }));
      setIsSyncing(false);
    }, 2000);
  };

  const removeQueueItem = (type: 'report' | 'sos', id: string) => {
    if (type === 'report') {
      setQueue(prev => ({
        ...prev,
        reports: prev.reports.filter(r => r.id !== id),
      }));
    } else {
      setQueue(prev => ({
        ...prev,
        sosAlerts: prev.sosAlerts.filter(s => s.id !== id),
      }));
    }
  };

  const getTimeAgo = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const hours = Math.floor(diff / (60 * 60 * 1000));
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
    
    if (hours > 0) return `${hours}h ${minutes}m ago`;
    return `${minutes}m ago`;
  };

  const logout = () => {
    // TODO: Implement logout logic
    console.log('Logout requested');
  };

  const totalPendingItems = queue.reports.length + queue.sosAlerts.length;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            Pending Queue ({totalPendingItems})
          </Text>
          <TouchableOpacity 
            onPress={logout}
            style={styles.logoutButton}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Connection Status */}
        {!isOnline && (
          <View style={styles.offlineNotice}>
            <Text style={styles.offlineText}>
              📡 Offline Mode - Data will sync when connection is restored
            </Text>
          </View>
        )}

        {/* Sync Controls */}
        <View style={styles.syncContainer}>
          <View style={styles.syncHeader}>
            <Text style={styles.syncTitle}>
              Offline Data Sync
            </Text>
            <TouchableOpacity 
              onPress={syncOfflineData}
              disabled={!isOnline || isSyncing}
              style={[
                styles.syncButton,
                (!isOnline || isSyncing) ? styles.syncButtonDisabled : styles.syncButtonActive
              ]}
            >
              <Text style={[
                styles.syncButtonText,
                (!isOnline || isSyncing) ? styles.syncButtonTextDisabled : styles.syncButtonTextActive
              ]}>
                {isSyncing ? '⏳ Syncing...' : '🔄 Sync Now'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.lastSyncText}>
            Last sync: {getTimeAgo(queue.lastSync)}
          </Text>
        </View>

        {/* Pending Reports */}
        {queue.reports.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Pending Reports ({queue.reports.length})
            </Text>
            {queue.reports.map((report) => (
              <View key={report.id} style={styles.reportCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.reportTitle}>
                    {report.type.charAt(0).toUpperCase() + report.type.slice(1)} Report
                  </Text>
                  <TouchableOpacity 
                    onPress={() => removeQueueItem('report', report.id)}
                    style={styles.removeButton}
                  >
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.reportDescription} numberOfLines={2}>
                  {report.description}
                </Text>
                
                <View style={styles.reportDetails}>
                  <Text style={styles.locationText}>
                    📍 {report.location.address}
                  </Text>
                  <Text style={styles.timeText}>
                    {getTimeAgo(report.timestamp)}
                  </Text>
                </View>
                
                <View style={styles.reportMeta}>
                  <Text style={styles.severityBadge}>
                    {report.type.toUpperCase()}
                  </Text>
                  <Text style={styles.statusText}>
                    Status: {report.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Pending SOS Alerts */}
        {queue.sosAlerts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Pending SOS Alerts ({queue.sosAlerts.length})
            </Text>
            {queue.sosAlerts.map((alert) => (
              <View key={alert.id} style={styles.sosCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.sosTitle}>
                    🚨 Emergency SOS Alert
                  </Text>
                  <TouchableOpacity 
                    onPress={() => removeQueueItem('sos', alert.id)}
                    style={styles.sosRemoveButton}
                  >
                    <Text style={styles.sosRemoveButtonText}>Remove</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.sosDetails}>
                  <Text style={styles.sosLocationText}>
                    📍 {alert.location.address}
                  </Text>
                  <Text style={styles.sosTimeText}>
                    {getTimeAgo(alert.timestamp)}
                  </Text>
                </View>
                
                <Text style={styles.sosStatusText}>
                  Status: {alert.status.toUpperCase()}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Empty State */}
        {totalPendingItems === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>✅</Text>
            <Text style={styles.emptyStateTitle}>
              All Caught Up!
            </Text>
            <Text style={styles.emptyStateDescription}>
              No pending reports or alerts in your queue.
            </Text>
          </View>
        )}

        {/* Help Section */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>
            💡 How Offline Queue Works
          </Text>
          <Text style={styles.helpText}>
            When you're offline, your reports and SOS alerts are saved locally and will automatically sync when internet connection is restored. This ensures no emergency information is lost.
          </Text>
        </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  logoutButton: {
    backgroundColor: '#6B7280',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  offlineNotice: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  offlineText: {
    color: '#B91C1C',
    textAlign: 'center',
    fontWeight: '500',
  },
  syncContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  syncHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  syncTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  syncButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  syncButtonActive: {
    backgroundColor: '#3B82F6',
  },
  syncButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  syncButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  syncButtonTextActive: {
    color: '#FFFFFF',
  },
  syncButtonTextDisabled: {
    color: '#6B7280',
  },
  lastSyncText: {
    color: '#6B7280',
    fontSize: 14,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  removeButton: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  removeButtonText: {
    color: '#DC2626',
    fontSize: 12,
  },
  reportDescription: {
    color: '#6B7280',
    marginBottom: 8,
  },
  reportDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    color: '#6B7280',
  },
  timeText: {
    fontSize: 14,
    color: '#6B7280',
  },
  reportMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  severityBadge: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  severityBadgeRed: {
    backgroundColor: '#FEE2E2',
    color: '#B91C1C',
  },
  severityBadgeOrange: {
    backgroundColor: '#FED7AA',
    color: '#C2410C',
  },
  severityBadgeYellow: {
    backgroundColor: '#FEF3C7',
    color: '#A16207',
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
  },
  sosCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  sosTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#B91C1C',
  },
  sosRemoveButton: {
    backgroundColor: '#FCA5A5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  sosRemoveButtonText: {
    color: '#7F1D1D',
    fontSize: 12,
  },
  sosDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sosLocationText: {
    fontSize: 14,
    color: '#7F1D1D',
  },
  sosTimeText: {
    fontSize: 14,
    color: '#7F1D1D',
  },
  sosStatusText: {
    color: '#DC2626',
    fontSize: 12,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 32,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  emptyStateIcon: {
    color: '#6B7280',
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyStateDescription: {
    color: '#6B7280',
    textAlign: 'center',
  },
  helpSection: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  helpTitle: {
    color: '#1E40AF',
    fontWeight: '500',
    marginBottom: 8,
  },
  helpText: {
    color: '#1D4ED8',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default PendingQueueScreen;