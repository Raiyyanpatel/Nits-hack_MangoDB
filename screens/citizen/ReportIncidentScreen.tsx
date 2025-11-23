import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { User, DisasterType, IncidentReport } from '../../types';

interface ReportIncidentScreenProps {
  user: User;
}

const ReportIncidentScreen: React.FC<ReportIncidentScreenProps> = ({ user }) => {
  const [selectedType, setSelectedType] = useState<DisasterType | null>(null);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Getting location...');
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);

  useEffect(() => {
    requestPermissions();
    getCurrentLocation();
  }, []);

  const requestPermissions = async () => {
    // Request camera permission
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    if (!cameraPermission.granted) {
      Alert.alert('Permission needed', 'Camera permission is required to take photos');
    }

    // Request location permission
    const locationPermission = await Location.requestForegroundPermissionsAsync();
    if (!locationPermission.granted) {
      Alert.alert('Permission needed', 'Location permission is required for accurate reporting');
      setLocationPermission(false);
    } else {
      setLocationPermission(true);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      setCurrentLocation({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      // Reverse geocode to get address
      const [address] = await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      if (address) {
        setLocation(
          `${address.street || ''} ${address.city || ''} ${address.region || ''}`.trim()
        );
      } else {
        setLocation(`${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`);
      }
    } catch (error) {
      setLocation('Location unavailable');
      console.error('Error getting location:', error);
    }
  };

  const disasterTypes = [
    { type: 'flood', label: 'Flood', icon: '🌊' },
    { type: 'fire', label: 'Fire', icon: '🔥' },
    { type: 'earthquake', label: 'Earthquake', icon: '🏠' },
    { type: 'cyclone', label: 'Cyclone', icon: '🌀' },
    { type: 'landslide', label: 'Landslide', icon: '⛰️' },
    { type: 'other', label: 'Other', icon: '⚠️' },
  ];

  const handleSubmit = async () => {
    if (!selectedType || !description.trim()) {
      Alert.alert('Error', 'Please select incident type and provide description');
      return;
    }

    setIsSubmitting(true);

    try {
      const report: Partial<IncidentReport> = {
        type: selectedType,
        description: description.trim(),
        location: {
          latitude: 19.0760,
          longitude: 72.8777,
          address: location,
        },
        userId: user.id,
        timestamp: new Date(),
        status: 'pending',
        media: photos.map(photo => ({
          id: Math.random().toString(),
          uri: photo,
          type: 'image' as const,
          size: 0,
          uploadStatus: 'pending' as const,
        })),
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      Alert.alert(
        'Report Submitted',
        'Your incident report has been submitted successfully. Authorities will be notified.',
        [{ text: 'OK', onPress: () => resetForm() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedType(null);
    setDescription('');
    setLocation('Current Location (GPS)');
    setPhotos([]);
  };

  const handlePhotoUpload = () => {
    Alert.alert(
      'Add Photo',
      'Choose how to add a photo to your report',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Gallery', onPress: pickImage },
      ]
    );
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotos([...photos, result.assets[0].uri]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotos([...photos, result.assets[0].uri]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <Text style={styles.title}>
          Report Incident
        </Text>

        {/* Incident Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Incident Type
          </Text>
          <View style={styles.typeGrid}>
            {disasterTypes.map((item) => (
              <TouchableOpacity
                key={item.type}
                onPress={() => setSelectedType(item.type as DisasterType)}
                style={[
                  styles.typeButton,
                  selectedType === item.type && styles.typeButtonSelected
                ]}
              >
                <Text style={styles.typeContent}>
                  <Text style={styles.typeIcon}>{item.icon}</Text>
                  {'\n'}
                  <Text style={[
                    styles.typeLabel,
                    selectedType === item.type && styles.typeLabelSelected
                  ]}>
                    {item.label}
                  </Text>
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Description
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the incident in detail..."
            multiline
            numberOfLines={4}
            style={[styles.textArea, { textAlignVertical: 'top' }]}
          />
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Location
          </Text>
          <View style={styles.locationContainer}>
            <Text style={styles.locationText}>📍 {location}</Text>
            <TouchableOpacity 
              onPress={getCurrentLocation}
              style={styles.refreshLocationButton}
            >
              <Text style={styles.refreshLocationText}>🔄</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Photo Upload */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Photos (Optional)
          </Text>
          
          <TouchableOpacity
            onPress={handlePhotoUpload}
            style={styles.photoUploadButton}
          >
            <Text style={styles.photoUploadIcon}>📷</Text>
            <Text style={styles.photoUploadText}>
              {photos.length === 0 ? 'Tap to add photos of the incident' : 'Add more photos'}
            </Text>
          </TouchableOpacity>

          {photos.length > 0 && (
            <View style={styles.photoGrid}>
              {photos.map((photoUri, index) => (
                <View key={index} style={styles.photoContainer}>
                  <Image 
                    source={{ uri: photoUri }} 
                    style={styles.photoThumbnail}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    onPress={() => removePhoto(index)}
                    style={styles.removePhotoButton}
                  >
                    <Text style={styles.removePhotoText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={[
            styles.submitButton,
            isSubmitting ? styles.submitButtonDisabled : styles.submitButtonEnabled
          ]}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </Text>
        </TouchableOpacity>

        {/* Info Note */}
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            ⚠️ Your report will be verified and appropriate authorities will be notified. For immediate emergencies, call 112.
          </Text>
        </View>
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
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
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  typeButton: {
    margin: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    minWidth: 80,
  },
  typeButtonSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  typeContent: {
    textAlign: 'center',
  },
  typeIcon: {
    fontSize: 24,
  },
  typeLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  typeLabelSelected: {
    color: '#3b82f6',
  },
  textArea: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
  },
  locationContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationText: {
    color: '#6b7280',
    flex: 1,
  },
  refreshLocationButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#f3f4f6',
  },
  refreshLocationText: {
    fontSize: 16,
  },
  photoUploadButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
  },
  photoUploadIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  photoUploadText: {
    color: '#6b7280',
    textAlign: 'center',
  },
  photoGrid: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  photoContainer: {
    position: 'relative',
    margin: 4,
  },
  photoThumbnail: {
    width: 80,
    height: 80,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removePhotoText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  photoPlaceholder: {
    textAlign: 'center',
    marginTop: 24,
  },
  submitButton: {
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonEnabled: {
    backgroundColor: '#3b82f6',
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  infoCard: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#92400e',
    textAlign: 'center',
  },
});

export default ReportIncidentScreen;