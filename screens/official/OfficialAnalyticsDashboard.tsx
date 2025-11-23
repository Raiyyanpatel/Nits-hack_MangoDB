import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { User, IncidentReport, SOSAlert } from '../../types';

interface OfficialAnalyticsDashboardProps {
  user: User;
}

const OfficialAnalyticsDashboard: React.FC<OfficialAnalyticsDashboardProps> = ({ 
  user 
}) => {
  const [stats, setStats] = useState({
    totalReports: 0,
    activeAlerts: 0,
    activeSOS: 0,
    pendingReports: 0,
    resolvedToday: 0,
  });
  const [recentIncidents, setRecentIncidents] = useState<IncidentReport[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    // Mock dashboard statistics
    setStats({
      totalReports: 1247,
      activeAlerts: 23,
      activeSOS: 8,
      pendingReports: 156,
      resolvedToday: 89,
    });

    // Mock recent incidents
    const mockIncidents: IncidentReport[] = [
      {
        id: 'INC001',
        userId: 'user_001',
        type: 'flood',
        description: 'Severe flooding in coastal residential area, multiple families stranded',
        location: {
          latitude: 19.0760,
          longitude: 72.8777,
          address: 'Marine Drive, Mumbai',
        },
        media: [],
        timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        status: 'pending',
        aiScore: 92,
      },
      {
        id: 'INC002',
        userId: 'user_002',
        type: 'fire',
        description: 'Building fire reported in commercial district',
        location: {
          latitude: 19.0896,
          longitude: 72.8656,
          address: 'Bandra West, Mumbai',
        },
        media: [],
        timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
        status: 'investigating',
        aiScore: 87,
      },
      {
        id: 'INC003',
        userId: 'user_003',
        type: 'earthquake',
        description: 'Minor tremors felt across multiple sectors',
        location: {
          latitude: 19.1136,
          longitude: 72.8697,
          address: 'Andheri East, Mumbai',
        },
        media: [],
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        status: 'verified',
        aiScore: 78,
      },
    ];

    setRecentIncidents(mockIncidents);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return styles.statusPending;
      case 'investigating': return styles.statusInvestigating;
      case 'verified': return styles.statusVerified;
      case 'resolved': return styles.statusResolved;
      default: return styles.statusDefault;
    }
  };

  const getAIScoreColor = (score: number) => {
    if (score >= 90) return styles.aiScoreHigh;
    if (score >= 70) return styles.aiScoreMedium;
    return styles.aiScoreLow;
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m ago`;
    return `${minutes}m ago`;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            Emergency Command Center
          </Text>
          <Text style={styles.headerSubtitle}>
            {user.role?.replace('_', ' ') || 'Official'} Dashboard
          </Text>
        </View>

        {/* Statistics Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {stats.totalReports}
            </Text>
            <Text style={styles.statLabel}>Total Reports</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={[styles.statNumber, styles.statNumberRed]}>
              {stats.activeSOS}
            </Text>
            <Text style={styles.statLabel}>Active SOS</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={[styles.statNumber, styles.statNumberYellow]}>
              {stats.pendingReports}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={[styles.statNumber, styles.statNumberGreen]}>
              {stats.resolvedToday}
            </Text>
            <Text style={styles.statLabel}>Resolved Today</Text>
          </View>
        </View>

        {/* Live Heatmap */}
        <View style={styles.heatmapContainer}>
          <Text style={styles.sectionTitle}>
            Live Incident Heatmap
          </Text>

          <View style={styles.heatmapPlaceholder}>
            <Text style={styles.heatmapIcon}>🗺️</Text>
            <Text style={styles.heatmapText}>Live Incident Heatmap</Text>
            <Text style={styles.heatmapSubtext}>(Mapbox integration)</Text>
          </View>

          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendDotRed]} />
              <Text style={styles.legendText}>High Priority</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendDotYellow]} />
              <Text style={styles.legendText}>Medium</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendDotGreen]} />
              <Text style={styles.legendText}>Low Priority</Text>
            </View>
          </View>
        </View>

        {/* Recent Incidents */}
        <View style={styles.recentIncidentsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Recent Incidents
            </Text>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllButtonText}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentIncidents.map((incident) => (
            <View key={incident.id} style={styles.incidentCard}>
              <View style={styles.incidentHeader}>
                <View style={styles.incidentInfo}>
                  <Text style={styles.incidentType}>
                    {incident.type} - {incident.id}
                  </Text>
                  <Text style={styles.incidentDescription}>
                    {incident.description}
                  </Text>
                </View>

                <View style={styles.incidentMeta}>
                  <View style={[styles.statusBadge, getStatusColor(incident.status)]}>
                    <Text style={styles.statusText}>
                      {incident.status}
                    </Text>
                  </View>

                  {incident.aiScore && (
                    <Text style={[styles.aiScore, getAIScoreColor(incident.aiScore)]}>
                      AI: {incident.aiScore}%
                    </Text>
                  )}
                </View>
              </View>

              <Text style={styles.incidentLocation}>
                📍 {incident.location.address}
              </Text>

              <Text style={styles.incidentTimestamp}>
                ⏰ {formatTimestamp(incident.timestamp)}
              </Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonIcon}>🚨</Text>
              <Text style={styles.actionButtonText}>Broadcast Alert</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonIcon}>✅</Text>
              <Text style={styles.actionButtonText}>Verify Reports</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonIcon}>🆘</Text>
              <Text style={styles.actionButtonText}>SOS Response</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonIcon}>📊</Text>
              <Text style={styles.actionButtonText}>Full Analytics</Text>
            </TouchableOpacity>
          </View>
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
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    flex: 1,
    minWidth: '45%',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  statNumberRed: {
    color: '#DC2626',
  },
  statNumberYellow: {
    color: '#D97706',
  },
  statNumberGreen: {
    color: '#16A34A',
  },
  statLabel: {
    color: '#6B7280',
    fontSize: 14,
  },
  heatmapContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  heatmapPlaceholder: {
    height: 160,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heatmapIcon: {
    color: '#6B7280',
    fontSize: 48,
    marginBottom: 8,
  },
  heatmapText: {
    color: '#6B7280',
  },
  heatmapSubtext: {
    color: '#6B7280',
    fontSize: 14,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendDotRed: {
    backgroundColor: '#DC2626',
  },
  legendDotYellow: {
    backgroundColor: '#EAB308',
  },
  legendDotGreen: {
    backgroundColor: '#16A34A',
  },
  legendText: {
    fontSize: 14,
    color: '#6B7280',
  },
  recentIncidentsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  viewAllButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  incidentCard: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 12,
    marginBottom: 12,
  },
  incidentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  incidentInfo: {
    flex: 1,
  },
  incidentType: {
    fontWeight: '600',
    color: '#1F2937',
    textTransform: 'capitalize',
  },
  incidentDescription: {
    color: '#6B7280',
    fontSize: 14,
  },
  incidentMeta: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusInvestigating: {
    backgroundColor: '#DBEAFE',
  },
  statusVerified: {
    backgroundColor: '#D1FAE5',
  },
  statusResolved: {
    backgroundColor: '#F3F4F6',
  },
  statusDefault: {
    backgroundColor: '#F3F4F6',
  },
  aiScore: {
    fontSize: 12,
    marginTop: 4,
  },
  aiScoreHigh: {
    color: '#16A34A',
  },
  aiScoreMedium: {
    color: '#D97706',
  },
  aiScoreLow: {
    color: '#DC2626',
  },
  incidentLocation: {
    color: '#6B7280',
    fontSize: 14,
    marginBottom: 4,
  },
  incidentTimestamp: {
    color: '#6B7280',
    fontSize: 12,
  },
  quickActionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
  },
  actionButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionButtonText: {
    color: '#374151',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default OfficialAnalyticsDashboard;