import React from 'react';
import { View, Text } from 'react-native';

// Web fallback for react-native-maps
export const MapView = ({ children, ...props }: any) => (
  <View style={{ flex: 1, backgroundColor: '#e8f5e8', justifyContent: 'center', alignItems: 'center' }}>
    <Text>Map view (Web version - use mobile device for full maps)</Text>
    {children}
  </View>
);

export const Circle = (props: any) => <View />;
export const Marker = (props: any) => <View />;

export default {
  MapView,
  Circle,
  Marker,
};