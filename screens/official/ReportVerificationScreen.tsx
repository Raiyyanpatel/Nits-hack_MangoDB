import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { User, IncidentReport, ReportStatus } from '../../types';

interface ReportVerificationScreenProps {
  user: User;
}

const ReportVerificationScreen: React.FC<ReportVerificationScreenProps> = ({ 
  user 
}) => {
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [filter, setFilter] = useState<'all' | ReportStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filterOptions = [
    { value: 'all', label: 'All', count: 0 },
    { value: 'pending', label: 'Pending', count: 0 },
    { value: 'verified', label: 'Verified', count: 0 },
    { value: 'investigating', label: 'Investigating', count: 0 },
    { value: 'rejected', label: 'Rejected', count: 0 },
  ] as const;

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = () => {
    // Mock reports data
    const mockReports: IncidentReport[] = [
      {
        id: '1',
        userId: 'citizen_1',
        type: 'flood',
        description: 'Severe waterlogging in residential area near shopping complex. Water level approximately 2-3 feet.',
        location: {
          latitude: 19.0760,
          longitude: 72.8777,
          address: 'Andheri West, Mumbai, Maharashtra 400058',
        },
        media: [],
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        status: 'pending',
        aiScore: 87,
      },
      {
        id: '2',
        userId: 'citizen_2',
        type: 'fire',
        description: 'Small fire in commercial building, smoke visible from street level.',
        location: {
          latitude: 19.0896,
          longitude: 72.8656,
          address: 'Bandra East, Mumbai, Maharashtra 400051',
        },
        media: [],
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        status: 'investigating',
        aiScore: 92,
      },
      {
        id: '3',
        userId: 'citizen_3',
        type: 'earthquake',
        description: 'Felt tremors for about 10-15 seconds. Buildings swayed slightly.',
        location: {
          latitude: 19.1136,
          longitude: 72.8697,
          address: 'Powai, Mumbai, Maharashtra 400076',
        },
        media: [],
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        status: 'verified',
        aiScore: 78,
      },
    ];

    setReports(mockReports);
  };

  const filteredReports = reports.filter(report => {
    const matchesFilter = filter === 'all' || report.status === filter;
    const matchesSearch = searchQuery === '' || 
      report.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (report.location.address && report.location.address.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesFilter && matchesSearch;
  });

  const getAIScoreColor = (score: number) => {
    if (score >= 90) return styles.aiScoreHigh;
    if (score >= 70) return styles.aiScoreMedium;
    return styles.aiScoreLow;
  };

  const handleVerifyReport = (reportId: string) => {
    setReports(prev => prev.map(report => 
      report.id === reportId 
        ? { ...report, status: 'verified' as ReportStatus }
        : report
    ));
  };

  const handleInvestigateReport = (reportId: string) => {
    setReports(prev => prev.map(report => 
      report.id === reportId 
        ? { ...report, status: 'investigating' as ReportStatus }
        : report
    ));
  };

  const handleRejectReport = (reportId: string) => {
    setReports(prev => prev.map(report => 
      report.id === reportId 
        ? { ...report, status: 'rejected' as ReportStatus }
        : report
    ));
  };

  const getStatusBadgeStyle = (status: ReportStatus) => {
    switch (status) {
      case 'pending': return { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' };
      case 'verified': return { backgroundColor: '#D1FAE5', borderColor: '#10B981' };
      case 'investigating': return { backgroundColor: '#DBEAFE', borderColor: '#3B82F6' };
      case 'rejected': return { backgroundColor: '#FEE2E2', borderColor: '#EF4444' };
      default: return { backgroundColor: '#F3F4F6', borderColor: '#6B7280' };
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Report Verification</Text>
        
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search reports..."
          style={styles.searchInput}
        />
        
        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filterOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => setFilter(option.value)}
                style={[
                  styles.filterTab,
                  filter === option.value && styles.filterTabActive
                ]}
              >
                <Text style={[
                  styles.filterTabText,
                  filter === option.value && styles.filterTabTextActive
                ]}>
                  {option.label} ({
                    option.value === 'all' 
                      ? reports.length 
                      : reports.filter(r => r.status === option.value).length
                  })
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Reports List */}
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.reportsContainer}>
          {filteredReports.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No reports found</Text>
            </View>
          ) : (
            filteredReports.map((report) => (
              <View key={report.id} style={styles.reportCard}>
                {/* Report Header */}
                <View style={styles.reportHeader}>
                  <View style={styles.reportInfo}>
                    <Text style={styles.reportType}>
                      {report.type} - Report #{report.id}
                    </Text>
                    <Text style={styles.reportDescription}>
                      {report.description}
                    </Text>
                  </View>

                  <View style={styles.reportMeta}>
                    <View style={[styles.statusBadge, getStatusBadgeStyle(report.status)]}>
                      <Text style={styles.statusText}>
                        {report.status}
                      </Text>
                    </View>

                    {report.aiScore && (
                      <View style={styles.aiScoreContainer}>
                        <Text style={styles.aiScoreLabel}>AI Score:</Text>
                        <Text style={[styles.aiScoreValue, getAIScoreColor(report.aiScore)]}>
                          {report.aiScore}%
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Location */}
                <View style={styles.locationContainer}>
                  <Text style={styles.locationText}>
                    📍 {report.location.address}
                  </Text>
                </View>

                {/* AI Analysis (if available) */}
                {report.aiScore && (
                  <View style={styles.aiAnalysisContainer}>
                    <Text style={styles.aiAnalysisTitle}>
                      🤖 AI Analysis
                    </Text>
                    {report.aiScore >= 80 && (
                      <Text style={styles.aiAnalysisNote}>
                        High confidence score - report appears authentic
                      </Text>
                    )}
                  </View>
                )}

                {/* Action Buttons */}
                {report.status === 'pending' && (
                  <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity
                      onPress={() => handleVerifyReport(report.id)}
                      style={[styles.actionButton, styles.verifyButton]}
                    >
                      <Text style={styles.actionButtonText}>
                        ✅ Verify
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={() => handleInvestigateReport(report.id)}
                      style={[styles.actionButton, styles.investigateButton]}
                    >
                      <Text style={styles.actionButtonText}>
                        🔍 Investigate
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={() => handleRejectReport(report.id)}
                      style={[styles.actionButton, styles.rejectButton]}
                    >
                      <Text style={styles.actionButtonText}>
                        ❌ Reject
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {report.status === 'investigating' && (
                  <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity
                      onPress={() => handleVerifyReport(report.id)}
                      style={[styles.actionButton, styles.verifyButton]}
                    >
                      <Text style={styles.actionButtonText}>
                        ✅ Mark Verified
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={() => handleRejectReport(report.id)}
                      style={[styles.actionButton, styles.rejectButton]}
                    >
                      <Text style={styles.actionButtonText}>
                        ❌ Mark False
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  filterContainer: {
    marginTop: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  filterTabActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterTabText: {
    fontSize: 14,
    color: '#374151',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
  },
  reportsContainer: {
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
  reportCard: {
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
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportType: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  reportDescription: {
    color: '#6B7280',
    fontSize: 14,
  },
  reportMeta: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  aiScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  aiScoreLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 4,
  },
  aiScoreValue: {
    fontSize: 12,
    fontWeight: '600',
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
  locationContainer: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  locationText: {
    color: '#6B7280',
    fontSize: 14,
  },
  aiAnalysisContainer: {
    backgroundColor: '#EBF8FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  aiAnalysisTitle: {
    color: '#1E40AF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  aiAnalysisNote: {
    color: '#3B82F6',
    fontSize: 12,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  verifyButton: {
    backgroundColor: '#10B981',
  },
  investigateButton: {
    backgroundColor: '#3B82F6',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ReportVerificationScreen;