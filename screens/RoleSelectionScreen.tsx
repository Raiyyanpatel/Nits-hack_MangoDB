import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { UserRole, User } from '../types';

interface RoleSelectionScreenProps {
  user: User;
  onRoleSelected: (user: User) => void;
}

const RoleSelectionScreen: React.FC<RoleSelectionScreenProps> = ({ user, onRoleSelected }) => {
  const roleOptions = [
    {
      role: 'citizen' as UserRole,
      title: 'Citizen',
      description: 'Report incidents, receive alerts, and access emergency services',
      icon: '👤',
      color: '#3b82f6',
    },
    {
      role: 'official' as UserRole,
      title: 'Emergency Official',
      description: 'Manage responses, verify reports, and coordinate emergency services',
      icon: '�',
      color: '#ef4444',
    },
  ];

  const handleRoleSelect = (role: UserRole) => {
    const updatedUser = { ...user, role };
    onRoleSelected(updatedUser);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            Select Your Role
          </Text>
          <Text style={styles.subtitle}>
            Choose how you'll be using the Disaster Management System
          </Text>
        </View>

        {/* Role Options */}
        <View style={styles.roleList}>
          {roleOptions.map((roleOption) => (
            <TouchableOpacity
              key={roleOption.role}
              onPress={() => handleRoleSelect(roleOption.role)}
              style={styles.roleCard}
            >
              <View style={styles.roleContent}>
                <View style={[styles.iconContainer, { backgroundColor: roleOption.color }]}>
                  <Text style={styles.iconText}>{roleOption.icon}</Text>
                </View>
                
                <View style={styles.roleInfo}>
                  <Text style={styles.roleTitle}>
                    {roleOption.title}
                  </Text>
                  <Text style={styles.roleDescription}>
                    {roleOption.description}
                  </Text>
                </View>
                
                <Text style={styles.arrow}>→</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Note: Your role determines the features and permissions available to you in the app.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  roleList: {
    marginBottom: 32,
  },
  roleCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 24,
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
  roleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  iconText: {
    fontSize: 24,
  },
  roleInfo: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  arrow: {
    fontSize: 20,
    color: '#9ca3af',
  },
  infoCard: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#92400e',
    textAlign: 'center',
  },
});

export default RoleSelectionScreen;