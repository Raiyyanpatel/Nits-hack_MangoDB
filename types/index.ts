export interface User {
  id: string;
  email: string;
  name: string;
  role?: UserRole;
  officialRole?: 'admin' | 'field' | 'responder';
  phoneNumber?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'citizen' | 'official' | 'admin' | 'system_administrator' | 'field_officer' | 'field_official' | 'responder' | 'emergency_responder';

export interface DisasterAlert {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  type: DisasterType;
  location: Location;
  radius: number; // in kilometers
  issuedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  languages: Record<string, AlertTranslation>;
}

export type AlertSeverity = 'low' | 'moderate' | 'high' | 'severe';

export type DisasterType = 
  | 'flood' 
  | 'earthquake' 
  | 'cyclone' 
  | 'fire' 
  | 'landslide' 
  | 'tsunami' 
  | 'drought' 
  | 'other';

export interface AlertTranslation {
  title: string;
  description: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface IncidentReport {
  id: string;
  userId: string;
  type: DisasterType;
  description: string;
  location: Location;
  media: MediaFile[];
  timestamp: Date;
  status: ReportStatus;
  aiScore?: number; // 0-100 authenticity score
  verifiedBy?: string;
  verifiedAt?: Date;
  isOffline?: boolean;
}

export type ReportStatus = 'pending' | 'verified' | 'rejected' | 'investigating';

export interface MediaFile {
  id: string;
  uri: string;
  type: 'image' | 'video' | 'audio';
  size: number;
  uploadStatus: 'pending' | 'uploading' | 'completed' | 'failed';
}

export interface SOSAlert {
  id: string;
  userId: string;
  location: Location;
  timestamp: Date;
  status: SOSStatus;
  responderId?: string;
  responseTime?: Date;
  notes?: string;
}

export type SOSStatus = 'active' | 'acknowledged' | 'responding' | 'resolved' | 'false_alarm';

export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  location: Location;
  capacity: number;
  currentOccupancy: number;
  contact: string;
  services: string[];
  isActive: boolean;
}

export type FacilityType = 'hospital' | 'shelter' | 'relief_camp' | 'fire_station' | 'police_station';

export interface HazardZone {
  id: string;
  type: DisasterType;
  severity: AlertSeverity;
  coordinates: Location[];
  lastUpdated: Date;
  isActive: boolean;
}

export interface NotificationSettings {
  enablePush: boolean;
  enableSMS: boolean;
  enableVoice: boolean;
  languages: string[];
  severityFilter: AlertSeverity[];
}

export interface OfflineQueue {
  reports: IncidentReport[];
  sosAlerts: SOSAlert[];
  lastSync: Date;
  pendingUploads: MediaFile[];
}