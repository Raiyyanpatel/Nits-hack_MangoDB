import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { User, Facility, FacilityType } from '../../types';

interface FacilitiesScreenProps {
  user: User;
}

const FacilitiesScreen: React.FC<FacilitiesScreenProps> = ({ user }) => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<FacilityType | 'all'>('all');

  const facilityTypes = [
    { type: 'all' as const, label: 'All', icon: '🏢' },
    { type: 'hospital' as const, label: 'Hospitals', icon: '🏥' },
    { type: 'shelter' as const, label: 'Shelters', icon: '🏠' },
    { type: 'relief_camp' as const, label: 'Relief Camps', icon: '⛺' },
    { type: 'fire_station' as const, label: 'Fire Station', icon: '🚒' },
    { type: 'police_station' as const, label: 'Police Station', icon: '🚔' },
  ];

  useEffect(() => {
    // Mock facilities data
    const mockFacilities: Facility[] = [
      {
        id: '1',
        name: 'City General Hospital',
        type: 'hospital',
        location: {
          latitude: 19.0760,
          longitude: 72.8777,
          address: '123 Main St, Mumbai',
        },
        contact: '+91-22-12345678',
        capacity: 500,
        currentOccupancy: 320,
        services: ['Emergency Care', 'Surgery', 'ICU'],
        isActive: true,
      },
      {
        id: '2',
        name: 'Emergency Shelter Center',
        type: 'shelter',
        location: {
          latitude: 19.0800,
          longitude: 72.8800,
          address: '456 Relief Ave, Mumbai',
        },
        contact: '+91-22-87654321',
        capacity: 200,
        currentOccupancy: 85,
        services: ['Food', 'Temporary Housing', 'Medical Aid'],
        isActive: true,
      },
    ];
    
    setFacilities(mockFacilities);
  }, []);

  const filteredFacilities = facilities.filter(facility => {
    const matchesSearch = facility.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         facility.location.address?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || facility.type === selectedType;
    return matchesSearch && matchesType;
  });

  const getOccupancyColor = (occupancy: number, capacity: number) => {
    const percentage = (occupancy / capacity) * 100;
    if (percentage < 50) return '#10b981';
    if (percentage < 80) return '#f59e0b';
    return '#ef4444';
  };

  const getOccupancyStatus = (occupancy: number, capacity: number) => {
    const percentage = (occupancy / capacity) * 100;
    if (percentage < 50) return 'Available';
    if (percentage < 80) return 'Limited';
    return 'Full';
  };

  return (
    <View style={styles.container}>
      {/* Header with Search */}
      <View style={styles.header}>
        <Text style={styles.title}>Emergency Facilities</Text>
        
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search facilities..."
          style={styles.searchInput}
        />
        
        {/* Filter Buttons */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
        >
          {facilityTypes.map((type) => (
            <TouchableOpacity
              key={type.type}
              onPress={() => setSelectedType(type.type)}
              style={[
                styles.filterButton,
                selectedType === type.type && styles.filterButtonActive
              ]}
            >
              <Text style={styles.filterIcon}>{type.icon}</Text>
              <Text style={[
                styles.filterLabel,
                selectedType === type.type && styles.filterLabelActive
              ]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Facilities List */}
      <ScrollView style={styles.facilitiesList}>
        {filteredFacilities.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {searchQuery ? 'No facilities found matching your search' : 'No facilities available'}
            </Text>
          </View>
        ) : (
          filteredFacilities.map((facility) => (
            <View key={facility.id} style={styles.facilityCard}>
              {/* Facility Header */}
              <View style={styles.facilityHeader}>
                <Text style={styles.facilityIcon}>
                  {facilityTypes.find(t => t.type === facility.type)?.icon}
                </Text>
                <View style={styles.facilityInfo}>
                  <Text style={styles.facilityName}>{facility.name}</Text>
                  <Text style={styles.facilityAddress}>{facility.location.address}</Text>
                </View>
                <View style={[
                  styles.statusIndicator,
                  { backgroundColor: facility.isActive ? '#10b981' : '#ef4444' }
                ]}>
                  <Text style={styles.statusText}>
                    {facility.isActive ? 'Open' : 'Closed'}
                  </Text>
                </View>
              </View>

              {/* Occupancy Info */}
              <View style={styles.occupancySection}>
                <Text style={styles.occupancyTitle}>Capacity Status</Text>
                <View style={styles.occupancyBar}>
                  <View 
                    style={[
                      styles.occupancyFill,
                      { 
                        width: `${(facility.currentOccupancy / facility.capacity) * 100}%`,
                        backgroundColor: getOccupancyColor(facility.currentOccupancy, facility.capacity)
                      }
                    ]}
                  />
                </View>
                <View style={styles.occupancyDetails}>
                  <Text style={styles.occupancyText}>
                    {facility.currentOccupancy}/{facility.capacity}
                  </Text>
                  <Text style={[
                    styles.occupancyStatus,
                    { color: getOccupancyColor(facility.currentOccupancy, facility.capacity) }
                  ]}>
                    {getOccupancyStatus(facility.currentOccupancy, facility.capacity)}
                  </Text>
                </View>
              </View>

              {/* Services */}
              <View style={styles.servicesSection}>
                <Text style={styles.servicesTitle}>Services:</Text>
                <Text style={styles.servicesText}>
                  {facility.services?.join(', ') || 'No services listed'}
                </Text>
              </View>

              {/* Actions */}
              <View style={styles.actionsSection}>
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>📍 Directions</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>📞 Call</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: 'row',
  },
  filterButton: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
  },
  filterIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  filterLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  filterLabelActive: {
    color: '#ffffff',
  },
  facilitiesList: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    color: '#6b7280',
    fontSize: 16,
  },
  facilityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
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
  facilityHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  facilityIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  facilityInfo: {
    flex: 1,
  },
  facilityName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  facilityAddress: {
    color: '#6b7280',
    fontSize: 14,
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  occupancySection: {
    marginBottom: 16,
  },
  occupancyTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  occupancyBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 8,
  },
  occupancyFill: {
    height: '100%',
    borderRadius: 4,
  },
  occupancyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  occupancyText: {
    fontSize: 14,
    color: '#6b7280',
  },
  occupancyStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  servicesSection: {
    marginBottom: 16,
  },
  servicesTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  servicesText: {
    fontSize: 14,
    color: '#6b7280',
  },
  actionsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
});

export default FacilitiesScreen;