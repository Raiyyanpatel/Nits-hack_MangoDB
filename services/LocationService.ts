import * as Location from 'expo-location';

export interface LocationData {
  userId: string;
  userName: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

class LocationService {
  private locationSubscription: Location.LocationSubscription | null = null;
  private isTracking: boolean = false;

  async requestPermissions(): Promise<boolean> {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        console.log('❌ Location permission denied');
        return false;
      }

      // Request background permission for continuous tracking
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      
      if (backgroundStatus !== 'granted') {
        console.log('⚠️ Background location permission denied - will only track in foreground');
      }

      console.log('✅ Location permissions granted');
      return true;
    } catch (error) {
      console.error('❌ Error requesting location permissions:', error);
      return false;
    }
  }

  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        userId: '',
        userName: '',
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || 0,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('❌ Error getting current location:', error);
      return null;
    }
  }

  async startTracking(
    userId: string,
    userName: string,
    onLocationUpdate: (location: LocationData) => void
  ): Promise<boolean> {
    if (this.isTracking) {
      console.log('⚠️ Location tracking already active');
      return true;
    }

    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return false;
      }

      // Start watching location with updates every 60 seconds (1 minute)
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 60000, // 60 seconds = 1 minute
          distanceInterval: 50, // Also update if moved 50 meters
        },
        (location) => {
          const locationData: LocationData = {
            userId,
            userName,
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || 0,
            timestamp: Date.now(),
          };

          console.log('📍 Location update:', locationData);
          onLocationUpdate(locationData);
        }
      );

      this.isTracking = true;
      console.log('✅ Location tracking started');
      return true;
    } catch (error) {
      console.error('❌ Error starting location tracking:', error);
      return false;
    }
  }

  stopTracking(): void {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
      this.isTracking = false;
      console.log('🛑 Location tracking stopped');
    }
  }

  isCurrentlyTracking(): boolean {
    return this.isTracking;
  }
}

export default new LocationService();
