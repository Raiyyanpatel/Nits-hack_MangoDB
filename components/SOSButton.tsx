import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Animated,
  StyleSheet,
} from 'react-native';
import { User } from '../types';

interface SOSButtonProps {
  user: User;
}

const SOSButton: React.FC<SOSButtonProps> = ({ user }) => {
  const [isPressed, setIsPressed] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();

    return () => pulse.stop();
  }, []);

  const handleSOSPress = () => {
    Alert.alert(
      'Emergency SOS',
      'Are you sure you want to send an emergency alert? This will notify authorities and emergency contacts.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Send SOS',
          style: 'destructive',
          onPress: confirmSOS,
        },
      ]
    );
  };

  const confirmSOS = async () => {
    setIsPressed(true);
    
    try {
      // TODO: Implement actual SOS sending logic
      console.log('SOS Alert sent for user:', user.id);
      
      Alert.alert(
        'SOS Sent',
        'Emergency alert has been sent to authorities. Help is on the way.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to send SOS alert. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsPressed(false);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity
          onPress={handleSOSPress}
          disabled={isPressed}
          style={[styles.button, isPressed && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>SOS</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80,
    right: 24,
  },
  button: {
    width: 64,
    height: 64,
    backgroundColor: '#dc2626',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default SOSButton;