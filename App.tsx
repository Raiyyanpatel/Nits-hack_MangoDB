import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Dimensions,
  Pressable,
  Linking,
  KeyboardAvoidingView,
  Platform,
  Image,
  Animated,
  Modal,
  TextInput,
  Share,
  Keyboard,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import * as Location from 'expo-location';
import * as Clipboard from 'expo-clipboard';
import LoadingScreen from './src/components/LoadingScreen';
import MapView, { Marker, PROVIDER_GOOGLE, Circle as MapCircle } from 'react-native-maps';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Line as SvgLine, Circle as SvgCircle, Text as SvgText, Polyline as SvgPolyline } from 'react-native-svg';
import { AuthService } from './src/services/AuthService';
import type { User } from './src/types';
import SocketService from './src/services/SocketService';
import LocationService from './src/services/LocationService';
import type { LocationData } from './src/services/SocketService';
import DisasterVerificationService from './src/services/DisasterVerificationService';

const { width, height } = Dimensions.get('window');
const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    // Tabs
    tabAlerts: 'Alerts',
    tabReport: 'Reports',
    tabFacilities: 'Facilities',
    stayInformed: 'Stay informed about active hazards in your area',
    tabZones: 'Zones',
    tabChat: 'Chat',
    tabHelp: 'Help',
    // Alerts
    emergencyAlertSystem: 'Emergency Alert System',
    activeAlerts: 'Active Alerts',
    lastUpdated: 'Last updated',
    coverage: 'Coverage',
    viewDetails: 'View Details',
    shareAlert: 'Share Alert',
    safetyInstructions: 'Safety Instructions',
    issued: 'Issued',
    radius: 'Radius',
    languageLabel: 'Language',
    noAlertsTitle: 'All Clear',
    noAlertsMessage: 'No active disaster alerts in your area',
    refresh: 'Refresh',
    close: 'Close',
    directions: 'Directions',
    share: 'Share',
    shareAsImage: 'Share as Image',
  // Report flow additions
  reportSubmittedTitle: '✅ Report Submitted!',
  reportSubmitQueuedBody: 'Your {type} report has been queued and will be submitted when you\'re back online.\n\nReport ID: {id}',
  reportSubmitSentBody: 'Your {type} report has been sent to emergency officials.\n\nReport ID: {id}',
  yourReports: 'Your Reports',
  noReportsYet: 'No reports yet. Submit a report to see it here.',
  queuedForUpload: 'Queued for upload when online',
  photoCapturedTitle: '📷 Photo Captured',
  photoCapturedBody: 'Photo saved to report. You can add more photos or submit the report.',
  ok: 'OK',
  missingInformation: 'Missing Information',
  pleaseSelectIncidentType: 'Please select an incident type.',
  pleaseEnterDescription: 'Please enter a brief description.',
  locationPermissionTitle: 'Location Permission Needed',
  locationPermissionBody: 'Please enable location access in settings.',
  autoDetectedPrefix: 'Auto-detected: ',
  currentLocation: 'Current location',
    // Report
    reportIncident: 'Report Incident',
    incidentType: 'Incident Type',
    selectIncidentType: 'Select incident type',
    description: 'Description',
    descriptionPlaceholder: "Describe what you're observing in detail...",
    location: 'Location',
    mediaUpload: 'Media Upload',
    takePhoto: 'Take Photo',
    chooseFile: 'Choose File',
    chooseFromFiles: 'Choose from files',
    choosePhotoOrVideo: 'Choose photo or video',
    update: 'Update',
    submitReportOnline: 'Submit Report to Officials',
    submitReportOffline: 'Queue Report (Will sync when online)',
    offlineModeWarning: 'Offline Mode - Reports will be queued until connection is restored',
    incidentTypeHint: 'Select the type that best describes your emergency',
    // Facilities
    emergencyFacilities: 'Emergency Facilities',
    map: 'Map',
    list: 'List',
    occupancy: 'Occupancy',
    open: 'Open',
    full: 'Full',
    closed: 'Closed',
    call: 'Call',
    copyAddress: 'Copy Address',
    copyNumber: 'Copy Number',
    searchPlaceholder: 'Search by name or area',
    filterTypeLabel: 'Type',
    radiusLabel: 'Radius',
    capacityNA: 'Capacity: N/A',
    // Relative time
    justNow: 'Just now',
    minAgo: '{n} min ago',
    hoursAgo: '{h}h ago',
    hoursMinutesAgo: '{h}h {m}m ago',
    governmentAuthorized: 'Government Authorized',
    issuedByDMA: 'Issued by the Disaster Management Authority',
  },
  hi: {
    tabAlerts: 'अलर्ट',
    tabReport: 'Reports',
    tabFacilities: 'Facilities',
    tabZones: 'ज़ोन',
    tabHelp: 'मदद',
    emergencyAlertSystem: 'आपातकालीन अलर्ट प्रणाली',
    activeAlerts: 'सक्रिय अलर्ट',
  lastUpdated: 'अंतिम अपडेट',
    coverage: 'कवरेज',
    viewDetails: 'विवरण देखें',
    shareAlert: 'अलर्ट साझा करें',
    safetyInstructions: 'सुरक्षा निर्देश',
    issued: 'जारी',
    radius: 'त्रिज्या',
    languageLabel: 'भाषा',
    noAlertsTitle: 'सुरक्षित',
    noAlertsMessage: 'आपके क्षेत्र में कोई सक्रिय आपदा अलर्ट नहीं है',
    refresh: 'रीफ़्रेश',
    close: 'बंद करें',
    directions: 'दिशा-निर्देश',
    share: 'साझा करें',
    shareAsImage: 'छवि के रूप में साझा करें',
  // Report flow additions
  reportSubmittedTitle: '✅ रिपोर्ट सबमिट हो गई!',
  reportSubmitQueuedBody: 'आपकी {type} रिपोर्ट कतारबद्ध कर दी गई है और ऑनलाइन होते ही सबमिट कर दी जाएगी।\n\nरिपोर्ट आईडी: {id}',
  reportSubmitSentBody: 'आपकी {type} रिपोर्ट आपातकालीन अधिकारियों को भेज दी गई है।\n\nरिपोर्ट आईडी: {id}',
  yourReports: 'आपकी रिपोर्ट्स',
  noReportsYet: 'अभी कोई रिपोर्ट नहीं। यहाँ देखने के लिए रिपोर्ट सबमिट करें।',
  queuedForUpload: 'ऑनलाइन होने पर अपलोड के लिए कतारबद्ध',
  photoCapturedTitle: '📷 फोटो कैप्चर किया गया',
  photoCapturedBody: 'फोटो रिपोर्ट में सुरक्षित कर लिया गया है। आप और फोटो जोड़ सकते हैं या रिपोर्ट सबमिट कर सकते हैं।',
  ok: 'ठीक है',
  missingInformation: 'जानकारी अधूरी है',
  pleaseSelectIncidentType: 'कृपया घटना का प्रकार चुनें।',
  pleaseEnterDescription: 'कृपया संक्षिप्त विवरण दर्ज करें।',
  locationPermissionTitle: 'स्थान अनुमति आवश्यक',
  locationPermissionBody: 'कृपया सेटिंग्स में लोकेशन एक्सेस सक्षम करें।',
  autoDetectedPrefix: 'स्वतः-पहचाना: ',
  currentLocation: 'वर्तमान स्थान',
    reportIncident: 'घटना रिपोर्ट करें',
    incidentType: 'घटना का प्रकार',
    selectIncidentType: 'घटना प्रकार चुनें',
    description: 'विवरण',
    descriptionPlaceholder: 'कृपया विस्तार से वर्णन करें...',
    location: 'स्थान',
    mediaUpload: 'मीडिया अपलोड',
    takePhoto: 'फोटो लें',
    chooseFile: 'फ़ाइल चुनें',
    chooseFromFiles: 'फाइल से चुनें',
    choosePhotoOrVideo: 'फ़ोटो या वीडियो चुनें',
    update: 'अपडेट करें',
    submitReportOnline: 'अधिकारियों को रिपोर्ट भेजें',
    submitReportOffline: 'रिपोर्ट कतारबद्ध (ऑनलाइन होने पर सिंक)',
    offlineModeWarning: 'ऑफ़लाइन मोड - कनेक्शन बहाल होने तक रिपोर्ट कतार में रहेंगी',
    incidentTypeHint: 'अपनी आपात स्थिति के लिए सबसे उपयुक्त प्रकार चुनें',
    emergencyFacilities: 'आपातकालीन सुविधाएँ',
    map: 'मानचित्र',
    list: 'सूची',
    occupancy: 'अधिभोग',
    open: 'खुला',
    full: 'पूर्ण',
    closed: 'बंद',
    call: 'कॉल',
    copyAddress: 'पता कॉपी करें',
    copyNumber: 'नंबर कॉपी करें',
    searchPlaceholder: 'नाम या क्षेत्र से खोजें',
    filterTypeLabel: 'प्रकार',
    radiusLabel: 'त्रिज्या',
    capacityNA: 'क्षमता: उपलब्ध नहीं',
    justNow: 'अभी',
    minAgo: '{n} मिनट पहले',
    hoursAgo: '{h}घं पहले',
    hoursMinutesAgo: '{h}घं {m}मि पहले',
    governmentAuthorized: 'सरकारी अधिकृत',
    issuedByDMA: 'आपदा प्रबंधन प्राधिकरण द्वारा जारी',
  },
  gu: {
    tabAlerts: 'એલર્ટ',
    tabReport: 'Reports',
    tabFacilities: 'Facilities',
    tabZones: 'ઝોન',
    tabHelp: 'મદદ',
    tabChat: 'ચેટ',
    emergencyAlertSystem: 'ઇમર્જન્સી એલર્ટ સિસ્ટમ',
    activeAlerts: 'સક્રિય એલર્ટ',
    lastUpdated: 'છેલ્લું અપડેટ',
    coverage: 'કવરેજ',
    viewDetails: 'વિગતો જુઓ',
    shareAlert: 'એલર્ટ શેર કરો',
    safetyInstructions: 'સુરક્ષા સૂચનાઓ',
    issued: 'જારી',
    radius: 'વ્યાપ્તિ',
    languageLabel: 'ભાષા',
    noAlertsTitle: 'સુરક્ષિત',
    noAlertsMessage: 'તમારા વિસ્તારમાં કોઈ સક્રિય આપત્તિ એલર્ટ નથી',
    refresh: 'રિફ્રેશ',
    close: 'બંધ કરો',
    directions: 'દિશા',
    share: 'શેર કરો',
    shareAsImage: 'તસવીર તરીકે શેર કરો',
  // Report flow additions
    governmentAuthorized: 'સરકારી માન્ય',
    issuedByDMA: 'આપત્તિ વ્યવસ્થાપન અધિકારી દ્વારા જારી',
  reportSubmittedTitle: '✅ રિપોર્ટ સબમિટ થઈ ગઈ!',
  reportSubmitQueuedBody: 'તમારો {type} રિપોર્ટ કતારમાં મૂકાયો છે અને ઓનલાઇન થતા જ સબમિટ થશે.\n\nરિપોર્ટ આઈડી: {id}',
  reportSubmitSentBody: 'તમારો {type} રિપોર્ટ ઇમર્જન્સી અધિકારીઓને મોકલાયો છે.\n\nરિપોર્ટ આઈડી: {id}',
  yourReports: 'તમારી રિપોર્ટ્સ',
  noReportsYet: 'હજુ કોઈ રિપોર્ટ નથી. અહીં જોવા માટે રિપોર્ટ સબમિટ કરો.',
  queuedForUpload: 'ઓનલાઇન થયા પછી અપલોડ માટે કતારમાં',
  photoCapturedTitle: '📷 ફોટો કૅપ્ચર થયો',
  photoCapturedBody: 'ફોટો રિપોર્ટમાં સેવ થયો છે. તમે વધુ ફોટા ઉમેરી શકો છો અથવા રિપોર્ટ સબમિટ કરી શકો છો.',
  ok: 'બરાબર',
  missingInformation: 'માહિતી અધૂરી છે',
  pleaseSelectIncidentType: 'કૃપા કરીને ઘટનાનો પ્રકાર પસંદ કરો.',
  pleaseEnterDescription: 'કૃપા કરીને સંક્ષિપ્ત વર્ણન દાખલ કરો.',
  locationPermissionTitle: 'સ્થાન પરવાનગી જરૂરી',
  locationPermissionBody: 'કૃપા કરીને સેટિંગ્સમાં લોકેશન ઍક્સેસ સક્રિય કરો.',
  autoDetectedPrefix: 'સ્વતઃ-ઓળખાયેલ: ',
  currentLocation: 'વર્તમાન સ્થાન',
    reportIncident: 'ઘટના રિપોર્ટ કરો',
    incidentType: 'ઘટનાનો પ્રકાર',
    selectIncidentType: 'ઘટના પ્રકાર પસંદ કરો',
    description: 'વર્ણન',
    descriptionPlaceholder: 'મહેરબાની કરીને વિગતવાર વર્ણન કરો...',
    location: 'સ્થાન',
    mediaUpload: 'મીડિયા અપલોડ',
    takePhoto: 'ફોટો લો',
    chooseFile: 'ફાઇલ પસંદ કરો',
    chooseFromFiles: 'ફાઇલમાંથી પસંદ કરો',
    choosePhotoOrVideo: 'ફોટો અથવા વિડિયો પસંદ કરો',
    update: 'અપડેટ કરો',
    submitReportOnline: 'અધિકારીઓને રિપોર્ટ મોકલો',
    submitReportOffline: 'રિપોર્ટ કતારમાં (ઓનલાઇન થયા બાદ સિંક)',
    offlineModeWarning: 'ઓફલાઇન મોડ - કનેક્શન પુનઃસ્થાપિત થાય ત્યાં સુધી રિપોર્ટ કતારમાં રહેશે',
    incidentTypeHint: 'તમારી ઇમર્જન્સી માટે સૌથી યોગ્ય પ્રકાર પસંદ કરો',
    emergencyFacilities: 'ઇમર્જન્સી સુવિધાઓ',
    map: 'નકશો',
    list: 'યાદી',
    occupancy: 'ઓક્યુપન્સી',
    open: 'ખુલ્લું',
    full: 'ભરેલું',
    closed: 'બંધ',
    call: 'કૉલ',
    copyAddress: 'સરનામું કૉપી કરો',
    copyNumber: 'નંબર કૉપી કરો',
    searchPlaceholder: 'નામ અથવા વિસ્તાર દ્વારા શોધો',
    filterTypeLabel: 'પ્રકાર',
    radiusLabel: 'વ્યાપ્તિ',
    capacityNA: 'ક્ષમતા: ઉપલબ્ધ નથી',
    justNow: 'હમણાં',
    minAgo: '{n} મિનિટ પહેલા',
    hoursAgo: '{h} કલાક પહેલા',
    hoursMinutesAgo: '{h} કલાક {m} મિનિટ પહેલા',
  },
};
interface DisasterAlert {
  id: string;
  title: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  location: string;
  timestamp: string;
  countdown?: number;
  type: 'flood' | 'earthquake' | 'cyclone' | 'fire' | 'other';
  radius: number;
  language: string;
  instructions: string[];
  verification?: 'verified' | 'pending' | 'fake' | 'unverified';
}

interface IncidentReport {
  id: string;
  type: string;
  description: string;
  location: string;
  timestamp: string;
  status: 'pending' | 'uploaded' | 'failed';
  hasMedia: boolean;
  verification?: 'verified' | 'pending' | 'fake' | 'unverified';
  aiAuthenticityScore?: number;
}

interface Facility {
  id: string;
  name: string;
  type: 'hospital' | 'shelter' | 'relief_camp' | 'police_station';
  address: string;
  distance: string; // legacy/static, dynamic distance is computed at runtime
  capacity: number;
  currentOccupancy: number;
  phone: string;
  status: 'open' | 'full' | 'closed';
  coordinates: { lat: number; lng: number };
}

interface HazardZone {
  id: string;
  type: 'flood' | 'fire' | 'earthquake' | 'storm' | 'landslide';
  severity: 'high' | 'medium' | 'low';
  area: string;
  status: 'active' | 'warning' | 'cleared';
  lastUpdated: string;
  affectedPopulation: number;
}

type AppState = 'loading' | 'landing' | 'login' | 'roleSelection' | 'officialLogin' | 'citizenApp' | 'officialsApp';
type CitizenTab = 'alerts' | 'report' | 'facilities' | 'zones' | 'chat' | 'help';
type OfficialTab = 'dashboard' | 'reports' | 'broadcast' | 'resources' | 'settings';

// Incident types for dropdown
const INCIDENT_TYPES = [
  { value: 'fire', label: '🔥 Fire Emergency', description: 'Building fires, forest fires, explosions' },
  { value: 'flood', label: '🌊 Flooding', description: 'Water overflow, flash floods, storm surge' },
  { value: 'earthquake', label: '🏠 Earthquake Damage', description: 'Structural damage, collapsed buildings' },
  { value: 'storm', label: '⛈️ Storm Damage', description: 'Hurricane, tornado, severe weather' },
  { value: 'infrastructure', label: '⚡ Infrastructure Failure', description: 'Power outages, road closures, utilities' },
  { value: 'accident', label: '🚗 Traffic Accident', description: 'Vehicle crashes, road incidents' },
  { value: 'other', label: 'Other Emergency', description: 'Medical, security, or other incidents' }
];

// Helper to create ISO timestamps (valid dates) relative to now
const isoMinutesAgo = (mins: number) => new Date(Date.now() - mins * 60 * 1000).toISOString();

// Sample Data as per Implementation Guide
const SAMPLE_ALERTS: DisasterAlert[] = [
  {
    id: "1",
    title: "Severe Cyclone Warning", 
    description: "Category 4 cyclone approaching coastal areas. Immediate evacuation recommended for low-lying zones.",
    severity: "Critical",
    location: "Coastal District A",
    timestamp: isoMinutesAgo(2),
    countdown: 7200,
    type: "cyclone",
    radius: 25,
    language: "English",
    instructions: [
      "Move to higher ground immediately",
      "Avoid coastal areas and low-lying regions",
      "Secure loose objects and windows",
      "Keep emergency supplies ready"
    ],
    verification: 'verified'
  },
  {
    id: "2",
    title: "Flash Flood Alert",
    description: "Heavy rainfall causing rapid water level rise in urban areas. Avoid low-lying roads.",
    severity: "High", 
    location: "City Center",
    timestamp: isoMinutesAgo(15),
    countdown: 3600,
    type: "flood",
    radius: 15,
    language: "English",
    instructions: [
      "Avoid waterlogged areas",
      "Do not drive through flooded roads",
      "Stay indoors if possible"
    ],
    verification: 'pending'
  },
  {
    id: "3",
    title: "All Clear - Earthquake",
    description: "Earthquake monitoring shows stable conditions. Normal activities can resume.",
    severity: "Low",
    location: "Metropolitan Area", 
    timestamp: isoMinutesAgo(60),
    type: "earthquake",
    radius: 10,
    language: "English",
    instructions: [
      "Maintain normal activities",
      "Stay alert for aftershocks",
      "Report any structural damage"
    ],
    verification: 'unverified',
  }
];

const SAMPLE_REPORTS: IncidentReport[] = [
  {
    id: "1",
    type: "flood",
    description: "Street flooding near Main St intersection",
    location: "Auto-detected: 123 Main St", 
    timestamp: "10 minutes ago",
    status: "pending",
    hasMedia: true,
    verification: 'pending'
  },
  {
    id: "2", 
    type: "infrastructure",
    description: "Damaged power lines after storm",
    location: "Auto-detected: Oak Avenue",
    timestamp: "25 minutes ago",
    status: "uploaded",
    hasMedia: false,
    verification: 'verified'
  }
];

const SAMPLE_FACILITIES: Facility[] = [
  // Placeholder kept for reference; app now uses MUMBAI_FACILITIES below
];

// Mumbai Emergency Facilities (curated starter set; not exhaustive)
const MUMBAI_FACILITIES: Facility[] = [
  // Hospitals
  { id: 'MH-1', name: 'KEM Hospital (Seth GS Medical College)', type: 'hospital', address: 'Parel, Mumbai', distance: '', capacity: 0, currentOccupancy: 0, phone: '02224107000', status: 'open', coordinates: { lat: 18.9906, lng: 72.8375 } },
  { id: 'MH-2', name: 'LTMMC & LTMG Hospital (Sion Hospital)', type: 'hospital', address: 'Sion, Mumbai', distance: '', capacity: 0, currentOccupancy: 0, phone: '02224076381', status: 'open', coordinates: { lat: 19.0418, lng: 72.8615 } },
  { id: 'MH-3', name: 'Sir J.J. Hospital', type: 'hospital', address: 'Byculla, Mumbai', distance: '', capacity: 0, currentOccupancy: 0, phone: '02223739031', status: 'open', coordinates: { lat: 18.9649, lng: 72.8339 } },
  { id: 'MH-4', name: 'BYL Nair Hospital', type: 'hospital', address: 'Mumbai Central, Mumbai', distance: '', capacity: 0, currentOccupancy: 0, phone: '02223027654', status: 'open', coordinates: { lat: 18.9676, lng: 72.8199 } },
  { id: 'MH-5', name: 'Cooper Hospital', type: 'hospital', address: 'Vile Parle (W), Mumbai', distance: '', capacity: 0, currentOccupancy: 0, phone: '02226207254', status: 'open', coordinates: { lat: 19.1046, lng: 72.8365 } },
  { id: 'MH-6', name: 'H.N. Reliance Foundation Hospital', type: 'hospital', address: 'Girgaon, Mumbai', distance: '', capacity: 0, currentOccupancy: 0, phone: '02261305000', status: 'open', coordinates: { lat: 18.9540, lng: 72.8303 } },
  { id: 'MH-7', name: 'Lilavati Hospital', type: 'hospital', address: 'Bandra (W), Mumbai', distance: '', capacity: 0, currentOccupancy: 0, phone: '02226751000', status: 'open', coordinates: { lat: 19.0589, lng: 72.8295 } },
  { id: 'MH-8', name: 'Nanavati Max Super Speciality Hospital', type: 'hospital', address: 'Vile Parle (W), Mumbai', distance: '', capacity: 0, currentOccupancy: 0, phone: '02226267500', status: 'open', coordinates: { lat: 19.0961, lng: 72.8402 } },
  // Police Stations (representative)
  { id: 'MP-1', name: 'Colaba Police Station', type: 'police_station', address: 'Colaba, Mumbai', distance: '', capacity: 0, currentOccupancy: 0, phone: '02222151775', status: 'open', coordinates: { lat: 18.9108, lng: 72.8141 } },
  { id: 'MP-2', name: 'Bandra Police Station', type: 'police_station', address: 'Bandra (W), Mumbai', distance: '', capacity: 0, currentOccupancy: 0, phone: '02226422728', status: 'open', coordinates: { lat: 19.0591, lng: 72.8347 } },
  { id: 'MP-3', name: 'Dadar Police Station', type: 'police_station', address: 'Dadar (W), Mumbai', distance: '', capacity: 0, currentOccupancy: 0, phone: '02224208750', status: 'open', coordinates: { lat: 19.0183, lng: 72.8424 } },
  { id: 'MP-4', name: 'Andheri Police Station', type: 'police_station', address: 'Andheri (E), Mumbai', distance: '', capacity: 0, currentOccupancy: 0, phone: '02226831562', status: 'open', coordinates: { lat: 19.1197, lng: 72.8468 } },
];

const SAMPLE_HAZARDS: HazardZone[] = [
  {
    id: "1",
    type: "flood",
    severity: "high",
    area: "Riverside District",
    status: "active", 
    lastUpdated: "5 minutes ago",
    affectedPopulation: 15000
  },
  {
    id: "2", 
    type: "storm",
    severity: "medium",
    area: "Coastal Area",
    status: "warning",
    lastUpdated: "15 minutes ago", 
    affectedPopulation: 8000
  },
  {
    id: "3",
    type: "landslide",
    severity: "high", 
    area: "Hill Station Road",
    status: "active",
    lastUpdated: "2 hours ago",
    affectedPopulation: 2500
  }
];

export default function App() {
  const [currentState, setCurrentState] = useState<AppState>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<CitizenTab | OfficialTab>('alerts');
  const [sosActive, setSosActive] = useState(false);
  // Socket.IO state
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  // Location tracking state
  const [isLocationTrackingEnabled, setIsLocationTrackingEnabled] = useState(false);
  const [citizenLocations, setCitizenLocations] = useState<LocationData[]>([]);
  // Official Access (login) state
  const [officialRole, setOfficialRole] = useState<'admin' | 'field' | 'responder' | null>(null);
  const [showOfficialRoleDropdown, setShowOfficialRoleDropdown] = useState(false);
  const [officialTab, setOfficialTab] = useState<'analytics' | 'verification' | 'broadcast' | 'locations' | 'resources'>('analytics');
  const [analyticsRange, setAnalyticsRange] = useState<'Last 24h' | 'Last 7d' | 'Last 30d'>('Last 24h');
  // Facility map interactions
  const [selectedFacility, setSelectedFacility] = useState<string | null>(null);
  const [facilityClickTimer, setFacilityClickTimer] = useState<NodeJS.Timeout | null>(null);
  // Citizen Chat (5km radius local chat)
  type ChatMessage = { id: string; userId: string; name: string; text: string; ts: string; lat: number; lon: number };
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 'm1', userId: 'u2', name: 'Neha', text: 'Is the main road flooded near Bandra?', ts: new Date(Date.now() - 5 * 60_000).toISOString(), lat: 19.054, lon: 72.840 },
    { id: 'm2', userId: 'u3', name: 'Amit', text: 'Power outage at my block. Anyone else?', ts: new Date(Date.now() - 12 * 60_000).toISOString(), lat: 19.060, lon: 72.835 },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatUserCoords, setChatUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [inputContainerHeight, setInputContainerHeight] = useState(64);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Auto-scroll to bottom when messages change or keyboard opens
  const scrollToBottom = (force: boolean = false) => {
    if (!force && !isNearBottom) return;
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    });
  };
  const [chatSeeded, setChatSeeded] = useState(false);
  const CHAT_RADIUS_KM = 5;

  // Keyboard visibility listener
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (activeTab === 'chat' && !chatUserCoords) {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') return;
          const pos = await Location.getCurrentPositionAsync({});
          if (!mounted) return;
          setChatUserCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        } catch {}
      }
    })();
    return () => { mounted = false; };
  }, [activeTab, chatUserCoords]);

  // One-time seed: add 2-3 prior messages near the user's current location so history appears
  useEffect(() => {
    if (activeTab !== 'chat' || !chatUserCoords || chatSeeded) return;
    try {
      const { lat, lon } = chatUserCoords;
      const cosLat = Math.cos((lat * Math.PI) / 180) || 1;
      const kmToDegLat = (km: number) => km / 111;
      const kmToDegLon = (km: number) => km / (111 * cosLat);
      const now = Date.now();
      const seed: ChatMessage[] = [
        {
          id: Math.random().toString(36).slice(2),
          userId: 'u2',
          name: 'Neha',
          text: 'Water rising near my lane. Please avoid this route.',
          ts: new Date(now - 50 * 60_000).toISOString(),
          lat: lat + kmToDegLat(0.8),
          lon: lon + kmToDegLon(0.5),
        },
        {
          id: Math.random().toString(36).slice(2),
          userId: 'u3',
          name: 'Amit',
          text: 'Local shelter has space. Volunteers available.',
          ts: new Date(now - 35 * 60_000).toISOString(),
          lat: lat - kmToDegLat(1.2),
          lon: lon - kmToDegLon(0.7),
        },
        {
          id: Math.random().toString(36).slice(2),
          userId: 'u4',
          name: 'Rahul',
          text: 'Anyone has updates on power restoration ETA?',
          ts: new Date(now - 20 * 60_000).toISOString(),
          lat: lat + kmToDegLat(2.0),
          lon: lon - kmToDegLon(1.0),
        },
      ];
      setChatMessages((prev) => [...seed, ...prev]);
      setChatSeeded(true);
    } catch {
      // ignore
    }
  }, [activeTab, chatUserCoords, chatSeeded]);

  // Auto-scroll when messages change (only if user is near bottom)
  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // Force scroll to bottom when chat tab is opened
  useEffect(() => {
    if (activeTab === 'chat') {
      scrollToBottom(true);
    }
  }, [activeTab]);

  const sendChat = () => {
    if (!user || !chatUserCoords) return;
    const text = chatInput.trim();
    if (!text) return;
    const msg: ChatMessage = {
      id: Math.random().toString(36).slice(2),
      userId: user.id,
      name: user.name || 'You',
      text,
      ts: new Date().toISOString(),
      lat: chatUserCoords.lat,
      lon: chatUserCoords.lon,
    };
    setChatMessages((prev) => [msg, ...prev]);
    setChatInput('');
    scrollToBottom(true);
  };
  const [showRangeMenu, setShowRangeMenu] = useState(false);
  const [officialUsername, setOfficialUsername] = useState('');
  const [officialPassword, setOfficialPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // Officials tabs local state
  type VerificationStatus = 'Pending' | 'Verified' | 'Flagged';
  type PriorityLevel = 'Low' | 'Medium' | 'High';
  type IncidentType = 'Flood' | 'Fire' | 'Earthquake' | 'Cyclone';
  interface VerifyReport {
    id: string;
    user: string;
    type: IncidentType;
    title: string;
    description: string;
    location: string;
    time: string;
    aiScore: number; // 0-100
    status: VerificationStatus;
    photos: number;
    priority: PriorityLevel;
    tags: string[];
    hasMedia: boolean;
  }
  const [verificationFilter, setVerificationFilter] = useState<'Pending' | 'Flagged' | 'Verified' | 'All Reports'>('Pending');
  const [verifyQuery, setVerifyQuery] = useState('');
    const getOfficialTabs = (userRole: any) => {
      const allTabs = [
        { key: 'analytics', label: 'Analytics', icon: 'bar-chart' },
        { key: 'verification', label: 'Verification', icon: 'checkmark-done' },
        { key: 'broadcast', label: 'Broadcast', icon: 'megaphone' },
        { key: 'locations', label: 'Locations', icon: 'location' },
        { key: 'resources', label: 'Resources', icon: 'construct' },
      ] as const;
      
      if (userRole === 'admin') return allTabs;
      if (userRole === 'field') return allTabs.filter(t => t.key === 'verification' || t.key === 'broadcast' || t.key === 'locations');
      if (userRole === 'responder') return allTabs.filter(t => t.key === 'verification' || t.key === 'broadcast' || t.key === 'locations' || t.key === 'resources');
      return allTabs;
    };
  const [reports, setReports] = useState<VerifyReport[]>([
    { id: 'R-2481', user: 'Rahul Sharma', type: 'Flood', title: 'Severe flooding on Main Street', description: 'Water level rising rapidly near the shopping district. Multiple cars stranded.', location: 'Main Street, Downtown', time: '15 minutes ago', aiScore: 92, status: 'Pending', photos: 2, priority: 'High', tags: ['urgent','traffic','evacuation'], hasMedia: true },
    { id: 'R-2480', user: 'Anita Singh', type: 'Fire', title: 'Power lines down after storm', description: 'Electrical wires fallen across Highway 101. Blocking traffic.', location: 'Highway 101, Mile 23', time: '32 minutes ago', aiScore: 87, status: 'Pending', photos: 3, priority: 'High', tags: ['infrastructure','traffic','electrical'], hasMedia: false },
    { id: 'R-2479', user: 'Vikram Rao', type: 'Earthquake', title: 'Aftershock damages old building', description: 'Cracks observed in pillars, residents reporting tremors.', location: 'Anna Nagar, Chennai', time: '1 hour ago', aiScore: 65, status: 'Flagged', photos: 1, priority: 'Medium', tags: ['structural','assessment'], hasMedia: true },
    { id: 'R-2478', user: 'Priya Patel', type: 'Cyclone', title: 'Coastal wind surge reported', description: 'High winds and debris on roads near shoreline.', location: 'Colaba, Mumbai', time: '2 hours ago', aiScore: 52, status: 'Verified', photos: 4, priority: 'Low', tags: ['weather','roads'], hasMedia: false },
  ]);

  // Convert citizen reports to verification reports format
  const convertToVerificationReports = (citizenReports: IncidentReport[]): VerifyReport[] => {
    return citizenReports.map(report => ({
      id: report.id,
      user: user?.email || 'Citizen',
      type: report.type as IncidentType,
      title: `${report.type} - ${report.location.substring(0, 50)}`,
      description: report.description,
      location: report.location,
      time: formatRelativeTime(report.timestamp),
      aiScore: report.aiAuthenticityScore || 0,
      status: (report.verification === 'verified' ? 'Verified' : 
               report.verification === 'fake' ? 'Flagged' : 'Pending') as VerificationStatus,
      photos: report.hasMedia ? 1 : 0,
      priority: (report.aiAuthenticityScore && report.aiAuthenticityScore >= 80 ? 'High' :
                 report.aiAuthenticityScore && report.aiAuthenticityScore >= 60 ? 'Medium' : 'Low') as PriorityLevel,
      tags: report.hasMedia ? ['media', 'ai-verified'] : [],
      hasMedia: report.hasMedia,
    }));
  };
  const [bcDesc, setBcDesc] = useState('');
  const [bcTitle, setBcTitle] = useState('');
  // Broadcast state
  const [bcSeverity, setBcSeverity] = useState<'Severe' | 'Moderate' | 'Informational' | ''>('');
  const [bcType, setBcType] = useState<'Flood' | 'Fire' | 'Earthquake' | 'Cyclone' | ''>('');
  type RegionOption = { key: string; label: string; people: number };
  const REGION_OPTIONS: RegionOption[] = [
    { key:'downtown', label:'Downtown Area (25,000 people)', people: 25000 },
    { key:'coastal', label:'Coastal Districts (45,000 people)', people: 45000 },
    { key:'suburban', label:'Suburban Areas (78,000 people)', people: 78000 },
    { key:'industrial', label:'Industrial Zone (12,000 people)', people: 12000 },
    { key:'city', label:'Entire City (1,60,000 people)', people: 160000 },
  ];
  const [bcRegionKey, setBcRegionKey] = useState<RegionOption['key'] | ''>('');
  const selectedRegion = REGION_OPTIONS.find(r=>r.key===bcRegionKey);
  const [bcSending, setBcSending] = useState(false);
  const [showSeverityMenu, setShowSeverityMenu] = useState(false);
  const [showBcLanguageMenu, setShowBcLanguageMenu] = useState(false);
  const [showRegionMenu, setShowRegionMenu] = useState(false);
  const [bcLanguage, setBcLanguage] = useState<'English'|'Hindi'|'Gujarati'|'Marathi'|'Bengali'|'Tamil'|'Telugu'|'Kannada'|'Punjabi'|'Urdu'|''>('');
  const [bcChannels, setBcChannels] = useState<Set<string>>(new Set());
  const [showBcPreview, setShowBcPreview] = useState(false);
  const toggleChannel = (name: string) => {
    setBcChannels(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };
  const QUICK_TEMPLATES = [
    {
      severity: 'Severe' as const,
      title: 'Flood Warning',
      message: 'Flash flooding is imminent in your area. Move to higher ground immediately. Avoid driving through flooded roads.',
    },
    {
      severity: 'Severe' as const,
      title: 'Evacuation Notice',
      message: 'Mandatory evacuation order has been issued for your area. Report to the designated evacuation center immediately.',
    },
    {
      severity: 'Moderate' as const,
      title: 'Weather Warning',
      message: 'Severe weather conditions expected. Stay indoors and avoid unnecessary travel.',
    },
    {
      severity: 'Informational' as const,
      title: 'All Clear',
      message: 'The emergency situation has been resolved. Normal activities may resume. Continue to monitor for updates.',
    },
  ];
  // Resources data for Resource Management tab
  const [resourcesTab, setResourcesTab] = useState<'teams'|'shelters'|'supplies'>('teams');
  const teams = [
    { id:'T-1', name:'Alpha Rescue Team', role:'Rescue Team', status:'deployed' as const, location:'Flood Zone A', members:8, lastUpdate:'15 minutes ago', equipment:['Boats','Life Jackets','Radio'] },
    { id:'T-2', name:'Medical Unit Bravo', role:'Medical Team', status:'standby' as const, location:'Base Hospital', members:6, lastUpdate:'30 minutes ago', equipment:['Ambulance','Medical Kit','Oxygen'] },
    { id:'T-3', name:'Fire Response Charlie', role:'Fire Team', status:'deployed' as const, location:'Industrial District', members:12, lastUpdate:'5 minutes ago', equipment:['Fire Truck','Hoses','SCBA'] },
  ];
  const shelters = [
    { id:'S-1', name:'Community Sports Center', type:'Evacuation Center', status:'operational' as const, capacity:500, occupancy:325, location:'123 Sports Complex Ave', contact:'+1-555-0123', facilities:['Kitchen','Medical Station','Showers','WiFi'] },
    { id:'S-2', name:'City Hall Emergency Shelter', type:'Emergency', status:'operational' as const, capacity:200, occupancy:180, location:'456 Government St', contact:'+1-555-0456', facilities:['Basic Amenities','Security','Communication'] },
  ];
  const supplies = [
    { id:'SP-1', name:'Emergency Food Rations', category:'Food', status:'available' as const, quantityLabel:'5,000 meals', location:'Warehouse A', expiry:'2025-12-31' },
    { id:'SP-2', name:'Bottled Water', category:'Water', status:'available' as const, quantityLabel:'10,000 bottles', location:'Warehouse B' },
    { id:'SP-3', name:'First Aid Kits', category:'Medical', status:'available' as const, quantityLabel:'200 kits', location:'Medical Center' },
    { id:'SP-4', name:'Emergency Blankets', category:'Blankets', status:'distributed' as const, quantityLabel:'1,500 blankets', location:'Distribution Center' },
  ];
  const activeTeams = teams.filter(t=>t.status==='deployed').length;
  const peopleSheltered = shelters.reduce((sum,s)=>sum + s.occupancy, 0);
  const supplyCategories = new Set(supplies.map(s=>s.category)).size;
  const responsePersonnel = teams.reduce((sum,t)=>sum + t.members, 0);
  const OFFICIAL_ROLE_OPTIONS = [
    { value: 'admin', title: 'System Administrator', desc: 'Full system access and management' },
    { value: 'field', title: 'Field Officer', desc: 'Field operations and report management' },
    { value: 'responder', title: 'Emergency Responder', desc: 'Incident response and resource coordination' },
  ] as const;
  const [showSosConfirm, setShowSosConfirm] = useState(false);
  const [showSosCountdown, setShowSosCountdown] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(5);
  // Citizen Alerts: selected alert + details modal
  const [selectedAlert, setSelectedAlert] = useState<DisasterAlert | null>(null);
  const [showAlertDetails, setShowAlertDetails] = useState(false);
  const detailsShotRef = useRef<ViewShot>(null);
  const sosTimerRef = useRef<any>(null);
  const SOS_CALL_NUMBER = '112';
  const SOS_LOCATION_TEXT = '123 Main Street, City Center';

  const startSosCountdown = () => {
    // Ensure confirm modal closed and countdown visible
    setShowSosConfirm(false);
    setSosCountdown(5);
    setShowSosCountdown(true);
    if (sosTimerRef.current) {
      clearInterval(sosTimerRef.current);
      sosTimerRef.current = null;
    }
    sosTimerRef.current = setInterval(() => {
      setSosCountdown((prev: number) => {
        const next = prev - 1;
        if (next <= 0) {
          if (sosTimerRef.current) {
            clearInterval(sosTimerRef.current);
            sosTimerRef.current = null;
          }
          setShowSosCountdown(false);
          setSosCountdown(5);
          setSosActive(true);
          Alert.alert(
            'Emergency SOS Activated',
            'Emergency services have been notified of your location.',
            [{ text: 'OK' }]
          );
          return 0;
        }
        return next;
      });
    }, 1000);
  };

  const cancelSosCountdown = () => {
    if (sosTimerRef.current) {
      clearInterval(sosTimerRef.current);
      sosTimerRef.current = null;
    }
    setShowSosCountdown(false);
    setSosCountdown(5);
  };

  useEffect(() => {
    return () => {
      if (sosTimerRef.current) {
        clearInterval(sosTimerRef.current);
      }
    };
  }, []);
  const [isOffline, setIsOffline] = useState(false);
  const [showMapView, setShowMapView] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  // Translator helper
  const t = (key: string, vars?: Record<string, string | number>) => {
    const dict = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
    let str = (dict[key] || TRANSLATIONS.en[key] || key) as string;
    if (vars) {
      Object.keys(vars).forEach(k => {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(vars[k]));
      });
    }
    return str;
  };
  // Report location derived from photo metadata (EXIF)
  const [reportCoords, setReportCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [reportAddress, setReportAddress] = useState<string>('123 Main Street, Downtown District');
  const [reportLocationSource, setReportLocationSource] = useState<'photo' | 'device' | null>(null);
  // Facilities: track user's coordinates for distance computation
  const [facilitiesUserCoords, setFacilitiesUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [facilityAddresses, setFacilityAddresses] = useState<Record<string, string>>({});
  // Facilities filters and search
  const [facilitySearch, setFacilitySearch] = useState('');
  const [facilityTypeFilter, setFacilityTypeFilter] = useState<'all'|'hospital'|'shelter'|'relief_camp'|'police_station'>('all');
  const [facilityRadiusKm, setFacilityRadiusKm] = useState<number | null>(null); // null = no radius filter

  // Haversine distance in km
  const distanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };
  const formatDistance = (km: number) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`);

  // Handle navigation to safe zone
  const handleNavigateToSafeZone = async (lat: number, lng: number, name: string) => {
    try {
      // Try to open in Google Maps first (most common)
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(name)}`;
      const canOpenGoogleMaps = await Linking.canOpenURL(googleMapsUrl);
      
      if (canOpenGoogleMaps) {
        await Linking.openURL(googleMapsUrl);
        return;
      }

      // Fallback to Apple Maps on iOS or generic maps
      if (Platform.OS === 'ios') {
        const appleMapsUrl = `http://maps.apple.com/?daddr=${lat},${lng}&dirflg=w`;
        const canOpenAppleMaps = await Linking.canOpenURL(appleMapsUrl);
        if (canOpenAppleMaps) {
          await Linking.openURL(appleMapsUrl);
          return;
        }
      }

      // Final fallback - generic geo URL
      const geoUrl = `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(name)})`;
      await Linking.openURL(geoUrl);
      
    } catch (error) {
      console.log('Navigation error:', error);
      Alert.alert(
        'Navigation Error',
        `Unable to open maps. You can manually navigate to:\nLatitude: ${lat}\nLongitude: ${lng}`,
        [{ text: 'OK' }]
      );
    }
  };

  async function updateLocationFromExif(exif?: any): Promise<boolean> {
    try {
      if (!exif) return false;
      // Try common EXIF keys for GPS
      let lat: any = exif.GPSLatitude ?? exif.gpsLatitude ?? exif.latitude;
      let lon: any = exif.GPSLongitude ?? exif.gpsLongitude ?? exif.longitude;
      const latRef: string | undefined = exif.GPSLatitudeRef ?? exif.gpsLatitudeRef;
      const lonRef: string | undefined = exif.GPSLongitudeRef ?? exif.gpsLongitudeRef;

      const toNumber = (v: any): number | null => {
        if (v == null) return null;
        if (typeof v === 'number') return v;
        if (Array.isArray(v)) {
          // Some EXIF encodes as [deg, min, sec]
          const [d, m, s] = v;
          if ([d, m, s].every((x) => typeof x === 'number')) return d + m / 60 + s / 3600;
        }
        const n = parseFloat(String(v));
        return isNaN(n) ? null : n;
      };

  let latNum = toNumber(lat);
  let lonNum = toNumber(lon);
  if (latNum == null || lonNum == null) return false;
      if (latRef === 'S') latNum = -Math.abs(latNum);
      if (lonRef === 'W') lonNum = -Math.abs(lonNum);

      setReportCoords({ lat: latNum, lon: lonNum });
      setReportLocationSource('photo');

      // Try reverse geocoding to a human-readable address
      try {
        const results = await Location.reverseGeocodeAsync({ latitude: latNum, longitude: lonNum });
        if (results && results.length > 0) {
          const r = results[0];
          const parts = [r.name, r.street, r.district, r.city || r.subregion, r.region, r.postalCode]
            .filter(Boolean)
            .slice(0, 3);
          if (parts.length > 0) {
            setReportAddress(parts.join(', '));
          } else {
            setReportAddress(`${latNum.toFixed(5)}, ${lonNum.toFixed(5)}`);
          }
        } else {
          setReportAddress(`${latNum.toFixed(5)}, ${lonNum.toFixed(5)}`);
        }
      } catch (e) {
        // If reverse geocode fails (e.g., no service), fallback to coordinates
        setReportAddress(`${latNum.toFixed(5)}, ${lonNum.toFixed(5)}`);
      }
      return true;
    } catch {
      // noop
      return false;
    }
  }

  // Helper to request and set current device location (used for Update button and EXIF fallback)
  const getAndSetCurrentLocation = async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('locationPermissionTitle'), t('locationPermissionBody'));
        return false;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = pos.coords;
      setReportCoords({ lat: latitude, lon: longitude });
      setReportLocationSource('device');
      try {
        const results = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (results && results.length > 0) {
          const r = results[0];
          const parts = [r.name, r.street, r.district, r.city || r.subregion, r.region, r.postalCode].filter(Boolean).slice(0, 3);
          setReportAddress(parts.length > 0 ? parts.join(', ') : `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        } else {
          setReportAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        }
      } catch {
        setReportAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
      }
      return true;
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Unable to get current location.');
      return false;
    }
  };

  // After media selection/capture, try EXIF GPS; if missing, fall back to device GPS automatically
  const ensureLocationAfterMedia = async (exif?: any) => {
    const updatedFromExif = await updateLocationFromExif(exif);
    if (!updatedFromExif) {
      await getAndSetCurrentLocation();
    }
  };
  
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const LANGUAGE_OPTIONS = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी (Hindi)' },
    { code: 'bn', label: 'বাংলা (Bengali)' },
    { code: 'te', label: 'తెలుగు (Telugu)' },
    { code: 'mr', label: 'मराठी (Marathi)' },
    { code: 'ta', label: 'தமிழ் (Tamil)' },
    { code: 'gu', label: 'ગુજરાતી (Gujarati)' },
    { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
    { code: 'ml', label: 'മലയാളം (Malayalam)' },
    { code: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)' },
    { code: 'or', label: 'ଓଡ଼ିଆ (Odia)' },
    { code: 'as', label: 'অসমীয়া (Assamese)' },
    { code: 'ur', label: 'اردو (Urdu)' },
  ];
  const [facilityFilter, setFacilityFilter] = useState('all');
  const [facilityView, setFacilityView] = useState<'map' | 'list'>('list');
  // Facilities map ref for fitting/animate
  const facilitiesMapRef = useRef<MapView | null>(null);
  // Helper: fit facilities (and user) into view
  const fitFacilities = useCallback(() => {
    const map = facilitiesMapRef.current;
    if (!map) return;
    // Apply same filters as list
    const filtered = MUMBAI_FACILITIES.filter((f) => {
      const matchesType = facilityTypeFilter === 'all' || f.type === facilityTypeFilter;
      const query = facilitySearch.trim().toLowerCase();
      const matchesSearch =
        !query ||
        f.name.toLowerCase().includes(query) ||
        (facilityAddresses[f.id] || f.address).toLowerCase().includes(query);
      if (!matchesType || !matchesSearch) return false;
      if (facilityRadiusKm != null && facilitiesUserCoords) {
        const km = distanceKm(
          facilitiesUserCoords.lat,
          facilitiesUserCoords.lon,
          f.coordinates.lat,
          f.coordinates.lng
        );
        return km <= facilityRadiusKm;
      }
      return true;
    })
      .map((f) => ({ latitude: f.coordinates.lat, longitude: f.coordinates.lng }));
    if (facilitiesUserCoords) {
      filtered.push({ latitude: facilitiesUserCoords.lat, longitude: facilitiesUserCoords.lon });
    }
    if (filtered.length) {
      map.fitToCoordinates(filtered as any, {
        edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
        animated: false,
      });
    }
  }, [facilityTypeFilter, facilitySearch, facilityRadiusKm, facilitiesUserCoords]);

  // Auto-fit when opening Facilities map or when filters/user location change while on map view
  useEffect(() => {
    if (activeTab === 'facilities' && facilityView === 'map') {
      const id = setTimeout(() => fitFacilities(), 0);
      return () => clearTimeout(id);
    }
  }, [activeTab, facilityView, fitFacilities]);
  const [liveHazardUpdates, setLiveHazardUpdates] = useState(true);
  // Hazard zones are always visible (danger, moderate, safe)
  const [zonesUserCoords, setZonesUserCoords] = useState<{ lat: number; lon: number } | null>(null);

  // Acquire user location when viewing Zones if needed
  useEffect(() => {
    let cancelled = false;
    const ensureLocation = async () => {
      try {
        if (activeTab === 'zones' && !zonesUserCoords) {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') return;
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          if (!cancelled) setZonesUserCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        }
      } catch (e) {
        // ignore for now; status card will fallback
      }
    };
    ensureLocation();
    return () => { cancelled = true; };
  }, [activeTab, zonesUserCoords]);
  
  // Report form state
  const [showIncidentDropdown, setShowIncidentDropdown] = useState(false);
  const [selectedIncidentType, setSelectedIncidentType] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [showFileOptions, setShowFileOptions] = useState(false);
  const [showCameraView, setShowCameraView] = useState(false);
  const [attachedMedia, setAttachedMedia] = useState<{ uri: string; fileName?: string; fileSize?: number; mimeType?: string } | null>(null);
  const [showImageViewer, setShowImageViewer] = useState(false);
  // Voice recording state for report voice alert
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Cross-platform recording options (more reliable than generic HIGH_QUALITY in some iOS cases)
  const RECORDING_OPTIONS: Audio.RecordingOptions = {
    android: {
      extension: '.m4a',
      outputFormat: Audio.AndroidOutputFormat.MPEG_4,
      audioEncoder: Audio.AndroidAudioEncoder.AAC,
      sampleRate: 44100,
      numberOfChannels: 1,
      bitRate: 128000,
    },
    ios: {
      extension: '.m4a',
      outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
  audioQuality: Audio.IOSAudioQuality.MEDIUM,
      sampleRate: 44100,
      numberOfChannels: 1,
      bitRate: 128000,
      linearPCMBitDepth: 16,
      linearPCMIsBigEndian: false,
      linearPCMIsFloat: false,
    },
    web: {
      mimeType: 'audio/webm',
      bitsPerSecond: 128000,
    },
  };
  
  // ===== Voice recording helpers =====
  const startRecording = async () => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Microphone', 'Microphone access is required to record a voice alert.');
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        interruptionModeIOS: InterruptionModeIOS.DuckOthers,
        shouldDuckAndroid: true,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
  playThroughEarpieceAndroid: false,
      });
  const rec = new Audio.Recording();
  await rec.prepareToRecordAsync(RECORDING_OPTIONS);
  // Small delay can help iOS stabilize session activation
  await new Promise((r) => setTimeout(r, 120));
  await rec.startAsync();
      setRecording(rec);
      setIsRecording(true);
      // Clear previous audio if any
      if (sound) {
        try { await sound.unloadAsync(); } catch {}
        setSound(null);
      }
      setRecordedAudioUri(null);
    } catch (e: any) {
      console.error(e);
      const msg = String(e?.message || e);
      if (msg.includes('NSOSStatusErrorDomain') || msg.includes('Session activation failed')) {
        // One-time retry with more permissive mode and a different creation path
        try {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
            shouldDuckAndroid: true,
            interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
            playThroughEarpieceAndroid: false,
          });
          const { recording: rec2 } = await Audio.Recording.createAsync(RECORDING_OPTIONS);
          setRecording(rec2);
          setIsRecording(true);
          if (sound) { try { await sound.unloadAsync(); } catch {} setSound(null); }
          setRecordedAudioUri(null);
          return;
        } catch (retryErr) {
          console.error('Retry failed', retryErr);
          Alert.alert(
            'Microphone error',
            'Recording could not start. If you are on iOS Simulator, recording is not supported. Otherwise, try on a physical device, ensure the microphone permission is granted, and close other apps using audio (e.g., calls/voice memos/music).'
          );
        }
      } else {
        Alert.alert('Error', 'Unable to start recording.');
      }
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordedAudioUri(uri || null);
      setRecording(null);
      setIsRecording(false);
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        interruptionModeIOS: InterruptionModeIOS.DuckOthers,
        shouldDuckAndroid: true,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
  playThroughEarpieceAndroid: false,
      });
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Unable to stop recording.');
    }
  };

  const togglePlayPause = async () => {
    try {
      if (!recordedAudioUri) return;
      if (!sound) {
        const { sound: s } = await Audio.Sound.createAsync(
          { uri: recordedAudioUri },
          { shouldPlay: true },
          (status) => {
            // @ts-ignore - status typing
            if (status.isLoaded) {
              // @ts-ignore
              setIsPlaying(!!status.isPlaying);
              // @ts-ignore
              if (status.didJustFinish) {
                setIsPlaying(false);
              }
            }
          }
        );
        setSound(s);
        setIsPlaying(true);
        return;
      }
      const st = await sound.getStatusAsync();
      // @ts-ignore
      if (st.isLoaded && st.isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const removeAudio = async () => {
    try {
      if (sound) {
        try { await sound.unloadAsync(); } catch {}
        setSound(null);
      }
      setIsPlaying(false);
      setRecordedAudioUri(null);
    } catch {}
  };

  // Cleanup loaded sound on unmount (via ref to avoid ordering issues)
  const soundRef = useRef<Audio.Sound | null>(null);
  useEffect(() => { soundRef.current = sound; }, [sound]);
  useEffect(() => {
    return () => {
      const s = soundRef.current;
      if (s) { s.unloadAsync().catch(() => {}); }
    };
  }, []);
  // Citizen 'Your Reports' list (initialize with samples)
  const [myReports, setMyReports] = useState<IncidentReport[]>([...SAMPLE_REPORTS]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    initializeApp();
  }, []);

  // Socket.IO connection effect
  useEffect(() => {
    if (user && (currentState === 'citizenApp' || currentState === 'officialsApp')) {
      console.log('🔌 Connecting to Socket.IO server...');
      console.log('👤 User:', user.email, '| Role:', user.role);
      
      SocketService.connect(user)
        .then(() => {
          console.log('✅ Socket.IO connected successfully');
          console.log('🔗 Socket ID:', SocketService.getSocketId());
          setIsSocketConnected(true);
          
          // If citizen, start location tracking
          if (currentState === 'citizenApp') {
            startLocationTracking();
            
            // Listen for disaster alerts
            SocketService.onDisasterAlert((alert: any) => {
              console.log('🚨 Received disaster alert:', alert.title);
              Alert.alert(
                '🚨 DISASTER ALERT',
                `${alert.severity.toUpperCase()}: ${alert.title}\n\n${alert.description}`,
                [{ text: 'OK' }]
              );
            });
          }
          
          // If official, listen for citizen locations and sync reports
          if (currentState === 'officialsApp') {
            setupOfficialLocationListener();
            
            // Listen for new incident reports from citizens
            SocketService.onIncidentReport((report) => {
              console.log('📥 Received incident report:', report.id);
              
              // Convert to verification report format (cast to avoid type conflicts)
              const verifyReport = convertToVerificationReports([report as any])[0];
              
              // Check if report already exists, update it or add new
              setReports(prev => {
                const existingIndex = prev.findIndex(r => r.id === verifyReport.id);
                if (existingIndex >= 0) {
                  // Update existing report (AI score arrived)
                  console.log('🔄 Updating existing report with new data:', verifyReport.id);
                  const updated = [...prev];
                  updated[existingIndex] = verifyReport;
                  return updated;
                } else {
                  // Add new report
                  console.log('➕ Adding new report to verification screen:', verifyReport.id);
                  // Show notification only for new reports
                  Alert.alert(
                    '📋 New Report Received',
                    `New ${report.type} report from ${report.location}`,
                    [{ text: 'View', onPress: () => setActiveTab('verification' as OfficialTab) }]
                  );
                  return [verifyReport, ...prev];
                }
              });
            });
            
            // Sync citizen reports to verification screen
            console.log('📋 Syncing citizen reports to verification screen...');
            const citizenVerificationReports = convertToVerificationReports(myReports);
            setReports(prev => {
              // Merge new citizen reports with existing mock reports
              const existingIds = prev.map(r => r.id);
              const newReports = citizenVerificationReports.filter(r => !existingIds.includes(r.id));
              return [...newReports, ...prev];
            });
          }
        })
        .catch((error) => {
          console.error('❌ Socket.IO connection failed:', error.message);
          console.error('🔧 Server URL:', SocketService.getServerUrl());
          console.error('💡 Make sure the server is running on the correct IP');
          setIsSocketConnected(false);
          
          // Show user-friendly error
          Alert.alert(
            '⚠️ Connection Issue',
            'Unable to connect to alert server. You can still use the app, but you won\'t receive real-time alerts.',
            [{ text: 'OK' }]
          );
        });

      return () => {
        console.log('🔴 Disconnecting Socket.IO...');
        LocationService.stopTracking();
        SocketService.offCitizenLocation();
        SocketService.offIncidentReport();
        SocketService.disconnect();
        setIsSocketConnected(false);
      };
    }
  }, [user, currentState]);

  // Location tracking functions
  const startLocationTracking = async () => {
    if (!user) return;

    const started = await LocationService.startTracking(
      user.id,
      user.name,
      (location) => {
        // Send location to server via Socket.IO
        SocketService.sendLocation(location);
      }
    );

    if (started) {
      setIsLocationTrackingEnabled(true);
      Alert.alert(
        '📍 Location Tracking',
        'Your location will be shared with emergency officials every minute for your safety.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        '❌ Permission Denied',
        'Location permission is required for emergency tracking. Please enable it in settings.',
        [{ text: 'OK' }]
      );
    }
  };

  const setupOfficialLocationListener = () => {
    // Request all current locations
    SocketService.requestAllLocations();

    // Listen for location updates
    SocketService.onCitizenLocation((location) => {
      setCitizenLocations(prev => {
        // Update existing or add new
        const index = prev.findIndex(loc => loc.userId === location.userId);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = location;
          return updated;
        }
        return [...prev, location];
      });
    });

    // Receive all locations
    SocketService.onAllLocations((locations: LocationData[]) => {
      console.log('📍 Received all citizen locations:', locations.length);
      setCitizenLocations(locations);
    });
  };

  useEffect(() => {
    // Fade in animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  }, [currentState]);

  // Camera permissions helper using expo-image-picker
  const requestCameraPermissions = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      return { status: perm.granted ? 'granted' : 'denied' };
    } catch (error) {
      console.error('Camera permission error:', error);
      return { status: 'denied' };
    }
  };

  const formatSize = (bytes?: number): string => {
    if (!bytes || bytes <= 0) return '—';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    const kb = bytes / 1024;
    return `${Math.round(kb)} KB`;
  };

  const initializeApp = async () => {
    try {
      console.log('🚀 Initializing app...');
      await AuthService.initialize();
      const currentUser = await AuthService.getCurrentUser();
      if (currentUser && currentUser.role) {
        console.log('✅ Found existing user:', currentUser.email, 'Role:', currentUser.role);
        setUser(currentUser);
        setCurrentState(currentUser.role === 'citizen' ? 'citizenApp' : 'officialsApp');
        setActiveTab(currentUser.role === 'citizen' ? 'alerts' : 'dashboard');
      } else {
        console.log('📝 No existing user, showing landing page');
        setCurrentState('landing');
      }
    } catch (error) {
      console.error('❌ Error initializing app:', error);
      setCurrentState('landing');
    }
  };

  // Helper function to get selected incident type display text
  const getSelectedIncidentText = () => {
    const selected = INCIDENT_TYPES.find(t => t.value === selectedIncidentType);
    return selected ? selected.label : '🔥 Fire Emergency';
  };

  // Handle submit of incident report: validate required fields, append to 'Your Reports'
  const submitReport = async () => {
    const errors: string[] = [];
    if (isRecording) {
      Alert.alert('Recording in progress', 'Please stop the recording before submitting.');
      return;
    }
    if (!selectedIncidentType || !selectedIncidentType.trim()) errors.push('Please enter incident type');
    if (errors.length) {
      Alert.alert(t('missingInformation'), errors.join('\n'));
      return;
    }

    // Show verification in progress
    let detectionResult = null;
    
    // If photo attached, detect disaster type with AI
    if (attachedMedia) {
      try {
        Alert.alert('🔍 Analyzing Image', 'AI is detecting disaster type...');
        
        detectionResult = await DisasterVerificationService.detectDisaster(attachedMedia.uri);
        const topPrediction = DisasterVerificationService.getTopPrediction(detectionResult);
        
        if (topPrediction) {
          console.log('✅ AI Detection Result:', topPrediction);
          console.log('   Detected:', topPrediction.class);
          console.log('   Confidence:', (topPrediction.confidence * 100).toFixed(1) + '%');
        }
      } catch (error: any) {
        console.error('AI detection error:', error);
        Alert.alert('⚠️ Detection Failed', 'Could not analyze image. Report will be submitted anyway.');
      }
    }
    
    // Use photo location if available, otherwise use current location
    let finalReportCoords = reportCoords;
    if (!finalReportCoords) {
      try {
        Alert.alert('📍 Getting Location', 'Please wait...');
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        finalReportCoords = {
          lat: loc.coords.latitude,
          lon: loc.coords.longitude,
        };
      } catch (locErr) {
        console.error('Could not get location for report:', locErr);
        Alert.alert(t('locationError'), 'Location is required for reports');
        return;
      }
    }

    const id = `RPT-${Date.now()}`;
    const locationPrefix = t('autoDetectedPrefix');
    const locationText = reportAddress ? `${locationPrefix}${reportAddress}` : `${t('autoDetectedPrefix')}${t('currentLocation')}`;
    
    // Create initial report without AI verification
    const newReport: IncidentReport = {
      id,
      type: selectedIncidentType,
      description: reportDescription.trim(),
      location: locationText,
      timestamp: new Date().toISOString(),
      status: isOffline ? 'pending' : 'uploaded',
      hasMedia: !!attachedMedia || !!recordedAudioUri,
      verification: undefined,
      aiAuthenticityScore: undefined,
    };
    setMyReports(prev => [newReport, ...prev]);

    // Broadcast report to all officials via Socket.IO
    if (!isOffline && isSocketConnected) {
      try {
        console.log('📤 Broadcasting report to officials via Socket.IO:', id);
        await SocketService.submitIncidentReport(newReport as any);
        console.log('✅ Report broadcasted successfully');
      } catch (error) {
        console.error('❌ Failed to broadcast report:', error);
        // Continue anyway, report is saved locally
      }
    }

    // Show immediate success notification
    const cleaned = selectedIncidentType.trim();
    let successMessage = isOffline
      ? t('reportSubmitQueuedBody', { type: cleaned, id })
      : t('reportSubmitSentBody', { type: cleaned, id });
    
    Alert.alert(
      t('reportSubmittedTitle'),
      successMessage,
      [{ text: t('ok') }]
    );

    // Run authenticity verification in background (async, non-blocking)
    if (attachedMedia && finalReportCoords) {
      (async () => {
        try {
          console.log('🔐 Running authenticity verification in background...');
          
          const verificationResult = await DisasterVerificationService.verifyImageAuthenticity(
            attachedMedia.uri,
            finalReportCoords.lat,
            finalReportCoords.lon
          );
          
          // Use the 'score' field from API response as AI authenticity score (0-100)
          const authenticityScore = verificationResult.score;
          
          // Map verdict to verification status
          let verificationVerdict: 'verified' | 'pending' | 'fake' | 'unverified';
          if (authenticityScore >= 80) {
            verificationVerdict = 'verified';
          } else if (authenticityScore >= 60) {
            verificationVerdict = 'pending';
          } else if (authenticityScore >= 40) {
            verificationVerdict = 'pending';
          } else {
            verificationVerdict = 'fake';
          }
          
          console.log('✅ Using AI Authenticity Score from /verify API');
          console.log('   Score:', authenticityScore + '/100');
          console.log('   Detected Class:', verificationResult.detection.class);
          console.log('   Verdict:', verificationResult.verdict);
          console.log('   Mapped Status:', verificationVerdict);
          
          // Update the report with AI scores
          const updatedReport = { 
            ...newReport, 
            aiAuthenticityScore: authenticityScore, 
            verification: verificationVerdict 
          };
          
          setMyReports(prev => prev.map(report => 
            report.id === id ? updatedReport : report
          ));
          
          // Broadcast updated report to all officials via Socket.IO
          // The report will be received via socket listener and updated automatically
          if (isSocketConnected) {
            try {
              console.log('📤 Broadcasting updated report with AI score to officials:', id);
              await SocketService.submitIncidentReport(updatedReport as any);
              console.log('✅ Updated report broadcasted with AI score:', authenticityScore);
            } catch (error) {
              console.error('❌ Failed to broadcast updated report:', error);
            }
          }
          
        } catch (error: any) {
          console.error('❌ Authenticity verification failed:', error);
          console.log('   Report will remain without authenticity score');
        }
      })();
    } else {
      // If no photo, add to verification screen immediately
      if (currentState === 'officialsApp') {
        const verifyReport = convertToVerificationReports([newReport])[0];
        setReports(prev => [verifyReport, ...prev]);
        console.log('📋 Added report without photo to verification screen:', id);
      }
    }

    // Reset form for next report
    setSelectedIncidentType('');
    setReportDescription('');
    setAttachedMedia(null);
    // Reset audio state
    if (sound) { try { sound.unloadAsync(); } catch {} }
    setSound(null);
    setIsPlaying(false);
    setRecordedAudioUri(null);
    // Keep location/address for convenience
  };

  const handleLogin = async (email?: string, password?: string) => {
    try {
      console.log('🔐 Attempting login...');
      const loggedInUser = await AuthService.login(email || 'demo@example.com', password || 'password');
      console.log('✅ Login successful:', loggedInUser.email);
      setUser(loggedInUser);
      
      if (loggedInUser.role) {
        console.log('👤 User has role:', loggedInUser.role);
        setCurrentState(loggedInUser.role === 'citizen' ? 'citizenApp' : 'officialsApp');
        setActiveTab(loggedInUser.role === 'citizen' ? 'alerts' : 'dashboard');
      } else {
        console.log('❓ User needs to select role');
        setCurrentState('roleSelection');
      }
    } catch (error) {
      console.error('❌ Login failed:', error);
      Alert.alert('Login Failed', 'Please try again');
    }
  };

  const handleRoleSelection = (role: 'citizen' | 'official') => {
    if (user) {
      console.log('🎭 Role selected:', role);
      const updatedUser = { ...user, role };
      setUser(updatedUser);
      setCurrentState(role === 'citizen' ? 'citizenApp' : 'officialsApp');
      setActiveTab(role === 'citizen' ? 'alerts' : 'dashboard');
    }
  };

  // Direct launch helpers from Landing cards
  const launchCitizenAppDirect = () => {
    const demoUser: any = user && user.email ? { ...user, role: 'citizen' } : { email: 'citizen@demo.com', role: 'citizen' };
    setUser(demoUser);
    setCurrentState('citizenApp');
    setActiveTab('alerts');
  };

  const continueOfficialLogin = () => {
    if (!officialRole || !officialUsername || !officialPassword) return;
    const emailFromUser = officialUsername.includes('@') ? officialUsername : `${officialUsername}@ems.gov`;
    const demoUser: any = { email: emailFromUser, role: 'official', officialRole };
    setUser(demoUser);
    setCurrentState('officialsApp');
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    console.log('🚪 Logging out...');
    setUser(null);
    setCurrentState('landing');
  };

  // Share an alert using the native share sheet
  const handleShareAlert = async (alert: DisasterAlert) => {
    try {
      const title = `ALERT: ${alert.title} (${alert.severity})`;
      const issued = formatRelativeTime(alert.timestamp);
      const lines = [
        title,
        `Location: ${alert.location}`,
        `Issued: ${issued}`,
        `Radius: ${alert.radius} km | Language: ${alert.language}`,
        '',
        alert.description,
      ];
      if (alert.instructions?.length) {
        lines.push('', 'Safety Instructions:');
        lines.push(
          ...alert.instructions.slice(0, 5).map((i) => `• ${i}`)
        );
      }
      lines.push('', '— Shared via SurakshaSetu');
      await Share.share({ message: lines.join('\n') });
    } catch (e) {
      console.error('Share failed', e);
      Alert.alert('Share Failed', 'Unable to open the share sheet at this time.');
    }
  };

  // Share alert card as image (for apps that prefer images)
  const handleShareAlertImage = async () => {
    try {
      if (!detailsShotRef.current) return;
  const uri = await detailsShotRef.current.capture?.();
      if (uri && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(uri, { dialogTitle: selectedAlert ? `Share: ${selectedAlert.title}` : 'Share Alert' });
      } else if (uri) {
        await Share.share({ url: uri, message: 'Alert from SurakshaSetu' });
      }
    } catch (e) {
      console.error('Share image failed', e);
      Alert.alert('Share Failed', 'Unable to share the image at this time.');
    }
  };

  // Open directions in native maps app using a simple query to the alert's location text
  const openDirections = (alert: DisasterAlert) => {
    const query = encodeURIComponent(alert.location);
    const url = Platform.select({ ios: `http://maps.apple.com/?q=${query}`, android: `geo:0,0?q=${query}` });
  if (url) Linking.openURL(url).catch(() => Alert.alert(t('errorTitle'), t('couldNotOpenMaps')));
  };

  // Loading Screen
  if (currentState === 'loading') {
    return <LoadingScreen />;
  }

  // Login Screen
  if (currentState === 'login') {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <StatusBar style="light" />
          <LinearGradient
            colors={['#1e40af', '#3b82f6', '#60a5fa']}
            style={styles.loginGradient}
          >
            <Animated.View 
              style={[
                styles.loginContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              {/* Emergency Header */}
              <View style={styles.emergencyHeader}>
                <LinearGradient
                  colors={['#dc2626', '#ef4444']}
                  style={styles.emergencyBadge}
                >
                  <MaterialIcons name="emergency" size={32} color="white" />
                </LinearGradient>
                <Text style={styles.appTitle}>CRISIS CONNECT</Text>
                <Text style={styles.appSubtitle}>Emergency Management System</Text>
              </View>

              {/* Login Form */}
              <View style={styles.loginCard}>
                <Text style={styles.loginTitle}>Secure Access</Text>
                <Text style={styles.loginDescription}>
                  Connect to the emergency response network
                </Text>

                <Pressable 
                  style={({ pressed }) => [
                    styles.primaryLoginButton,
                    pressed && styles.buttonPressed
                  ]}
                  onPress={() => handleLogin()}
                >
                  <LinearGradient
                    colors={['#dc2626', '#ef4444']}
                    style={styles.buttonGradient}
                  >
                    <MaterialIcons name="flash-on" size={24} color="white" />
                    <Text style={styles.primaryButtonText}>Quick Access</Text>
                  </LinearGradient>
                </Pressable>

                <Pressable 
                  style={({ pressed }) => [
                    styles.secondaryLoginButton,
                    pressed && styles.buttonPressed
                  ]}
                  onPress={() => handleLogin('user@example.com', 'password')}
                >
                  <Ionicons name="shield-checkmark" size={20} color="#1e40af" />
                  <Text style={styles.secondaryLoginText}>Secure Login</Text>
                </Pressable>

                {/* Features Preview */}
                <View style={styles.featuresPreview}>
                  <View style={styles.featureItem}>
                    <Ionicons name="warning" size={16} color="#f59e0b" />
                    <Text style={styles.featureText}>Real-time Alerts</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <MaterialIcons name="location-on" size={16} color="#10b981" />
                    <Text style={styles.featureText}>GPS Tracking</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <MaterialCommunityIcons name="shield-account" size={16} color="#8b5cf6" />
                    <Text style={styles.featureText}>Secure Access</Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          </LinearGradient>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  // Official Access Login Screen
  if (currentState === 'officialLogin') {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex:1 }}>
          <ScrollView style={styles.featuresContainer} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 30 }}>
            <View style={{ padding: 16 }}>
              <Pressable style={styles.backButtonContainer} onPress={() => setCurrentState('landing')}>
                <Ionicons name="arrow-back" size={16} color="#1e293b" />
                <Text style={{ color: '#1e293b', fontWeight: '600' }}>Back to Home</Text>
              </Pressable>

              <View style={{ alignItems: 'center', marginTop: 12, marginBottom: 16 }}>
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <Ionicons name="shield-checkmark" size={28} color="#111827" />
                </View>
                <Text style={{ fontSize: 24, fontWeight: '800', color: '#111827' }}>Official Access</Text>
                <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>Emergency Management System Login</Text>
              </View>

              <View style={styles.officialLoginCard}>
                <Text style={styles.officialLoginTitle}>Login Credentials</Text>
                <Text style={styles.formLabel}>Role</Text>
                <Pressable
                  onPress={() => setShowOfficialRoleDropdown(!showOfficialRoleDropdown)}
                  style={[styles.selectButton, showOfficialRoleDropdown && styles.selectButtonActive]}
                >
                  <Text style={styles.selectText}>
                    {officialRole ? OFFICIAL_ROLE_OPTIONS.find(o => o.value === officialRole)?.title : 'Select your role'}
                  </Text>
                  <Text style={[styles.dropdownArrow, showOfficialRoleDropdown && styles.dropdownArrowUp]}>▼</Text>
                </Pressable>

                {showOfficialRoleDropdown && (
                  <View style={[styles.dropdownMenu, { marginBottom: 12 }]}>
                    {OFFICIAL_ROLE_OPTIONS.map(opt => (
                      <Pressable
                        key={opt.value}
                        onPress={() => {
                          setOfficialRole(opt.value);
                          setShowOfficialRoleDropdown(false);
                        }}
                        style={[styles.dropdownItem, officialRole === opt.value && styles.dropdownItemSelected]}
                      >
                        <Text style={[styles.dropdownItemText, officialRole === opt.value && styles.dropdownItemTextSelected]}>{opt.title}</Text>
                        <Text style={styles.dropdownItemDesc}>{opt.desc}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}

                {/* Username */}
                <Text style={styles.formLabel}>Username</Text>
                <View style={styles.officialInput}>
                  <Ionicons name="person-outline" size={16} color="#6b7280" style={styles.officialInputIcon} />
                  <TextInput
                    placeholder="Enter your username"
                    placeholderTextColor="#9ca3af"
                    value={officialUsername}
                    onChangeText={setOfficialUsername}
                    style={styles.officialInputField}
                  />
                </View>

                {/* Password */}
                <Text style={styles.formLabel}>Password</Text>
                <View style={styles.officialInput}>
                  <Ionicons name="lock-closed-outline" size={16} color="#6b7280" style={styles.officialInputIcon} />
                  <TextInput
                    placeholder="Enter your password"
                    placeholderTextColor="#9ca3af"
                    value={officialPassword}
                    onChangeText={setOfficialPassword}
                    style={styles.officialInputField}
                    secureTextEntry={!showPassword}
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.officialPasswordToggle}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#6b7280" />
                  </Pressable>
                </View>

                <Pressable
                  style={[
                    styles.launchButton,
                    (!officialRole || !officialUsername || !officialPassword)
                      ? styles.buttonDisabled
                      : { backgroundColor: '#111827' },
                  ]}
                  disabled={!officialRole || !officialUsername || !officialPassword}
                  onPress={continueOfficialLogin}
                >
                  <Text style={styles.launchButtonText}>Continue</Text>
                </Pressable>
              </View>

              <View style={styles.demoCredsCard}>
                <Text style={styles.demoCredsTitle}>Demo Credentials:</Text>
                <Text style={styles.demoCredsText}>Username: demo_admin</Text>
                <Text style={styles.demoCredsText}>Password: demo123</Text>
                <Text style={[styles.demoCredsText, { color: '#9ca3af', marginTop: 6 }]}>Any role can be selected for demonstration</Text>
              </View>
            </View>
          </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  // Role Selection Screen
  if (currentState === 'roleSelection') {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <StatusBar style="dark" />
          <Animated.View 
            style={[
              styles.roleContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <Text style={styles.title}>Choose Your Role</Text>
            <Text style={styles.subtitle}>
              Select how you'll use the Crisis Connect system
            </Text>
            
            <Pressable 
              style={({ pressed }) => [
                styles.roleButton,
                styles.citizenCard,
                pressed && styles.buttonPressed
              ]}
              onPress={() => handleRoleSelection('citizen')}
            >
              <View style={styles.featureHeader}>
                <View style={[styles.featureIconContainer, styles.citizenIcon]}>
                  <Ionicons name="people" size={28} color="#10b981" />
                </View>
                <Text style={styles.roleTitle}>Citizen</Text>
              </View>
              <Text style={styles.roleDescription}>
                Report emergencies, receive critical alerts, locate safe zones and emergency facilities in your area
              </Text>
            </Pressable>
            
            <Pressable 
              style={({ pressed }) => [
                styles.roleButton,
                styles.officialCard,
                pressed && styles.buttonPressed
              ]}
              onPress={() => handleRoleSelection('official')}
            >
              <View style={styles.featureHeader}>
                <View style={[styles.featureIconContainer, styles.officialIcon]}>
                  <MaterialIcons name="security" size={28} color="#3b82f6" />
                </View>
                <Text style={styles.roleTitle}>Emergency Official</Text>
              </View>
              <Text style={styles.roleDescription}>
                Manage crisis response, verify incident reports, broadcast alerts, and coordinate emergency operations
              </Text>
            </Pressable>
          </Animated.View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  // Landing Page - EXACT implementation as per guide
  if (currentState === 'landing') {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <StatusBar style="dark" />
          <ScrollView style={styles.landingScrollView} showsVerticalScrollIndicator={false}>
            {/* Header Section */}
            <View style={styles.landingHeader}>
              <View style={styles.govBadgeRow}>
                <Text style={styles.govBadgeText}>🏛️ {t('governmentAuthorized')}</Text>
              </View>
              <View style={styles.mainTitleRow}>
                <Text style={styles.mainTitle}>SurakshaSetu</Text>
                <View style={styles.brandBadge}>
                  <MaterialCommunityIcons name="shield-check" size={16} color="#3730a3" />
                </View>
              </View>
              <View style={styles.tricolorBar}>
                <View style={[styles.colorStripe, { backgroundColor: '#FF9933' }]} />
                <View style={[styles.colorStripe, { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#e5e7eb' }]} />
                <View style={[styles.colorStripe, { backgroundColor: '#138808' }]} />
              </View>
              <Text style={styles.mainSubtitle}>Comprehensive disaster response platform for citizens and emergency officials</Text>
              <Text style={styles.issuedBy}>{t('issuedByDMA')}</Text>
            </View>

            {/* Card 1: Citizen App */}
            <Pressable 
              style={({ pressed }) => [
                styles.landingCard,
                pressed && styles.cardPressed
              ]}
              onPress={launchCitizenAppDirect}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardIconContainer}>
                  <Ionicons name="phone-portrait" size={32} color="#111827" />
                </View>
                <Text style={styles.cardTitle}>Citizen App</Text>
              </View>
              
              <Text style={styles.cardDescription}>
                Report incidents, receive alerts, find emergency facilities, and access safety information
              </Text>

              <View style={styles.badgeContainer}>
                <View style={styles.featureBadge}> 
                  <Text style={styles.badgeText}>Real-time Alerts</Text>
                </View>
                <View style={styles.featureBadge}>
                  <Text style={styles.badgeText}>SOS Emergency</Text>
                </View>
                <View style={styles.featureBadge}>
                  <Text style={styles.badgeText}>Incident Reporting</Text>
                </View>
                <View style={styles.featureBadge}>
                  <Text style={styles.badgeText}>Offline Support</Text>
                </View>
                <View style={styles.featureBadge}>
                  <Text style={styles.badgeText}>Multilingual</Text>
                </View>
              </View>

                            <TouchableOpacity style={[styles.launchButton,{ backgroundColor:'#111827' }]} onPress={launchCitizenAppDirect}>
                <Text style={[styles.launchButtonText,{ color:'#ffffff' }]}>Launch Citizen App</Text>

              </TouchableOpacity>
            </Pressable>

            {/* Card 2: Officials Dashboard */}
            <Pressable 
              style={({ pressed }) => [
                styles.landingCard,
                pressed && styles.cardPressed
              ]}
              onPress={() => setCurrentState('officialLogin')}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardIconContainer}>
                  <MaterialIcons name="shield" size={32} color="#111827" />
                </View>
                <Text style={styles.cardTitle}>Officials Dashboard</Text>
              </View>
              
              <Text style={styles.cardDescription}>
                Monitor incidents, manage alerts, coordinate response, and access analytics
              </Text>

              <View style={styles.badgeContainer}>
                <View style={styles.featureBadge}>
                  <Text style={styles.badgeText}>Analytics Dashboard</Text>
                </View>
                <View style={styles.featureBadge}>
                  <Text style={styles.badgeText}>Alert Broadcasting</Text>
                </View>
                <View style={styles.featureBadge}>
                  <Text style={styles.badgeText}>Report Verification</Text>
                </View>
                <View style={styles.featureBadge}>
                  <Text style={styles.badgeText}>Resource Management</Text>
                </View>
                <View style={styles.featureBadge}>
                  <Text style={styles.badgeText}>AI Insights</Text>
                </View>
              </View>

              <TouchableOpacity style={[styles.launchButton,{ backgroundColor:'#111827' }]} onPress={() => setCurrentState('officialLogin')}>
                <Text style={[styles.launchButtonText,{ color:'#ffffff' }]}>Access Dashboard</Text>
              </TouchableOpacity>
            </Pressable>

            {/* Footer removed as requested */}
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  // Helper function for countdown formatting
  const formatCountdown = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  // Helper to format relative time like "2 min ago"
  const formatRelativeTime = (iso: string): string => {
    const d = new Date(iso);
    const now = Date.now();
    const diffMs = Math.max(0, now - d.getTime());
    const diffSec = Math.floor(diffMs / 1000);
    if (isNaN(d.getTime())) return '-';
    if (diffSec < 60) return t('justNow');
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return t('minAgo', { n: diffMin });
    const diffHr = Math.floor(diffMin / 60);
    const remMin = diffMin % 60;
    if (diffHr < 24) return remMin ? t('hoursMinutesAgo', { h: diffHr, m: remMin }) : t('hoursAgo', { h: diffHr });
    // 24h+ fallback to date
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Helper function to get severity color
  const getSeverityColor = (severity: 'Low' | 'Medium' | 'High' | 'Critical'): string => {
    switch (severity) {
      case 'Low': return '#22c55e';
      case 'Medium': return '#f59e0b';  
      case 'High': return '#f97316';
      case 'Critical': return '#dc2626';
      default: return '#6b7280';
    }
  };

  // Helper function to get disaster icon
  const getDisasterIcon = (type: string): string => {
    const iconMap: Record<string, string> = {
      'Flood': '🌊',
      'Earthquake': '🏠',
      'Storm': '⛈️',
      'Fire': '🔥',
      'Landslide': '⛰️',
      'Hurricane': '🌀',
      'Cyclone': '🌀'
    };
  return iconMap[type] || '';
  };

  // Helper function to get status color
  const getStatusColor = (status: 'pending' | 'uploaded' | 'failed') => {
    switch (status) {
      case 'pending': return { backgroundColor: '#fbbf24' };
      case 'uploaded': return { backgroundColor: '#10b981' };
      case 'failed': return { backgroundColor: '#ef4444' };
      default: return { backgroundColor: '#6b7280' };
    }
  };

  const getIncidentTypeDisplay = (type: string): string => {
    const types: { [key: string]: string } = {
      'flood': '🌊 Flooding',
      'fire': '🔥 Fire',
      'earthquake': '🏠 Earthquake Damage',
      'storm': '⛈️ Storm Damage', 
      'infrastructure': '⚡ Infrastructure Failure',
      'accident': 'Traffic Accident',
      'other': 'Other Emergency'
    };
    return types[type] || type;
  };

  const getVerificationStyle = (v?: 'verified' | 'pending' | 'fake' | 'unverified') => {
    switch (v) {
      case 'verified': return { bg: '#dcfce7', fg: '#166534', label: 'Verified' };
      case 'pending': return { bg: '#fef9c3', fg: '#854d0e', label: 'Pending' };
      case 'fake': return { bg: '#fee2e2', fg: '#991b1b', label: 'Fake' };
      default: return { bg: '#e5e7eb', fg: '#374151', label: 'Unverified' };
    }
  };

  const getFacilityOccupancyColor = (occupancy: number): string => {
    if (occupancy < 70) return '#10b981'; // Green
    if (occupancy < 90) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  // Citizen App Interface - EXACT Implementation as per guide
  if (currentState === 'citizenApp' && user) {
    // Helper: open Google Maps directions to a coordinate
    const openGoogleDirections = async (lat: number, lng: number, name?: string) => {
      try {
        if (Platform.OS === 'ios') {
          const gmapsInstalled = await Linking.canOpenURL('comgooglemaps://');
          if (gmapsInstalled) {
            const url = `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`;
            return Linking.openURL(url);
          }
          // Fallback: web Google Maps directions
          const web = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
          return Linking.openURL(web);
        } else {
          // Android: try intent navigation first
          const intent = `google.navigation:q=${lat},${lng}${name ? `(${encodeURIComponent(name)})` : ''}`;
          const canNav = await Linking.canOpenURL(intent);
          if (canNav) {
            return Linking.openURL(intent);
          }
          const web = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
          return Linking.openURL(web);
        }
      } catch (e) {
        Alert.alert('Error', 'Could not open Google Maps.');
      }
    };

    const citizenTabs = [
      { id: 'alerts' as CitizenTab, icon: 'warning', label: t('tabAlerts'), color: '#ef4444' },
      { id: 'report' as CitizenTab, icon: 'add', label: t('tabReport'), color: '#f59e0b' },
      { id: 'facilities' as CitizenTab, icon: 'location', label: t('tabFacilities'), color: '#10b981' },
      { id: 'zones' as CitizenTab, icon: 'shield', label: t('tabZones'), color: '#f97316' },
      { id: 'chat' as CitizenTab, icon: 'chatbubble-ellipses', label: t('tabChat'), color: '#8b5cf6' },
      { id: 'help' as CitizenTab, icon: 'call', label: t('tabHelp'), color: '#3b82f6' },
    ];

    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <StatusBar style="dark" />
          
          {/* Header Bar - EXACT as per Implementation Guide */}
          <View style={styles.citizenHeader}>
            <View style={styles.headerLeft}>
              <Pressable onPress={() => setCurrentState('landing')}>
                <View style={styles.backButtonContainer}>
                  <Ionicons name="arrow-back" size={16} color="#1e293b" />
                  <Text style={styles.appBrand}>SurakshaSetu</Text>
                </View>
              </Pressable>
            </View>
            <View style={styles.headerRight}>
              <View>
                <Pressable onPress={() => setShowLanguageDropdown(!showLanguageDropdown)}>
                  <Text style={styles.languageToggle}>🌐 {currentLanguage.toUpperCase()} ▼</Text>
                </Pressable>
                {showLanguageDropdown && (
                  <View style={styles.languageMenu}>
                    {LANGUAGE_OPTIONS.map(opt => (
                      <Pressable key={opt.code} style={styles.languageMenuItem} onPress={() => { setCurrentLanguage(opt.code); setShowLanguageDropdown(false); }}>
                        <Text style={[styles.languageMenuText, currentLanguage === opt.code && styles.languageMenuTextActive]}>
                          {opt.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
              <Text style={[styles.connectionStatus, isOffline && styles.offlineStatus]}>
                📶 {isOffline ? 'Offline' : 'Online'}
              </Text>
            </View>
          </View>

          {/* Navigation Tabs (6 tabs total) - EXACT grid-cols-6 layout */}
          <View style={styles.tabNavigation}>
            {citizenTabs.map((tab) => (
              <Pressable
                key={tab.id}
                style={[
                  styles.tabButton,
                  activeTab === tab.id && styles.activeTabButton
                ]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Ionicons 
                  name={tab.icon as any} 
                  size={16} 
                  color={activeTab === tab.id ? tab.color : '#64748b'} 
                />
                <Text style={[
                  styles.tabLabel,
                  activeTab === tab.id && { color: tab.color }
                ]}>
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Content Area */}
          <ScrollView style={styles.contentArea} showsVerticalScrollIndicator={false}>
            {activeTab === 'alerts' && (
              <View style={styles.alertsContainer}>
                {/* Emergency Banner */}
                <View style={styles.emergencyBanner}>
                  <Text style={styles.emergencyText}>{t('emergencyAlertSystem')}</Text>
                  <Text style={styles.emergencySubtext}>{t('stayInformed')}</Text>
                </View>

                {/* Socket Connection Status */}
                <View style={{ backgroundColor: isSocketConnected ? '#d1fae5' : '#fee2e2', padding: 10, borderRadius: 8, marginHorizontal: 16, marginTop: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isSocketConnected ? '#10b981' : '#ef4444', marginRight: 8 }} />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151' }}>
                    {isSocketConnected ? '🟢 Live: Receiving Real-Time Alerts' : '🔴 Offline Mode'}
                  </Text>
                </View>

                {/* Active Alerts Counter */}
                <View style={styles.alertsCounter}>
                  <View style={styles.counterBadge}>
                    <Text style={styles.counterNumber}>{SAMPLE_ALERTS.length}</Text>
                    <Text style={styles.counterLabel}>{t('activeAlerts')}</Text>
                  </View>
                  <View style={styles.counterInfo}>
                    <Text style={styles.counterLastUpdate}>{t('lastUpdated')}: {t('justNow')}</Text>
                    <Text style={styles.counterCoverage}>{t('coverage')}: Your area + 25km {t('radius').toLowerCase()}</Text>
                  </View>
                </View>

                {/* Alerts List */}
                {SAMPLE_ALERTS.map((alert, index) => (
                  <View key={alert.id} style={[
                    styles.alertCard,
                    alert.severity === 'Critical' && styles.alertCardCritical,
                    alert.severity === 'High' && styles.alertCardHigh
                  ]}>
                    {/* Alert Header */}
                    <View style={styles.alertHeader}>
                      <View style={styles.alertTitleRow}>
                        <Text style={styles.alertIcon}>{getDisasterIcon(alert.type)}</Text>
                        <View style={styles.alertTitleInfo}>
                          <Text style={styles.alertTitle}>{alert.title}</Text>
                          <Text style={styles.alertLocation}>📍 {alert.location}</Text>
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(alert.severity) }]}> 
                          <Text style={styles.severityText}>{alert.severity}</Text>
                        </View>
                        {/* Verification badge for alert if available */}
                        {alert as any && (alert as any).verification && (() => { const vs = getVerificationStyle((alert as any).verification); return (
                          <View style={[styles.verifyBadge, { backgroundColor: vs.bg, marginTop: 6 }]}> 
                            <Text style={[styles.verifyBadgeText, { color: vs.fg }]}>{vs.label}</Text>
                          </View>
                        ); })()}
                      </View>
                    </View>

                    {/* Alert Description */}
                    <Text style={styles.alertDescription}>{alert.description}</Text>

                    {/* Alert Metadata */}
                    <View style={styles.alertMetadata}>
                      <View style={styles.alertMetaItem}>
                        <Text style={styles.alertMetaLabel}>{t('issued')}</Text>
                        <Text style={styles.alertMetaValue}>{formatRelativeTime(alert.timestamp)}</Text>
                      </View>
                      <View style={styles.alertMetaItem}>
                        <Text style={styles.alertMetaLabel}>{t('radius')}</Text>
                        <Text style={styles.alertMetaValue}>{alert.radius}km</Text>
                      </View>
                      <View style={styles.alertMetaItem}>
                        <Text style={styles.alertMetaLabel}>{t('languageLabel')}</Text>
                        <Text style={styles.alertMetaValue}>{alert.language}</Text>
                      </View>
                    </View>

                    {/* Safety Instructions */}
                    {alert.instructions && alert.instructions.length > 0 && (
                      <View style={styles.alertInstructions}>
                        <Text style={styles.instructionsTitle}>{t('safetyInstructions')}</Text>
                        {alert.instructions.map((instruction, idx) => (
                          <Text key={idx} style={styles.instructionItem}>
                            • {instruction}
                          </Text>
                        ))}
                      </View>
                    )}

                    {/* Alert Actions */}
                    <View style={styles.alertActions}>
                      <TouchableOpacity style={styles.actionButtonPrimary} onPress={() => { setSelectedAlert(alert); setShowAlertDetails(true); }}>
                        <Text style={styles.actionButtonPrimaryText}>{t('viewDetails')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionButtonSecondary} onPress={() => handleShareAlert(alert)}>
                        <Text style={styles.actionButtonSecondaryText}>{t('shareAlert')}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                {/* No Alerts Message */}
                {SAMPLE_ALERTS.length === 0 && (
                  <View style={styles.noAlertsContainer}>
                    <Text style={styles.noAlertsIcon}>✅</Text>
                    <Text style={styles.noAlertsTitle}>{t('noAlertsTitle')}</Text>
                    <Text style={styles.noAlertsMessage}>{t('noAlertsMessage')}</Text>
                    <TouchableOpacity style={styles.refreshButton}>
                      <Text style={styles.refreshButtonText}>{t('refresh')}</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Alert Details Modal */}
                <Modal
                  visible={showAlertDetails && !!selectedAlert}
                  transparent
                  animationType="slide"
                  onRequestClose={() => setShowAlertDetails(false)}
                >
                  <View style={styles.detailsOverlay}>
                    <ViewShot ref={detailsShotRef} style={styles.detailsCard} options={{ format: 'png', quality: 0.9 }}>
                      <View style={styles.detailsHeader}>
                        <Text style={styles.detailsTitle}>{selectedAlert?.title}</Text>
                        <View style={[styles.severityBadge, { backgroundColor: selectedAlert ? getSeverityColor(selectedAlert.severity) : '#64748b' }]}>
                          <Text style={styles.severityText}>{selectedAlert?.severity}</Text>
                        </View>
                      </View>
                      <Text style={styles.detailsSubtext}>📍 {selectedAlert?.location}</Text>
                      <Text style={styles.detailsSubtext}>🕒 Issued {selectedAlert ? formatRelativeTime(selectedAlert.timestamp) : ''}</Text>
                      <Text style={styles.detailsDescription}>{selectedAlert?.description}</Text>

                      {selectedAlert?.instructions?.length ? (
                        <View style={{ marginTop: 12 }}>
                          <Text style={styles.instructionsTitle}>Safety Instructions</Text>
                          {selectedAlert.instructions.map((it, idx) => (
                            <Text key={idx} style={styles.instructionItem}>• {it}</Text>
                          ))}
                        </View>
                      ) : null}
                      <View style={styles.detailsFooter}>
                        <Pressable style={[styles.actionButtonSecondary, styles.detailsActionHalf]} onPress={() => setShowAlertDetails(false)}>
                          <Text style={styles.actionButtonSecondaryText}>Close</Text>
                        </Pressable>
                        <Pressable style={[styles.actionButtonSecondary, styles.detailsActionHalf]} onPress={() => { if (selectedAlert) openDirections(selectedAlert); }}>
                          <Text style={styles.actionButtonSecondaryText}>Directions</Text>
                        </Pressable>
                        <Pressable style={[styles.actionButtonPrimary, styles.detailsActionHalf]} onPress={() => { if (selectedAlert) handleShareAlert(selectedAlert); }}>
                          <Text style={styles.actionButtonPrimaryText}>Share</Text>
                        </Pressable>
                        <Pressable style={[styles.actionButtonPrimary, styles.detailsActionHalf]} onPress={handleShareAlertImage}>
                          <Text style={styles.actionButtonPrimaryText}>Share as Image</Text>
                        </Pressable>
                      </View>
                    </ViewShot>
                  </View>
                </Modal>
              </View>
            )}
            {activeTab === 'chat' && (
              <View style={{ flex: 1, position: 'relative' }}>
                <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
                  <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827' }}>Local Chat (5 km)</Text>
                  <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                    Chat with people nearby. Be respectful and share verified info.
                  </Text>
                </View>

                {!chatUserCoords && (
                  <View style={{ backgroundColor: '#f3f4f6', borderRadius: 8, padding: 12, marginHorizontal: 16, marginBottom: 12 }}>
                    <Text style={{ color: '#374151' }}>Detecting your location…</Text>
                  </View>
                )}

                {chatUserCoords && (
                  <ScrollView 
                    ref={scrollViewRef}
                    style={{ flex: 1, paddingHorizontal: 16 }}
                    contentContainerStyle={{ paddingBottom: inputContainerHeight + 12 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    onScroll={({ nativeEvent }) => {
                      const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
                      const paddingToBottom = 24; // px
                      const nearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
                      setIsNearBottom(nearBottom);
                    }}
                    scrollEventThrottle={16}
                    onContentSizeChange={() => scrollToBottom()}
                    onLayout={() => scrollToBottom()}
                  >
                    {chatMessages
                      .filter(m => distanceKm(chatUserCoords.lat, chatUserCoords.lon, m.lat, m.lon) <= CHAT_RADIUS_KM)
                      .sort((a, b) => (new Date(a.ts).getTime() - new Date(b.ts).getTime()))
                      .map(m => (
                        <View key={m.id} style={{
                          backgroundColor: user && m.userId === user.id ? '#eef2ff' : '#ffffff',
                          borderWidth: 1,
                          borderColor: '#e5e7eb',
                          borderRadius: 10,
                          padding: 10,
                          marginBottom: 8,
                        }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                            <Ionicons name="person-circle-outline" size={18} color="#6b7280" style={{ marginRight: 6 }} />
                            <Text style={{ fontWeight: '600', color: '#111827' }}>{m.name}</Text>
                            <Text style={{ marginLeft: 6, color: '#6b7280', fontSize: 12 }}>• {formatRelativeTime(m.ts)}</Text>
                          </View>
                          <Text style={{ color: '#111827', flexShrink: 1 }}>
                            {m.text}
                          </Text>
                        </View>
                      ))}
                  </ScrollView>
                )}

                <KeyboardAvoidingView
                  style={{ position: 'absolute', left: 0, right: 0, bottom: isKeyboardVisible ? 0 : '-65%' }}
                  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                  keyboardVerticalOffset={0}
                >
                  <SafeAreaView
                    edges={[]}
                    style={{ backgroundColor: '#F8FAFC' }}
                    onLayout={(e) => { setInputContainerHeight(Math.ceil(e.nativeEvent.layout.height)); }}
                  >
                    <View 
                      style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center', 
                        paddingHorizontal: 12, 
                        paddingVertical: 8, 
                        borderTopWidth: 1,
                        borderTopColor: '#E5E7EB',
                        backgroundColor: '#F8FAFC',
                      }}
                    >
                      <TextInput
                        style={{ 
                          flex: 1,
                          backgroundColor: '#F3F4F6',
                          borderRadius: 20,
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                          fontSize: 16,
                          color: '#111827',
                          maxHeight: 120,
                        }}
                        placeholder="Type a message"
                        placeholderTextColor="#9CA3AF"
                        value={chatInput}
                        onChangeText={setChatInput}
                        editable={!!chatUserCoords}
                        multiline={true}
                        textAlignVertical="center"
                        onFocus={() => scrollToBottom(true)}
                      />
                      <TouchableOpacity 
                        onPress={sendChat} 
                        disabled={!chatInput.trim() || !chatUserCoords} 
                        style={{ 
                          marginLeft: 8,
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: '#2563eb',
                          justifyContent: 'center',
                          alignItems: 'center',
                          opacity: !chatInput.trim() || !chatUserCoords ? 0.4 : 1,
                        }}
                      >
                        <Ionicons name="send" size={18} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  </SafeAreaView>
                </KeyboardAvoidingView>
              </View>
            )}

            {activeTab === 'report' && (
              <ScrollView style={styles.reportContainer} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <Text style={styles.sectionTitle}>📝 Report Incident</Text>
                
                {/* Offline Warning */}
                {isOffline && (
                  <View style={styles.offlineWarning}>
                      <Text style={styles.offlineWarningText}>{t('offlineModeWarning')}</Text>
                  </View>
                )}
                
                {/* Report Form */}
                <View style={styles.reportForm}>
                  {/* Incident Type Text Input */}
                  <Text style={styles.formLabel}>Incident Type *</Text>
                  <TextInput
                    style={[styles.textArea, { minHeight: 50 }]}
                    placeholder="e.g. WildFire(auto-filled from photo)"
                    placeholderTextColor="#999"
                    value={selectedIncidentType}
                    onChangeText={setSelectedIncidentType}
                    autoCapitalize="words"
                  />
                  <Text style={styles.dropdownHint}>Upload a photo to auto-detect the incident type</Text>

                  {/* Description (optional) */}
                  <Text style={styles.formLabel}>Description (optional)</Text>
                  <View style={styles.textAreaContainer}>
                    <TextInput
                      style={styles.textAreaInput}
                      placeholder="Describe what you're observing in detail..."
                      placeholderTextColor="#94a3b8"
                      multiline
                      numberOfLines={5}
                      maxLength={500}
                      value={reportDescription}
                      onChangeText={setReportDescription}
                      textAlignVertical="top"
                    />
                    <Text style={styles.charCount}>{reportDescription.length}/500 characters</Text>
                  </View>

                  {/* Auto-Location */}
                  <Text style={styles.formLabel}>Location</Text>
                  <View style={styles.locationContainer}>
                    <View style={styles.locationInfo}>
                      <Text style={styles.locationIcon}>📍</Text>
                      <View style={styles.locationDetails}>
                        <Text style={styles.locationText}>
                          {reportLocationSource === 'photo' ? 'From photo metadata' : reportLocationSource === 'device' ? 'From device GPS' : 'Auto-detected Location'}
                        </Text>
                        <Text style={styles.locationAddress}>
                          {reportAddress}
                        </Text>
                        {reportCoords && (
                          <Text style={styles.locationAccuracy}>
                            {reportCoords.lat.toFixed(5)}, {reportCoords.lon.toFixed(5)}
                          </Text>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={styles.updateLocationButton}
                      onPress={getAndSetCurrentLocation}
                    >
                      <Text style={styles.updateButtonText}>Update</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Media Upload */}
                  <Text style={styles.formLabel}>Media Upload</Text>
                  <View style={styles.mediaSection}>
                    <View style={styles.mediaButtons}>
                      <TouchableOpacity 
                        style={styles.mediaButton}
                        onPress={async () => {
                          try {
                            const { status } = await requestCameraPermissions();
                            if (status !== 'granted') {
                              Alert.alert(
                                '📷 Camera Permission Required',
                                'Please enable camera access in your device settings to take photos for incident reports.',
                                [{ text: 'OK' }]
                              );
                              return;
                            }
                            const result = await ImagePicker.launchCameraAsync({
                              mediaTypes: ImagePicker.MediaTypeOptions.Images,
                              allowsEditing: false,
                              quality: 0.8,
                              exif: true,
                            });
                            if (!result.canceled && result.assets && result.assets.length > 0) {
                              const a = result.assets[0];
                              setAttachedMedia({
                                uri: a.uri,
                                fileName: (a as any).fileName || 'photo.jpg',
                                fileSize: (a as any).fileSize,
                                mimeType: (a as any).mimeType || 'image/jpeg',
                              });
                              // Update location automatically from EXIF or fall back to device GPS
                              await ensureLocationAfterMedia((a as any).exif);
                              
                              // Detect disaster type with Roboflow AI and auto-fill incident type
                              console.log('📸 Camera photo captured, starting AI detection...');
                              console.log('   Image URI:', a.uri);
                              Alert.alert('🔍 Analyzing Image', 'AI is detecting disaster type...');
                              try {
                                const detectionResult = await DisasterVerificationService.detectDisaster(a.uri);
                                console.log('🤖 Roboflow API Response:', JSON.stringify(detectionResult, null, 2));
                                
                                const topPrediction = DisasterVerificationService.getTopPrediction(detectionResult);
                                
                                if (topPrediction) {
                                  console.log('✅ Top Prediction:', topPrediction);
                                  
                                  // Map detected class to incident type
                                  const incidentType = DisasterVerificationService.mapClassToIncidentType(topPrediction.class);
                                  console.log('📋 Mapped Incident Type:', incidentType);
                                  
                                  // Auto-fill the incident type
                                  setSelectedIncidentType(incidentType);
                                  console.log('✓ Incident type field updated to:', incidentType);
                                  
                                  Alert.alert(
                                    '✅ Detection Complete',
                                    `Detected: ${topPrediction.class}\nConfidence: ${(topPrediction.confidence * 100).toFixed(1)}%\n\n✓ Incident type set to: ${incidentType}`,
                                    [{ text: 'OK' }]
                                  );
                                } else {
                                  console.log('⚠️ No predictions found in response');
                                  Alert.alert(
                                    '⚠️ No Detection',
                                    'Could not detect disaster type. Please select manually.',
                                    [{ text: 'OK' }]
                                  );
                                }
                              } catch (error) {
                                console.error('❌ AI detection failed:', error);
                                console.error('   Error details:', error instanceof Error ? error.message : String(error));
                                Alert.alert(
                                  '⚠️ Detection Failed',
                                  'Could not analyze image. Please select incident type manually.',
                                  [{ text: 'OK' }]
                                );
                              }
                            }
                          } catch (error) {
                            console.error(error);
                            Alert.alert('Error', 'Unable to open camera. Please try again.');
                          }
                        }}
                      >
                        <Text style={styles.mediaButtonIcon}>📷</Text>
                        <Text style={styles.mediaButtonText}>Take Photo</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.mediaButton}
                        onPress={() => setShowFileOptions(true)}
                      >
                        <Text style={styles.mediaButtonIcon}>📁</Text>
                        <Text style={styles.mediaButtonText}>Choose File</Text>
                      </TouchableOpacity>
                    </View>
                    
                    {/* Photo Preview */}
                    {attachedMedia && (
                      <View style={styles.photoPreview}>
                        {attachedMedia.mimeType?.startsWith('image/') ? (
                          <Pressable style={styles.photoThumbnailContainer} onPress={() => setShowImageViewer(true)}>
                            <Image source={{ uri: attachedMedia.uri }} style={styles.photoThumb} />
                            <View style={styles.photoInfo}>
                              <Text style={styles.photoName}>{attachedMedia.fileName || 'photo.jpg'}</Text>
                              <Text style={styles.photoSize}>{formatSize(attachedMedia.fileSize)} • Tap to preview</Text>
                            </View>
                          </Pressable>
                        ) : (
                          <View style={styles.photoThumbnailContainer}>
                            <Text style={styles.photoIcon}>📄</Text>
                            <View style={styles.photoInfo}>
                              <Text style={styles.photoName}>{attachedMedia.fileName || 'file'}</Text>
                              <Text style={styles.photoSize}>{formatSize(attachedMedia.fileSize)}</Text>
                            </View>
                          </View>
                        )}
                        <TouchableOpacity style={styles.removePhotoButton} onPress={() => setAttachedMedia(null)}>
                          <Text style={styles.removePhotoText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Audio Preview */}
                    {recordedAudioUri && (
                      <View style={styles.photoPreview}>
                        <View style={styles.photoThumbnailContainer}>
                          <Text style={styles.photoIcon}>🎧</Text>
                          <View style={styles.photoInfo}>
                            <Text style={styles.photoName}>Voice Alert</Text>
                            <Text style={styles.photoSize}>Tap play to listen</Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          style={[styles.removePhotoButton, { backgroundColor: '#10b981', marginRight: 8 }]}
                          onPress={togglePlayPause}
                        >
                          <Text style={styles.removePhotoText}>{isPlaying ? '⏸️' : '▶️'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.removePhotoButton} onPress={removeAudio}>
                          <Text style={styles.removePhotoText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {/* False Information Warning */}
                  <View style={{
                    backgroundColor: '#fef2f2',
                    borderColor: '#fecaca',
                    borderWidth: 1,
                    padding: 10,
                    borderRadius: 8,
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    marginTop: 8,
                    marginBottom: 12,
                  }}>
                    <Ionicons name="warning-outline" size={18} color="#b91c1c" style={{ marginRight: 8, marginTop: 2 }} />
                    <Text style={{ color: '#7f1d1d', fontSize: 12, lineHeight: 16 }}>
                      Sharing wrong updates or false news can cause strict action by authorities.
                    </Text>
                  </View>

                  {/* Submit Button */}
                  <TouchableOpacity 
                    style={[styles.submitButton, isOffline && styles.submitButtonOffline]}
                    onPress={submitReport}
                  >
                    <Ionicons name={isOffline ? 'cloud-offline-outline' : 'send-outline'} size={18} color="#ffffff" style={{ marginBottom: 2 }} />
                    <Text style={styles.submitButtonText}>
                      {isOffline ? 'Queue Report (Will sync when online)' : 'Submit Report to Officials'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Your Reports Section */}
                <Text style={styles.sectionTitle}>{t('yourReports')} ({myReports.length})</Text>

                {myReports.length === 0 && (
                  <View style={[styles.reportCard, { alignItems: 'center' }]}>
                    <Text style={[styles.reportDescription, { textAlign: 'center', color: '#6b7280' }]}>{t('noReportsYet')}</Text>
                  </View>
                )}

                {myReports.map((report) => (
                  <View key={report.id} style={styles.reportCard}>
                    <View style={styles.reportHeader}>
                      <Text style={styles.reportType}>{getIncidentTypeDisplay(report.type)}</Text>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <View style={[styles.statusBadge, getStatusColor(report.status)]}>
                          <Text style={styles.statusText}>{report.status.toUpperCase()}</Text>
                        </View>
                        {(() => { const vs = getVerificationStyle(report.verification); return (
                          <View style={[styles.verifyBadge, { backgroundColor: vs.bg }]}>
                            <Text style={[styles.verifyBadgeText, { color: vs.fg }]}>{vs.label}</Text>
                          </View>
                        ); })()}
                      </View>
                    </View>
                    <Text style={styles.reportDescription}>{report.description}</Text>
                    <View style={styles.reportMeta}>
                      <Text style={styles.reportLocation}>📍 {report.location}</Text>
                      <Text style={styles.reportTime}>⏰ {formatRelativeTime(report.timestamp)}</Text>
                    </View>
                    {report.hasMedia && (
                      <Text style={styles.mediaIndicator}>📷 Media attached</Text>
                    )}
                    {report.status === 'uploaded' && (
                      <Text style={styles.reportStatus}>✅ Received by emergency officials</Text>
                    )}
                    {report.status === 'pending' && (
                      <Text style={styles.reportStatus}>{t('queuedForUpload')}</Text>
                    )}
                  </View>
                ))}
                
                <View style={styles.tabBottomSpacer} />
              </ScrollView>
            )}
            
            {/* Camera View Modal */}
            {showCameraView && (
              <View style={styles.cameraModal}>
                <View style={styles.cameraContainer}>
                  <View style={styles.cameraHeader}>
                    <TouchableOpacity 
                      style={styles.cameraCloseButton}
                      onPress={() => setShowCameraView(false)}
                    >
                      <Text style={styles.cameraCloseText}>✕</Text>
                    </TouchableOpacity>
                    <Text style={styles.cameraTitle}>Camera</Text>
                    <TouchableOpacity style={styles.cameraFlashButton}>
                      <Text style={styles.cameraFlashText}>⚡</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.cameraViewfinder}>
                    <Text style={styles.cameraStatus}>📹 Initializing camera...</Text>
                    <Text style={styles.cameraSubtext}>Point camera at the incident</Text>
                    
                    {/* Grid Lines */}
                    <View style={styles.cameraGrid}>
                      <View style={styles.gridLine} />
                      <View style={styles.gridLine} />
                      <View style={[styles.gridLine, styles.gridLineVertical]} />
                      <View style={[styles.gridLine, styles.gridLineVertical]} />
                    </View>
                  </View>
                  
                  <View style={styles.cameraControls}>
                    <TouchableOpacity style={styles.cameraSwitchButton}>
                      <Text style={styles.cameraSwitchText}>🔄</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.cameraCaptureButton}
                      onPress={() => {
                        setShowCameraView(false);
                        Alert.alert(t('photoCapturedTitle'), t('photoCapturedBody'), [{ text: t('ok') }]);
                      }}
                    >
                      <View style={styles.captureButtonInner} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.cameraGalleryButton}>
                      <Text style={styles.cameraGalleryText}>🖼️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
            
            {/* File Options Modal */}
            {showFileOptions && (
              <View style={styles.fileOptionsModal}>
                <View style={styles.fileOptionsContainer}>
                  <View style={styles.fileOptionsHeader}>
                    <Text style={styles.fileOptionsTitle}>Choose document</Text>
                    <TouchableOpacity 
                      style={styles.fileOptionsClose}
                      onPress={() => setShowFileOptions(false)}
                    >
                      <Text style={styles.fileOptionsCloseText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {/* Choose from files */}
                  <TouchableOpacity 
                    style={styles.fileOptionButton}
                    onPress={async () => {
                      try {
                        setShowFileOptions(false);
                        const res = await DocumentPicker.getDocumentAsync({
                          copyToCacheDirectory: true,
                          multiple: false,
                        });
                        // Newer expo-document-picker returns { canceled, assets: [{ name, size, mimeType, uri }] }
                        if (!('canceled' in res) || res.canceled === false) {
                          const asset = (res as any).assets?.[0];
                          if (asset) {
                            const { name, size, mimeType, uri } = asset;
                            setAttachedMedia({ uri, fileName: name, fileSize: size, mimeType });
                            Alert.alert('📄 File Selected', name || 'file');
                          }
                        }
                      } catch (e) {
                        console.error(e);
                        Alert.alert('Error', 'Unable to open files.');
                      }
                    }}
                  >
                    <Text style={styles.fileOptionIcon}>📄</Text>
                    <View style={styles.fileOptionTextContainer}>
                      <Text style={styles.fileOptionText}>Choose from files</Text>
                      <Text style={styles.fileOptionSubtext}>Send original files up to device limit</Text>
                    </View>
                  </TouchableOpacity>
                  
                  {/* Choose photo or video (Gallery) */}
                  <TouchableOpacity 
                    style={styles.fileOptionButton}
                    onPress={async () => {
                      try {
                        setShowFileOptions(false);
                        const res = await ImagePicker.launchImageLibraryAsync({
                          mediaTypes: ImagePicker.MediaTypeOptions.Images,
                          allowsEditing: false,
                          quality: 0.9,
                          exif: true,
                        });
                        if (!res.canceled && res.assets && res.assets.length > 0) {
                          const a = res.assets[0];
                          setAttachedMedia({ uri: a.uri, fileName: (a as any).fileName, fileSize: (a as any).fileSize, mimeType: (a as any).mimeType || 'image/jpeg' });
                          // Update location automatically from EXIF or fall back to device GPS
                          await ensureLocationAfterMedia((a as any).exif);
                          
                          // Detect disaster type with Roboflow AI and auto-fill incident type
                          console.log('🖼️ Gallery photo selected, starting AI detection...');
                          console.log('   Image URI:', a.uri);
                          Alert.alert('🔍 Analyzing Image', 'AI is detecting disaster type...');
                          try {
                            const detectionResult = await DisasterVerificationService.detectDisaster(a.uri);
                            console.log('🤖 Roboflow API Response:', JSON.stringify(detectionResult, null, 2));
                            
                            const topPrediction = DisasterVerificationService.getTopPrediction(detectionResult);
                            
                            if (topPrediction) {
                              console.log('✅ Top Prediction:', topPrediction);
                              
                              // Map detected class to incident type
                              const incidentType = DisasterVerificationService.mapClassToIncidentType(topPrediction.class);
                              console.log('📋 Mapped Incident Type:', incidentType);
                              
                              // Auto-fill the incident type
                              setSelectedIncidentType(incidentType);
                              console.log('✓ Incident type field updated to:', incidentType);
                              
                              Alert.alert(
                                '✅ Detection Complete',
                                `Detected: ${topPrediction.class}\nConfidence: ${(topPrediction.confidence * 100).toFixed(1)}%\n\n✓ Incident type set to: ${incidentType}`,
                                [{ text: 'OK' }]
                              );
                            } else {
                              console.log('⚠️ No predictions found in response');
                              Alert.alert(
                                '⚠️ No Detection',
                                'Could not detect disaster type. Please select manually.',
                                [{ text: 'OK' }]
                              );
                            }
                          } catch (error) {
                            console.error('❌ AI detection failed:', error);
                            console.error('   Error details:', error instanceof Error ? error.message : String(error));
                            Alert.alert(
                              '⚠️ Detection Failed',
                              'Could not analyze image. Please select incident type manually.',
                              [{ text: 'OK' }]
                            );
                          }
                        }
                      } catch (e) {
                        console.error(e);
                        Alert.alert('Error', 'Unable to open gallery.');
                      }
                    }}
                  >
                    <Text style={styles.fileOptionIcon}>🖼️</Text>
                    <View style={styles.fileOptionTextContainer}>
                      <Text style={styles.fileOptionText}>Choose photo or video</Text>
                      <Text style={styles.fileOptionSubtext}>Pick from your phone's gallery</Text>
                    </View>
                  </TouchableOpacity>
                  
                  {/* Take photo (acts like scan document replaced) */}
                  <TouchableOpacity 
                    style={styles.fileOptionButton}
                    onPress={async () => {
                      try {
                        const { status } = await requestCameraPermissions();
                        if (status !== 'granted') {
                          Alert.alert('📷 Camera Permission Required', 'Enable camera access in settings.');
                          return;
                        }
                        setShowFileOptions(false);
                        const result = await ImagePicker.launchCameraAsync({
                          mediaTypes: ImagePicker.MediaTypeOptions.Images,
                          allowsEditing: false,
                          quality: 0.9,
                          exif: true,
                        });
                        if (!result.canceled && result.assets && result.assets.length > 0) {
                          const a = result.assets[0];
                          setAttachedMedia({ uri: a.uri, fileName: (a as any).fileName, fileSize: (a as any).fileSize, mimeType: (a as any).mimeType || 'image/jpeg' });
                          // Update location automatically from EXIF or fall back to device GPS
                          await ensureLocationAfterMedia((a as any).exif);
                          Alert.alert(t('photoCapturedTitle'), t('photoCapturedBody'));
                        }
                      } catch (e) {
                        console.error(e);
                        Alert.alert('Error', 'Unable to open camera.');
                      }
                    }}
                  >
                    <Text style={styles.fileOptionIcon}>📷</Text>
                    <View style={styles.fileOptionTextContainer}>
                      <Text style={styles.fileOptionText}>Take photo</Text>
                      <Text style={styles.fileOptionSubtext}>Use camera to capture incident</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Full-screen Image Viewer (Modal) */}
            <Modal
              visible={!!showImageViewer && !!attachedMedia && (attachedMedia?.mimeType?.startsWith('image/') ?? true)}
              transparent
              animationType="fade"
              onRequestClose={() => setShowImageViewer(false)}
            >
              <View style={styles.imageViewerOverlay}>
                <Pressable style={{ flex: 1 }} onPress={() => setShowImageViewer(false)}>
                  <Image
                    source={{ uri: attachedMedia?.uri || '' }}
                    style={{ width: width, height: height }}
                    resizeMode="contain"
                  />
                </Pressable>
                <Pressable style={styles.imageViewerClose} onPress={() => setShowImageViewer(false)}>
                  <Text style={styles.imageViewerCloseText}>✕</Text>
                </Pressable>
              </View>
            </Modal>

            {activeTab === 'facilities' && (
              <View style={styles.facilitiesContainer}>
                {/* Get device location for distances once when entering facilities */}
                {(() => {
                  // Inline effect substitute to avoid additional useEffect branches here
                  if (!facilitiesUserCoords) {
                    (async () => {
                      try {
                        const { status } = await Location.requestForegroundPermissionsAsync();
                        if (status === 'granted') {
                          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                          setFacilitiesUserCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
                        }
                      } catch {}
                    })();
                  }
                  // Reverse geocode facility coordinates to precise addresses once
                  if (Object.keys(facilityAddresses).length === 0) {
                    (async () => {
                      try {
                        const entries: Record<string, string> = {};
                        for (const f of MUMBAI_FACILITIES) {
                          try {
                            const results = await Location.reverseGeocodeAsync({ latitude: f.coordinates.lat, longitude: f.coordinates.lng });
                            if (results && results.length > 0) {
                              const r = results[0];
                              const parts = [r.name, r.street, r.district, r.city || r.subregion, r.region, r.postalCode]
                                .filter(Boolean)
                                .slice(0, 4);
                              entries[f.id] = parts.length ? parts.join(', ') : `${f.coordinates.lat.toFixed(5)}, ${f.coordinates.lng.toFixed(5)}`;
                            } else {
                              entries[f.id] = `${f.coordinates.lat.toFixed(5)}, ${f.coordinates.lng.toFixed(5)}`;
                            }
                          } catch {
                            entries[f.id] = `${f.coordinates.lat.toFixed(5)}, ${f.coordinates.lng.toFixed(5)}`;
                          }
                        }
                        if (Object.keys(entries).length) setFacilityAddresses(entries);
                      } catch {}
                    })();
                  }
                  return null;
                })()}
                {/* Header with toggle */}
                <View style={styles.facilitiesHeader}>
                  <Text style={styles.facilitiesTitle}>Emergency Facilities</Text>
                  <View style={styles.facilitiesToggle}>
                    <Pressable
                      onPress={() => setFacilityView('map')}
                      style={[styles.toggleButton, facilityView === 'map' && styles.toggleButtonActive]}
                    >
                      <Ionicons name="map" size={14} color={facilityView === 'map' ? '#111827' : '#6b7280'} />
                      <Text style={[styles.toggleText, facilityView === 'map' && styles.toggleTextActive]}>{t('map')}</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setFacilityView('list')}
                      style={[styles.toggleButton, facilityView === 'list' && styles.toggleButtonActive]}
                    >
                      <Ionicons name="list" size={14} color={facilityView === 'list' ? '#111827' : '#6b7280'} />
                      <Text style={[styles.toggleText, facilityView === 'list' && styles.toggleTextActive]}>{t('list')}</Text>
                    </Pressable>
                  </View>
                </View>

                {/* Filters/Search (hidden in map view to maximize space) */}
                {facilityView === 'list' && (
                <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    <View style={{ flex: 1, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#fff' }}>
                      <TextInput
                        placeholder="Search by name or area"
                        placeholderTextColor="#9ca3af"
                        value={facilitySearch}
                        onChangeText={setFacilitySearch}
                        style={{ color: '#111827' }}
                      />
                    </View>
                    <Pressable
                      onPress={() => setFacilityTypeFilter(prev => prev === 'all' ? 'hospital' : prev === 'hospital' ? 'police_station' : prev === 'police_station' ? 'shelter' : prev === 'shelter' ? 'relief_camp' : 'all')}
                      style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#fff' }}
                    >
                      <Text style={{ color: '#111827', fontWeight: '600' }}>Type: {facilityTypeFilter === 'all' ? 'All' : facilityTypeFilter.replace('_',' ')}</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setFacilityRadiusKm(prev => prev == null ? 5 : prev === 5 ? 10 : prev === 10 ? 20 : null)}
                      style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#fff' }}
                    >
                      <Text style={{ color: '#111827', fontWeight: '600' }}>{t('radius')}: {facilityRadiusKm == null ? '∞' : `${facilityRadiusKm}km`}</Text>
                    </Pressable>
                  </View>
                </View>
                )}

                {/* List View */}
                {facilityView === 'list' && (
                  <View style={styles.facilityCardList}>
                    {(() => {
                      // Apply search/type/radius filters and sort by nearest
                      const base = MUMBAI_FACILITIES.filter((f) => {
                        const matchesType = facilityTypeFilter === 'all' || f.type === facilityTypeFilter;
                        const query = facilitySearch.trim().toLowerCase();
                        const matchesSearch = !query || f.name.toLowerCase().includes(query) || (facilityAddresses[f.id] || f.address).toLowerCase().includes(query);
                        if (!matchesType || !matchesSearch) return false;
                        if (facilityRadiusKm != null && facilitiesUserCoords) {
                          const km = distanceKm(facilitiesUserCoords.lat, facilitiesUserCoords.lon, f.coordinates.lat, f.coordinates.lng);
                          return km <= facilityRadiusKm;
                        }
                        return true;
                      });
                      const sorted = base.slice().sort((a, b) => {
                        if (!facilitiesUserCoords) return a.name.localeCompare(b.name);
                        const da = distanceKm(facilitiesUserCoords.lat, facilitiesUserCoords.lon, a.coordinates.lat, a.coordinates.lng);
                        const db = distanceKm(facilitiesUserCoords.lat, facilitiesUserCoords.lon, b.coordinates.lat, b.coordinates.lng);
                        return da - db;
                      });
                      return sorted;
                    })().map((f) => {
                      const hasCap = f.capacity > 0;
                      const occupancyPct = hasCap ? Math.min(100, Math.round((f.currentOccupancy / f.capacity) * 100)) : 0;
                      const occColor = occupancyPct < 70 ? '#10b981' : occupancyPct < 90 ? '#f59e0b' : '#ef4444';
                      const statusColor = f.status === 'open' ? '#10b981' : f.status === 'full' ? '#f59e0b' : '#ef4444';
                      const icon = f.type === 'hospital' ? 'medical' : f.type === 'shelter' ? 'home' : f.type === 'relief_camp' ? 'people' : f.type === 'police_station' ? 'shield' : 'business';
                      const distStr = facilitiesUserCoords
                        ? formatDistance(
                            distanceKm(
                              facilitiesUserCoords.lat,
                              facilitiesUserCoords.lon,
                              f.coordinates.lat,
                              f.coordinates.lng
                            )
                          )
                        : '—';
                      const openDirectionsForFacility = () => {
                        const { lat, lng } = f.coordinates;
                        const url = Platform.select({
                          ios: `http://maps.apple.com/?daddr=${lat},${lng}`,
                          android: `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(f.name)})`,
                          default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
                        });
                        if (url) Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open maps.'));
                      };
                      const callFacility = () => {
                        Linking.openURL(`tel:${f.phone}`).catch(() => Alert.alert('Error', 'Could not initiate the call.'));
                      };
                      const copyAddress = async () => {
                        try {
                          await Clipboard.setStringAsync(facilityAddresses[f.id] || f.address);
                          Alert.alert('Copied', 'Address copied to clipboard.');
                        } catch {}
                      };
                      const copyPhone = async () => {
                        try {
                          await Clipboard.setStringAsync(f.phone);
                          Alert.alert('Copied', 'Phone number copied to clipboard.');
                        } catch {}
                      };
                      return (
                        <View key={f.id} style={styles.facilityCard}>
                          <View style={styles.facilityCardRow}>
                            <View style={styles.facilityIconWrapper}>
                              <Ionicons name={icon as any} size={18} color="#64748b" />
                            </View>
                            <View style={{ flex: 1 }}>
                              <View style={styles.facilityTitleRow}>
                                <Text style={styles.facilityName} numberOfLines={1}>{f.name}</Text>
                                <View style={[styles.statusPill, { backgroundColor: statusColor }]}>
                                  <Text style={styles.statusPillText}>{f.status === 'open' ? 'Open' : f.status === 'full' ? 'Full' : 'Closed'}</Text>
                                </View>
                              </View>
                              <Text style={styles.facilityAddress}>{facilityAddresses[f.id] || f.address}</Text>
                              <View style={styles.facilityMetaRow}>
                                <Text style={styles.metaText}>📍 {distStr}</Text>
                                {hasCap ? (
                                  <Text style={styles.metaText}>🧍 {f.currentOccupancy}/{f.capacity}</Text>
                                ) : (
                                  <Text style={styles.metaText}>🧍 Capacity: N/A</Text>
                                )}
                                <Text style={styles.metaText}>📞 {f.phone}</Text>
                              </View>
                              {hasCap && (
                                <>
                                  <View style={styles.occupancyRow}>
                                    <Text style={[styles.occupancyLabel, { color: occColor }]}>Occupancy</Text>
                                    <Text style={[styles.occupancyPct, { color: occColor }]}>{occupancyPct}%</Text>
                                  </View>
                                  <View style={styles.occupancyBarTrack}>
                                    <View style={[styles.occupancyBarFill, { width: `${occupancyPct}%`, backgroundColor: occColor }]} />
                                  </View>
                                </>
                              )}
                              <View style={styles.facilityActionsRow}>
                                <Pressable style={[styles.facilityActionBtn, styles.facilityActionHalf, styles.directionBtn]} onPress={openDirectionsForFacility}>
                                  <Ionicons name="navigate" size={14} color="#111827" />
                                  <Text style={styles.facilityActionText}>Directions</Text>
                                </Pressable>
                                <Pressable style={[styles.facilityActionBtn, styles.facilityActionHalf, styles.callBtn]} onPress={callFacility}>
                                  <Ionicons name="call" size={14} color="#111827" />
                                  <Text style={styles.facilityActionText}>Call</Text>
                                </Pressable>
                                <Pressable style={[styles.facilityActionBtn, styles.facilityActionHalf]} onPress={copyAddress}>
                                  <Ionicons name="copy-outline" size={14} color="#111827" />
                                  <Text style={styles.facilityActionText}>Copy Address</Text>
                                </Pressable>
                                <Pressable style={[styles.facilityActionBtn, styles.facilityActionHalf]} onPress={copyPhone}>
                                  <Ionicons name="copy-outline" size={14} color="#111827" />
                                  <Text style={styles.facilityActionText}>Copy Number</Text>
                                </Pressable>
                              </View>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Map View with markers and navigation */}
                {facilityView === 'map' && (
                  <View style={styles.mapContainer}>
                    {/* Map Instructions */}
                    <View style={styles.mapInstructions}>
                      <Text style={styles.mapInstructionText}>💡 Click on the pin to view details</Text>
                    </View>
                    
                    {/* Map Legend */}
                    <View style={styles.mapLegend}>
                      <View style={styles.mapLegendItem}>
                        <View style={[styles.mapLegendDot, { backgroundColor: '#ef4444' }]} />
                        <Text style={styles.mapLegendText}>Hospitals</Text>
                      </View>
                      <View style={styles.mapLegendItem}>
                        <View style={[styles.mapLegendDot, { backgroundColor: '#3b82f6' }]} />
                        <Text style={styles.mapLegendText}>Police Stations</Text>
                      </View>
                      <View style={styles.mapLegendItem}>
                        <View style={[styles.mapLegendDot, { backgroundColor: '#10b981' }]} />
                        <Text style={styles.mapLegendText}>Shelters</Text>
                      </View>
                      <View style={styles.mapLegendItem}>
                        <View style={[styles.mapLegendDot, { backgroundColor: '#f59e0b' }]} />
                        <Text style={styles.mapLegendText}>Relief Camps</Text>
                      </View>
                    </View>

                    <View style={{
                      height: Math.max(0, height - 300),
                      width: '100%',
                      borderRadius: 16,
                      overflow: 'hidden',
                      borderWidth: 1,
                      borderColor: '#e5e7eb',
                      backgroundColor: '#ffffff'
                    }}>
                      <MapView
                        ref={(ref) => {
                          facilitiesMapRef.current = ref;
                        }}
                        style={{ flex: 1 }}
                        provider={PROVIDER_GOOGLE}
                        initialRegion={{
                          latitude: facilitiesUserCoords?.lat ?? 18.941,
                          longitude: facilitiesUserCoords?.lon ?? 72.8238,
                          latitudeDelta: 0.5,
                          longitudeDelta: 0.5,
                        }}
                        onMapReady={() => setTimeout(() => fitFacilities(), 100)}
                        showsUserLocation
                        showsMyLocationButton
                      >
                        {(() => {
                          // Apply same filters as list
                          const filtered = MUMBAI_FACILITIES.filter((f) => {
                            const matchesType = facilityTypeFilter === 'all' || f.type === facilityTypeFilter;
                            const query = facilitySearch.trim().toLowerCase();
                            const matchesSearch =
                              !query ||
                              f.name.toLowerCase().includes(query) ||
                              (facilityAddresses[f.id] || f.address).toLowerCase().includes(query);
                            if (!matchesType || !matchesSearch) return false;
                            if (facilityRadiusKm != null && facilitiesUserCoords) {
                              const km = distanceKm(
                                facilitiesUserCoords.lat,
                                facilitiesUserCoords.lon,
                                f.coordinates.lat,
                                f.coordinates.lng
                              );
                              return km <= facilityRadiusKm;
                            }
                            return true;
                          });

                          const colorFor = (t: Facility['type']) =>
                            t === 'hospital'
                              ? '#ef4444'
                              : t === 'police_station'
                              ? '#3b82f6'
                              : t === 'shelter'
                              ? '#10b981'
                              : '#f59e0b'; // relief_camp or others

                          const handleMarkerPress = (facility: any) => {
                            if (facilityClickTimer) {
                              // Double click - open directions
                              clearTimeout(facilityClickTimer);
                              setFacilityClickTimer(null);
                              openGoogleDirections(facility.coordinates.lat, facility.coordinates.lng, facility.name);
                            } else {
                              // Single click - show details
                              const timer = setTimeout(() => {
                                setSelectedFacility(facility.id);
                                setFacilityClickTimer(null);
                              }, 300);
                              setFacilityClickTimer(timer);
                            }
                          };

                          return filtered.map((f) => (
                            <Marker
                              key={f.id}
                              coordinate={{
                                latitude: f.coordinates.lat,
                                longitude: f.coordinates.lng,
                              }}
                              pinColor={colorFor(f.type) as any}
                              onPress={() => handleMarkerPress(f)}
                            />
                          ));
                        })()}
                      </MapView>
                      
                      {/* Facility Detail Popup */}
                      {selectedFacility && (() => {
                        const facility = MUMBAI_FACILITIES.find(f => f.id === selectedFacility);
                        if (!facility) return null;
                        return (
                          <View style={styles.facilityDetailPopup}>
                            <View style={styles.facilityDetailHeader}>
                              <Text style={styles.facilityDetailTitle}>{facility.name}</Text>
                              <TouchableOpacity onPress={() => setSelectedFacility(null)}>
                                <Ionicons name="close" size={20} color="#6b7280" />
                              </TouchableOpacity>
                            </View>
                            <Text style={styles.facilityDetailType}>{facility.type.replace('_', ' ').toUpperCase()}</Text>
                            <Text style={styles.facilityDetailAddress}>{facilityAddresses[facility.id] || facility.address}</Text>
                            {facility.phone && (
                              <Text style={styles.facilityDetailPhone}>📞 {facility.phone}</Text>
                            )}
                            <View style={styles.facilityDetailActions}>
                              <TouchableOpacity 
                                style={styles.facilityDetailBtn}
                                onPress={() => {
                                  openGoogleDirections(facility.coordinates.lat, facility.coordinates.lng, facility.name);
                                  setSelectedFacility(null);
                                }}
                              >
                                <Ionicons name="navigate" size={16} color="#ffffff" />
                                <Text style={styles.facilityDetailBtnText}>Directions</Text>
                              </TouchableOpacity>
                              {facility.phone && (
                                <TouchableOpacity 
                                  style={[styles.facilityDetailBtn, styles.facilityDetailBtnSecondary]}
                                  onPress={() => {
                                    Linking.openURL(`tel:${facility.phone}`);
                                    setSelectedFacility(null);
                                  }}
                                >
                                  <Ionicons name="call" size={16} color="#2563eb" />
                                  <Text style={[styles.facilityDetailBtnText, { color: '#2563eb' }]}>Call</Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          </View>
                        );
                      })()}
                      
                      {/* Recenter/Fit button */}
                      <View style={{ position: 'absolute', top: 10, right: 10 }}>
                        <TouchableOpacity
                          onPress={() => fitFacilities()}
                          style={{
                            backgroundColor: 'rgba(255,255,255,0.95)',
                            paddingHorizontal: 10,
                            paddingVertical: 8,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: '#e5e7eb',
                          }}
                        >
                          <Text style={{ color: '#111827', fontWeight: '600' }}>Recenter</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Photos tab removed */}

            {/* Zones -> Hazard Zones UI */}
            {activeTab === 'zones' && (
              <View>
                <View style={styles.hazardHeader}>
                  <Text style={styles.sectionTitle}>Hazard Zones</Text>
                  <Pressable
                    style={[styles.livePill, liveHazardUpdates && styles.livePillActive]}
                    onPress={() => setLiveHazardUpdates(!liveHazardUpdates)}
                  >
                    <Text style={[styles.livePillText, liveHazardUpdates && styles.livePillTextActive]}>● Live Data</Text>
                  </Pressable>
                </View>

                {/* Google Map with Hazard/Safe Zones */}
                <View style={styles.hazardMapCard}>
                  <View style={{ height: 320, borderRadius: 12, overflow: 'hidden' }}>
                    <MapView
                      style={{ flex: 1 }}
                      provider={PROVIDER_GOOGLE}
                      initialRegion={{ latitude: 18.9410, longitude: 72.8238, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
                      showsUserLocation
                      showsMyLocationButton
                    >
                      {/* Render zones based on filter */}
                      {(() => {
                        // Example hard-coded zones around Mumbai area (safe restored)
                        const zones = [
                          { id: 'z1', lat: 18.955, lng: 72.812, radius: 700, type: 'danger' as const },
                          { id: 'z2', lat: 18.960, lng: 72.835, radius: 1100, type: 'moderate' as const },
                          { id: 'z3', lat: 18.93,  lng: 72.83,  radius: 900, type: 'safe' as const },
                        ];
                        const colorFor = (t: 'danger' | 'moderate' | 'safe') => t === 'danger' ? '#ef4444' : t === 'moderate' ? '#f59e0b' : '#10b981';
                        const fillFor = (t: 'danger' | 'moderate' | 'safe') =>
                          t === 'danger' ? 'rgba(239, 68, 68, 0.35)' :
                          t === 'moderate' ? 'rgba(245, 158, 11, 0.35)' :
                          'rgba(16, 185, 129, 0.35)';
                        // Always show all circles; draw order: moderate, safe, danger (top)
                        const toShow = zones
                          .slice()
                          .sort((a, b) => {
                            const order = { moderate: 0, safe: 1, danger: 2 } as const;
                            return order[a.type] - order[b.type];
                          });
                        const zIndexFor = (t: 'danger'|'moderate'|'safe') => t === 'danger' ? 3 : t === 'safe' ? 2 : 1;
                        return toShow.map(z => (
                          <MapCircle
                            key={z.id}
                            center={{ latitude: z.lat, longitude: z.lng }}
                            radius={z.radius}
                            strokeColor={colorFor(z.type)}
                            fillColor={fillFor(z.type)}
                            strokeWidth={2}
                            zIndex={zIndexFor(z.type) as any}
                          />
                        ));
                      })()}

                      {/* Optional: a polyline/marker set could be added if needed */}
                    </MapView>
                    <View style={{ position: 'absolute', top: 10, left: 10 }}>
                      <Text style={styles.hazardMapBadge}>{liveHazardUpdates ? t('liveUpdatesActive') : t('livePaused')}</Text>
                    </View>
                  </View>
                  <View style={styles.hazardLegend}>
                    <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} /><Text style={styles.legendText}>High Risk</Text></View>
                    <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} /><Text style={styles.legendText}>Medium Risk</Text></View>
                    <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#10b981' }]} /><Text style={styles.legendText}>{t('zoneSafeTab')}</Text></View>
                  </View>
                </View>

                {/* Zone toggles removed: all layers (danger, moderate, safe) are always visible */}

                {/* Status card (dynamic) */}
                {(() => {
                  // Keep zone centers in sync with the map's sample circles
                  const zones = [
                    { id: 'z1', lat: 18.955, lng: 72.812, radius: 700, type: 'danger' as const },
                    { id: 'z2', lat: 18.960, lng: 72.835, radius: 1100, type: 'moderate' as const },
                  ];

                  type Variant = 'loading' | 'danger' | 'safe';
                  let variant: Variant = 'loading';
                  if (zonesUserCoords) {
                    const inHazard = zones
                      .filter(z => z.type === 'danger' || z.type === 'moderate')
                      .some(z => (distanceKm(zonesUserCoords.lat, zonesUserCoords.lon, z.lat, z.lng) * 1000) <= z.radius);
                    variant = inHazard ? 'danger' : 'safe';
                  }

                  const titleStyle = [
                    styles.zoneStatusTitle,
                    variant === 'danger' && { color: '#ef4444' },
                    variant === 'safe' && { color: '#10b981' },
                  ];
                  const subtitle = (
                    variant === 'danger' ? 'You are within a hazard area. Move to a safe zone and follow official guidance.' :
                    variant === 'loading' ? 'Detecting your location… please wait while we determine your position.' :
                    'Your current location is outside active hazard areas. Stay alert for updates.'
                  );
                  const titleText = (
                    variant === 'danger' ? 'Danger Spot' :
                    variant === 'loading' ? 'Checking your zone…' :
                    'Safe Spot'
                  );

                  return (
                    <View style={styles.zoneStatusCard}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <Ionicons name="shield-outline" size={16} color="#111827" style={{ marginRight: 8 }} />
                        <Text style={titleStyle as any}>{titleText}</Text>
                      </View>
                      <Text style={styles.zoneStatusSubtitle}>{subtitle}</Text>
                    </View>
                  );
                })()}

                {/* Active Hazards */}
                <Text style={styles.blockTitle}>Active Hazards</Text>
                <View style={styles.hazardList}>
                  {[{
                    id: 'hz1', title: 'Flood in Riverside District', risk: 'High Risk', minutes: 5, affected: '15,000'
                  }, {
                    id: 'hz2', title: 'Landslide in Hill Station Road', risk: 'High Risk', minutes: 120, affected: '2,500'
                  }].map(h => (
                    <View key={h.id} style={styles.hazardCard}>
                      <View style={styles.hazardCardHeader}>
                        <View style={styles.hazardBadges}>
                          <Text style={[styles.hazardBadge, styles.hazardBadgeHigh]}>{h.risk}</Text>
                          <Text style={[styles.hazardBadge, styles.hazardBadgeActive]}>Active</Text>
                        </View>
                        <Pressable style={styles.hazardAvoidBtn}><Text style={styles.hazardAvoidText}>Avoid</Text></Pressable>
                      </View>
                      <Text style={styles.hazardTitle}>{h.title}</Text>
                      <View style={styles.hazardMetaRow}>
                        <Text style={styles.hazardMeta}>⏰ {h.minutes} {h.id === 'hz1' ? 'minutes' : 'hours'} ago</Text>
                        <Text style={styles.hazardMeta}>{h.affected} affected</Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Nearest Safe Zones */}
                <Text style={styles.blockTitle}>Nearest Safe Zones</Text>
                <View style={styles.safeZonesList}>
                  {[
                    {
                      id: 'sz1',
                      name: 'Central Sports Stadium',
                      type: 'Evacuation Center',
                      distance: '1.2 km',
                      lat: 18.9287,
                      lng: 72.8317
                    },
                    {
                      id: 'sz2',
                      name: 'City Hall Complex',
                      type: 'Safe Building',
                      distance: '0.8 km',
                      lat: 18.9351,
                      lng: 72.8250
                    },
                    {
                      id: 'sz3',
                      name: 'Municipal Park',
                      type: 'Open Area',
                      distance: '1.5 km',
                      lat: 18.9415,
                      lng: 72.8340
                    }
                  ].map(zone => (
                    <View key={zone.id} style={styles.safeZoneCard}>
                      <View style={styles.safeZoneIcon}>
                        <Ionicons name="shield-checkmark" size={24} color="#10b981" />
                      </View>
                      <View style={styles.safeZoneInfo}>
                        <Text style={styles.safeZoneName}>{zone.name}</Text>
                        <Text style={styles.safeZoneType}>{zone.type} • {zone.distance}</Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.navigateBtn}
                        onPress={() => handleNavigateToSafeZone(zone.lat, zone.lng, zone.name)}
                      >
                        <Ionicons name="navigate" size={16} color="#1f2937" />
                        <Text style={styles.navigateBtnText}>Navigate</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Help -> Emergency Contacts (India) */}
            {activeTab === 'help' && (
              <View style={styles.contactsContainer}>
                <Text style={styles.sectionTitle}>📞 Emergency Contacts</Text>

                <View style={styles.contactList}>
                  {/* Emergency Services (Call 112 in India) */}
                  <View style={styles.contactCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.contactTitle}>Emergency Services</Text>
                      <Text style={styles.contactSubtitle}>Police, Fire, Medical</Text>
                    </View>
                    <Pressable
                      onPress={() => Linking.openURL('tel:112')}
                      style={[styles.contactCallBtn, styles.contactCallBtnPrimary]}
                    >
                      <Text style={styles.contactCallTextPrimary}>Call 112</Text>
                    </Pressable>
                  </View>

                  {/* Police */}
                  <View style={styles.contactCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.contactTitle}>Police</Text>
                      <Text style={styles.contactSubtitle}>National Police Helpline</Text>
                    </View>
                    <Pressable onPress={() => Linking.openURL('tel:100')} style={styles.contactCallBtn}>
                      <Text style={styles.contactCallText}>Call 100</Text>
                    </Pressable>
                  </View>

                  {/* Ambulance */}
                  <View style={styles.contactCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.contactTitle}>Ambulance</Text>
                      <Text style={styles.contactSubtitle}>Medical Emergency</Text>
                    </View>
                    <Pressable onPress={() => Linking.openURL('tel:102')} style={styles.contactCallBtn}>
                      <Text style={styles.contactCallText}>Call 102</Text>
                    </Pressable>
                  </View>

                  {/* Fire Brigade */}
                  <View style={styles.contactCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.contactTitle}>Fire Brigade</Text>
                      <Text style={styles.contactSubtitle}>Fire Emergency</Text>
                    </View>
                    <Pressable onPress={() => Linking.openURL('tel:101')} style={styles.contactCallBtn}>
                      <Text style={styles.contactCallText}>Call 101</Text>
                    </Pressable>
                  </View>

                  {/* Disaster Helpline */}
                  <View style={styles.contactCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.contactTitle}>{t('disasterHelpline')}</Text>
                      <Text style={styles.contactSubtitle}>24/7 Disaster Support</Text>
                    </View>
                    <Pressable
                      onPress={() => Linking.openURL('tel:1078')}
                      style={styles.contactCallBtn}
                    >
                      <Text style={styles.contactCallText}>Call</Text>
                    </Pressable>
                  </View>

                  {/* Red Cross India */}
                  <View style={styles.contactCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.contactTitle}>Indian Red Cross</Text>
                      <Text style={styles.contactSubtitle}>Humanitarian Aid</Text>
                    </View>
                    <Pressable
                      onPress={() => Linking.openURL('tel:011-23711551')}
                      style={styles.contactCallBtn}
                    >
                      <Text style={styles.contactCallText}>Call</Text>
                    </Pressable>
                  </View>

                  {/* Women Helpline */}
                  <View style={styles.contactCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.contactTitle}>{t('womenHelpline')}</Text>
                      <Text style={styles.contactSubtitle}>Women in Distress</Text>
                    </View>
                    <Pressable
                      onPress={() => Linking.openURL('tel:1091')}
                      style={styles.contactCallBtn}
                    >
                      <Text style={styles.contactCallText}>Call</Text>
                    </Pressable>
                  </View>

                  {/* Child Helpline */}
                  <View style={styles.contactCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.contactTitle}>{t('childHelpline')}</Text>
                      <Text style={styles.contactSubtitle}>Emergency Support for Children</Text>
                    </View>
                    <Pressable
                      onPress={() => Linking.openURL('tel:1098')}
                      style={styles.contactCallBtn}
                    >
                      <Text style={styles.contactCallText}>Call</Text>
                    </Pressable>
                  </View>

                  {/* Indian Coast Guard - National Maritime Help */}
                  <View style={styles.contactCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.contactTitle}>Indian Coast Guard (National Maritime Help)</Text>
                      <Text style={styles.contactSubtitle}>Maritime Distress</Text>
                    </View>
                    <Pressable onPress={() => Linking.openURL('tel:1554')} style={styles.contactCallBtn}>
                      <Text style={styles.contactCallText}>Call 1554</Text>
                    </Pressable>
                  </View>

                  {/* INCOIS Tsunami / Ocean Alerts */}
                  <View style={styles.contactCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.contactTitle}>INCOIS Tsunami / Ocean Alerts</Text>
                      <Text style={styles.contactSubtitle}>tsunami.incois.gov.in</Text>
                    </View>
                    <Pressable onPress={() => Linking.openURL('https://tsunami.incois.gov.in')} style={styles.contactCallBtn}>
                      <Text style={styles.contactCallText}>Open</Text>
                    </Pressable>
                  </View>

                  {/* Coast Guard & Maritime Contacts by Region */}
                  <Text style={[styles.sectionTitle, { fontSize: 18, marginTop: 16 }]}>Coast Guard & Maritime Contacts</Text>

                  <View style={styles.contactCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.contactTitle}>Maharashtra (Raigad)</Text>
                      <Text style={styles.contactSubtitle}>Coast Guard / Maritime</Text>
                    </View>
                    <Pressable onPress={() => Linking.openURL('tel:1554')} style={styles.contactCallBtn}>
                      <Text style={styles.contactCallText}>Call 1554</Text>
                    </Pressable>
                  </View>

                  <View style={styles.contactCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.contactTitle}>Coast Guard Western HQ (Mumbai)</Text>
                      <Text style={styles.contactSubtitle}>Regional Headquarters</Text>
                    </View>
                    <Pressable onPress={() => Linking.openURL('tel:02224371932')} style={styles.contactCallBtn}>
                      <Text style={styles.contactCallText}>Call</Text>
                    </Pressable>
                  </View>

                  <View style={styles.contactCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.contactTitle}>Goa (Coast Guard Dist. HQ)</Text>
                      <Text style={styles.contactSubtitle}>District HQ</Text>
                    </View>
                    <Pressable onPress={() => Linking.openURL('tel:08232950276')} style={styles.contactCallBtn}>
                      <Text style={styles.contactCallText}>Call</Text>
                    </Pressable>
                  </View>

                  <View style={styles.contactCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.contactTitle}>Gujarat (Coastal Police)</Text>
                      <Text style={styles.contactSubtitle}>Coastal Helpline</Text>
                    </View>
                    <Pressable onPress={() => Linking.openURL('tel:1093')} style={styles.contactCallBtn}>
                      <Text style={styles.contactCallText}>Call 1093</Text>
                    </Pressable>
                  </View>

                  <View style={styles.contactCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.contactTitle}>Kerala (Thiruvananthapuram HQ)</Text>
                      <Text style={styles.contactSubtitle}>Regional HQ</Text>
                    </View>
                    <Pressable onPress={() => Linking.openURL('tel:04712486484')} style={styles.contactCallBtn}>
                      <Text style={styles.contactCallText}>Call</Text>
                    </Pressable>
                  </View>

                  <View style={styles.contactCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.contactTitle}>Tamil Nadu (Mandapam Station)</Text>
                      <Text style={styles.contactSubtitle}>Station</Text>
                    </View>
                    <Pressable onPress={() => Linking.openURL('tel:04573242334')} style={styles.contactCallBtn}>
                      <Text style={styles.contactCallText}>Call</Text>
                    </Pressable>
                  </View>

                  <View style={styles.contactCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.contactTitle}>Tamil Nadu (Coimbatore Maritime Help)</Text>
                      <Text style={styles.contactSubtitle}>Maritime Help</Text>
                    </View>
                    <Pressable onPress={() => Linking.openURL('tel:1718')} style={styles.contactCallBtn}>
                      <Text style={styles.contactCallText}>Call 1718</Text>
                    </Pressable>
                  </View>

                  <View style={styles.contactCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.contactTitle}>Odisha (Paradip MRSC)</Text>
                      <Text style={styles.contactSubtitle}>Maritime Rescue Sub Centre</Text>
                    </View>
                    <Pressable onPress={() => Linking.openURL('tel:06722223359')} style={styles.contactCallBtn}>
                      <Text style={styles.contactCallText}>Call</Text>
                    </Pressable>
                  </View>

                  <View style={styles.contactCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.contactTitle}>Andaman & Nicobar Islands</Text>
                      <Text style={styles.contactSubtitle}>Maritime Contact</Text>
                    </View>
                    <Pressable onPress={() => Linking.openURL('tel:03192231638')} style={styles.contactCallBtn}>
                      <Text style={styles.contactCallText}>Call</Text>
                    </Pressable>
                  </View>

                  <View style={styles.contactCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.contactTitle}>Eastern Region (Chennai HQ)</Text>
                      <Text style={styles.contactSubtitle}>Regional Headquarters</Text>
                    </View>
                    <Pressable onPress={() => Linking.openURL('tel:04425391718')} style={styles.contactCallBtn}>
                      <Text style={styles.contactCallText}>Call</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            )}

          </ScrollView>

          {/* SOS Button - Floating */}
          <Pressable 
            style={[styles.sosButton, sosActive && styles.sosButtonActive]}
            onPress={() => setShowSosConfirm(true)}
          >
            <Text style={styles.sosButtonText}>🆘</Text>
            <Text style={styles.sosButtonLabel}>SOS</Text>
          </Pressable>

          {/* SOS Confirm Modal */}
          {showSosConfirm && (
            <View style={styles.overlayModal}>
              <View style={styles.sosModalContainer}>
                <View style={styles.sosModalIconWrap}>
                  <Ionicons name="warning" size={28} color="#ef4444" />
                </View>
                <Text style={styles.sosModalTitle}>Emergency SOS</Text>
                <Text style={styles.sosModalDesc}>
                  This will immediately alert emergency services to your location. Only use in case of real emergency.
                </Text>

                <View style={styles.sosInfoList}>
                  <View style={styles.sosInfoItem}>
                    <Ionicons name="location-outline" size={16} color="#374151" style={{ marginRight: 8 }} />
                    <Text style={styles.sosInfoText}>Location: {SOS_LOCATION_TEXT}</Text>
                  </View>
                  <View style={styles.sosInfoItem}>
                    <Ionicons name="call-outline" size={16} color="#374151" style={{ marginRight: 8 }} />
                    <Text style={styles.sosInfoText}>Will contact: Emergency Services ({SOS_CALL_NUMBER})</Text>
                  </View>
                  <View style={styles.sosInfoItem}>
                    <Ionicons name="time-outline" size={16} color="#374151" style={{ marginRight: 8 }} />
                    <Text style={styles.sosInfoText}>5 second countdown before activation</Text>
                  </View>
                </View>

                <Pressable style={styles.sosConfirmButton} onPress={startSosCountdown}>
                  <Text style={styles.sosConfirmButtonText}>Confirm Emergency</Text>
                </Pressable>
                <Pressable style={styles.sosCancelButton} onPress={() => setShowSosConfirm(false)}>
                  <Text style={styles.sosCancelButtonText}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* SOS Countdown Modal */}
          {showSosCountdown && (
            <View style={styles.overlayModal}>
              <View style={styles.sosModalContainer}>
                <View style={styles.sosModalIconWrap}>
                  <Ionicons name="alert-circle-outline" size={30} color="#f87171" />
                </View>
                <Text style={styles.sosModalTitle}>Activating Emergency Alert</Text>
                <Text style={styles.sosModalDesc}>Emergency services will be notified in {sosCountdown} seconds</Text>

                <View style={styles.sosProgressTrack}>
                  <View style={[styles.sosProgressFill, { width: `${((5 - sosCountdown) / 5) * 100}%` }]} />
                </View>

                <Pressable style={styles.sosCancelButton} onPress={cancelSosCountdown}>
                  <Text style={styles.sosCancelButtonText}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          )}
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  // Officials App Interface  
  if (currentState === 'officialsApp' && user) {
    // Role-based feature filtering function
    const getOfficialFeatures = (userRole: any) => {
      const allFeatures = [
        { 
          id: 'analytics', 
          title: 'Analytics Dashboard', 
          description: 'Monitor incident statistics, trends, and response metrics',
          icon: 'analytics',
          iconFamily: 'Ionicons',
          color: '#3b82f6',
          bgColor: '#eff6ff'
        },
        { 
          id: 'verification', 
          title: 'Report Verification', 
          description: 'Verify and validate citizen incident reports with AI assistance',
          icon: 'verified',
          iconFamily: 'MaterialIcons',
          color: '#10b981',
          bgColor: '#ecfdf5'
        },
        { 
          id: 'broadcast', 
          title: 'Alert Broadcasting', 
          description: 'Send targeted emergency alerts to affected geographical areas',
          icon: 'campaign',
          iconFamily: 'MaterialIcons',
          color: '#f59e0b',
          bgColor: '#fffbeb'
        },
        { 
          id: 'sos', 
          title: 'SOS Response Feed', 
          description: 'Manage and respond to emergency SOS calls and distress signals',
          icon: 'emergency',
          iconFamily: 'MaterialIcons',
          color: '#ef4444',
          bgColor: '#fef2f2'
        },
        { 
          id: 'management', 
          title: 'Resource Management', 
          description: 'Allocate emergency resources and track response teams',
          icon: 'build',
          iconFamily: 'Ionicons',
          color: '#8b5cf6',
          bgColor: '#f3e8ff'
        },
        { 
          id: 'coordination', 
          title: 'Team Coordination', 
          description: 'Coordinate response teams and communication channels',
          icon: 'people',
          iconFamily: 'Ionicons',
          color: '#06b6d4',
          bgColor: '#ecfeff'
        },
      ];

      // Filter features based on role
      if (userRole === 'admin') {
        // System Administrator: All 6 features (Analytics, Verification, Broadcasting, SOS, Resource Management, Team Coordination)
        return allFeatures;
      } else if (userRole === 'field') {
        // Field Officer: Alert Broadcasting + Report Verification only
        return allFeatures.filter(feature => 
          feature.id === 'broadcast' || feature.id === 'verification'
        );
      } else if (userRole === 'responder') {
        // Emergency Responder: Alert Broadcasting + Report Verification + Resource Management
        return allFeatures.filter(feature => 
          feature.id === 'broadcast' || feature.id === 'verification' || feature.id === 'management'
        );
      } else {
        // Default: Show all features for any other official role
        return allFeatures;
      }
    };

    const features = user.role === 'citizen' 
      ? [
          { 
            id: 'alerts', 
            title: 'Disaster Alerts', 
            description: 'Receive real-time emergency notifications and safety warnings',
            icon: 'warning',
            iconFamily: 'Ionicons',
            color: '#ef4444',
            bgColor: '#fef2f2'
          },
          { 
            id: 'report', 
            title: 'Report Incident', 
            description: 'Report emergencies with GPS location and photo evidence',
            icon: 'report-problem',
            iconFamily: 'MaterialIcons',
            color: '#f59e0b',
            bgColor: '#fffbeb'
          },
          { 
            id: 'sos', 
            title: 'Emergency SOS', 
            description: 'Send immediate distress signal to emergency services',
            icon: 'sos',
            iconFamily: 'MaterialIcons',
            color: '#dc2626',
            bgColor: '#fef2f2'
          },
          { 
            id: 'facilities', 
            title: 'Emergency Facilities', 
            description: 'Find nearby hospitals, shelters, and emergency services',
            icon: 'local-hospital',
            iconFamily: 'MaterialIcons',
            color: '#10b981',
            bgColor: '#ecfdf5'
          },
          { 
            id: 'map', 
            title: 'Danger Zone Map', 
            description: 'View hazard zones, safe routes, and evacuation areas',
            icon: 'map',
            iconFamily: 'Ionicons',
            color: '#6366f1',
            bgColor: '#eef2ff'
          },
          { 
            id: 'queue', 
            title: 'Offline Queue', 
            description: 'View pending reports and sync when connection returns',
            icon: 'cloud-sync',
            iconFamily: 'MaterialCommunityIcons',
            color: '#8b5cf6',
            bgColor: '#f3e8ff'
          },
        ]
      : getOfficialFeatures(user.officialRole || user.role);

  // Tabs allowed for this official
  const officialTabs = getOfficialTabs(user.officialRole || user.role);
  const allowedOfficialTabKeys = officialTabs.map(t => t.key);
  const currentOfficialTab = (allowedOfficialTabKeys.includes(officialTab) ? officialTab : allowedOfficialTabKeys[0]) as typeof officialTab;

  const getIcon = (feature: any) => {
      const iconProps = {
        name: feature.icon,
        size: 28,
        color: feature.color
      };

      switch (feature.iconFamily) {
        case 'Ionicons':
          return <Ionicons {...iconProps} />;
        case 'MaterialIcons':
          return <MaterialIcons {...iconProps} />;
        case 'MaterialCommunityIcons':
          return <MaterialCommunityIcons {...iconProps} />;
        default:
          return <Ionicons {...iconProps} />;
      }
    };

    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <StatusBar style="light" />
          
          {/* Header */}
          {user.role === 'official' ? (
            <View style={styles.plainHeader}>
              <View style={styles.plainHeaderLeft}>
                <TouchableOpacity onPress={() => setCurrentState('officialLogin')} style={{ padding: 6, marginRight: 6 }}>
                  <Ionicons name="arrow-back-outline" size={20} color="#111827" />
                </TouchableOpacity>
                <View style={styles.titleRow}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="shield-outline" size={12} color="#111827" />
                  </View>
                  <Text style={styles.titleText} numberOfLines={1} ellipsizeMode="tail">Emergency Command Center</Text>
                </View>
              </View>
              <View style={styles.plainHeaderRight}>
                {(user as any).officialRole && (
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleBadgeText} numberOfLines={1} ellipsizeMode="tail">
                      {((user as any).officialRole === 'field' && 'Field Officer') ||
                        ((user as any).officialRole === 'admin' && 'System Administrator') ||
                        ((user as any).officialRole === 'responder' && 'Emergency Responder')}
                    </Text>
                  </View>
                )}
                <TouchableOpacity style={styles.logoutOutlineBtn} onPress={handleLogout}>
                  <Text style={styles.logoutOutlineText}>Logout</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <LinearGradient
              colors={['#10b981', '#059669', '#047857']}
              style={styles.dashboardHeader}
            >
              <Animated.View 
                style={[
                  styles.headerContent,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                  }
                ]}
              >
                <View style={styles.userInfo}>
                  <Text style={styles.welcomeText}>👤 Citizen Portal</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.emailText}>{user.email}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                  <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
              </Animated.View>
            </LinearGradient>
          )}
          
          {/* Officials Dashboard Content */}
          <ScrollView style={styles.featuresContainer} contentContainerStyle={{ flexGrow: 1, paddingBottom: 12 }} showsVerticalScrollIndicator={false}>
            {/* Top navbar with role-based tabs */}
            <View style={styles.officialNavbar}>
              {officialTabs.map(item => (
                <Pressable
                  key={item.key}
                  onPress={() => setOfficialTab(item.key as any)}
                  style={[styles.officialNavItem, currentOfficialTab === (item.key as any) && styles.officialNavItemActive]}
                >
                  <Ionicons name={item.icon as any} size={22} color={currentOfficialTab === (item.key as any) ? '#111827' : '#6b7280'} />
                  {currentOfficialTab === (item.key as any) && <View style={styles.officialNavIndicator} />}
                </Pressable>
              ))}
            </View>

            {currentOfficialTab === 'analytics' && (
              <View>
                <Text style={styles.analyticsTitle}>Analytics{"\n"}Dashboard</Text>
                <View style={styles.analyticsToolbar}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.analyticsSubtitle}>Real-time disaster management insights</Text>
                  </View>
                  <View style={styles.rangeDropdownWrap}>
                    <Pressable style={styles.rangeDropdown} onPress={() => setShowRangeMenu(!showRangeMenu)}>
                      <Text style={styles.rangeDropdownText}>{analyticsRange}</Text>
                      <Text style={styles.dropdownArrow}>▼</Text>
                    </Pressable>
                    {showRangeMenu && (
                      <View style={styles.rangeMenu}>
                        {(['Last 24h','Last 7d','Last 30d'] as const).map(r => (
                          <Pressable key={r} style={styles.rangeMenuItem} onPress={() => { setAnalyticsRange(r); setShowRangeMenu(false); }}>
                            <Text style={[styles.rangeMenuItemText, analyticsRange === r && { color: '#2563eb', fontWeight: '700' }]}>{r}</Text>
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </View>
                  <Pressable style={styles.toolbarBtn}><Ionicons name="refresh" size={16} color="#111827" /><Text style={styles.toolbarBtnText}>Refresh</Text></Pressable>
                  <Pressable style={styles.toolbarIconBtn}><Ionicons name="download" size={16} color="#111827" /></Pressable>
                </View>

                {/* Stat cards */}
                <View style={styles.statGrid}>
                  {[
                    { title: 'Active Incidents', value: '24', delta: '+12%', icon: 'alert-circle-outline', color: '#ef4444' },
                    { title: 'Reports Verified', value: '156', delta: '+8%', icon: 'pulse-outline', color: '#10b981' },
                    { title: 'People Evacuated', value: '2,847', delta: '+15%', icon: 'people-outline', color: '#3b82f6' },
                    { title: 'Response Time', value: '4.2 min', delta: '−18%', icon: 'time-outline', color: '#10b981' },
                  ].map((s, i) => (
                    <View key={i} style={styles.statCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.statTitle}>{s.title}</Text>
                        <Text style={styles.statValue}>{s.value}</Text>
                        <Text style={[styles.statDelta, { color: s.delta.includes('-') ? '#16a34a' : '#16a34a' }]}>↗ {s.delta}</Text>
                      </View>
                      <View style={styles.statIconWrap}><Ionicons name={s.icon as any} size={20} color={s.color} /></View>
                    </View>
                  ))}
                </View>

                {/* Charts placeholders */}
                <View style={styles.chartCard}>
                  <Text style={styles.chartTitle}>Incident Trends</Text>
                  {(() => {
                    const chartWidth = Math.min(width - 60, 340);
                    const chartHeight = 200;
                    const paddingLeft = 40;
                    const paddingTop = 10;
                    const paddingRight = 10;
                    const paddingBottom = 30;
                    const x0 = paddingLeft;
                    const y0 = chartHeight - paddingBottom;
                    const xMax = chartWidth - paddingRight;
                    const yMin = paddingTop;
                    const xScale = (v: number) => x0 + (v / 20) * (xMax - x0);
                    const yScale = (v: number) => y0 - (v / 60) * (y0 - yMin);
                    const xTicks = [0,4,8,12,20];
                    const yTicks = [0,15,30,45,60];
                    const green = [ { x:0,y:8 }, { x:4,y:5 }, { x:8,y:16 }, { x:12,y:30 }, { x:20,y:18 } ];
                    const red =   [ { x:0,y:12 },{ x:4,y:6 }, { x:8,y:25 }, { x:12,y:42 }, { x:20,y:30 } ];
                    const toPts = (arr: {x:number;y:number}[]) => arr.map(p => `${xScale(p.x)},${yScale(p.y)}`).join(' ');
                    return (
                      <View style={{ alignItems: 'center', marginTop: 6 }}>
                        <Svg width={chartWidth} height={chartHeight}>
                          {/* Grid: horizontal */}
                          {yTicks.map((t, i) => (
                            <SvgLine key={`h${i}`} x1={x0} y1={yScale(t)} x2={xMax} y2={yScale(t)} stroke="#e5e7eb" strokeDasharray="4,4" />
                          ))}
                          {/* Grid: vertical */}
                          {xTicks.map((t, i) => (
                            <SvgLine key={`v${i}`} x1={xScale(t)} y1={yMin} x2={xScale(t)} y2={y0} stroke="#e5e7eb" strokeDasharray="4,4" />
                          ))}
                          {/* Axes */}
                          <SvgLine x1={x0} y1={yMin} x2={x0} y2={y0} stroke="#9ca3af" />
                          <SvgLine x1={x0} y1={y0} x2={xMax} y2={y0} stroke="#9ca3af" />
                          {/* Y labels */}
                          {yTicks.map((t, i) => (
                            <SvgText key={`yl${i}`} x={x0 - 26} y={yScale(t) + 4} fill="#374151" fontSize="10">{`${t}`}</SvgText>
                          ))}
                          {/* X labels */}
                          {xTicks.map((t, i) => (
                            <SvgText key={`xl${i}`} x={xScale(t) - 16} y={y0 + 14} fill="#374151" fontSize="10">
                              {t===0?'00:00': t===4?'04:00': t===8?'08:00': t===12?'12:00':'20:00'}
                            </SvgText>
                          ))}
                          {/* Series polylines */}
                          <SvgPolyline points={toPts(green)} fill="none" stroke="#10b981" strokeWidth={3} />
                          <SvgPolyline points={toPts(red)} fill="none" stroke="#ef4444" strokeWidth={3} />
                          {/* Dots */}
                          {green.map((p, i) => (
                            <SvgCircle key={`gd${i}`} cx={xScale(p.x)} cy={yScale(p.y)} r={4} fill="#ffffff" stroke="#10b981" strokeWidth={2} />
                          ))}
                          {red.map((p, i) => (
                            <SvgCircle key={`rd${i}`} cx={xScale(p.x)} cy={yScale(p.y)} r={4} fill="#ffffff" stroke="#ef4444" strokeWidth={2} />
                          ))}
                        </Svg>
                      </View>
                    );
                  })()}
                </View>
                <View style={styles.chartCard}>
                  <Text style={styles.chartTitle}>Incident Distribution</Text>
                  <View style={{ marginTop: 6 }}>
                    <View style={styles.stackedBarTrack}>
                      <View style={[styles.stackedBarSeg,{ width: '45%', backgroundColor:'#ef4444' }]} />
                      <View style={[styles.stackedBarSeg,{ width: '30%', backgroundColor:'#f59e0b' }]} />
                      <View style={[styles.stackedBarSeg,{ width: '25%', backgroundColor:'#3b82f6' }]} />
                    </View>
                    <View style={styles.legendRow}>
                      {[
                        { name:'Flood', color:'#ef4444', pct:'45%' },
                        { name:'Fire', color:'#f59e0b', pct:'30%' },
                        { name:'Other', color:'#3b82f6', pct:'25%' },
                      ].map((it)=> (
                        <View key={it.name} style={styles.legendItemRow}>
                          <View style={[styles.legendSwatch,{ backgroundColor: it.color }]} />
                          <Text style={{ color:'#0b1320', fontWeight:'700' }}>{it.name}</Text>
                          <Text style={{ color:'#6b7280', marginLeft: 4 }}>{it.pct}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>

                {/* Social Media Monitoring */}
                <View style={styles.panelCard}>
                  <Text style={styles.panelTitle}>Social Media Monitoring</Text>
                  {[
                    { name:'Twitter', value:'1,234', sentiment:'Negative', urgent:'85%' },
                    { name:'Facebook', value:'856', sentiment:'Mixed', urgent:'62%' },
                    { name:'Instagram', value:'445', sentiment:'Neutral', urgent:'34%' },
                    { name:'Reddit', value:'234', sentiment:'Negative', urgent:'78%' },
                  ].map((p,i)=>(
                    <View key={i} style={styles.socialRow}>
                      <View style={{ flex:1 }}>
                        <Text style={styles.socialName}>{p.name}</Text>
                        <Text style={styles.socialSub}>mentions</Text>
                        <View style={{ flexDirection:'row', alignItems:'center', marginTop:6 }}>
                          <View style={[styles.dot,{ backgroundColor: p.sentiment==='Negative'?'#ef4444':p.sentiment==='Mixed'?'#f59e0b':'#10b981' }]} />
                          <Text style={styles.socialSent}>{p.sentiment} Sentiment</Text>
                        </View>
                      </View>
                      <Text style={styles.socialValue}>{p.value}</Text>
                      <View style={[styles.urgentPill, { backgroundColor: '#fee2e2' }]}>
                        <Text style={styles.urgentText}>{p.urgent} Urgent</Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* AI Risk Predictions */}
                <View style={styles.panelCard}>
                  <Text style={styles.panelTitle}>AI Risk Predictions</Text>
                  {[
                    { name:'Flood Risk', color:'#ef4444', pct:85, window:'Next 6 hours' },
                    { name:'Storm Activity', color:'#f59e0b', pct:62, window:'Next 12 hours' },
                    { name:'Earthquake', color:'#10b981', pct:15, window:'Next 24 hours' },
                  ].map((r,i)=>(
                    <View key={i} style={styles.riskRow}>
                      <View style={styles.riskHeader}>
                        <View style={[styles.dot,{ backgroundColor: r.color }]} />
                        <Text style={styles.riskName}>{r.name}</Text>
                        <Text style={styles.riskPct}>{r.pct}%</Text>
                      </View>
                      <View style={styles.riskTrack}>
                        <View style={[styles.riskFill,{ width: `${r.pct}%`, backgroundColor: r.color }]} />
                      </View>
                      <Text style={styles.riskWindow}>{r.window}</Text>
                    </View>
                  ))}
                </View>

                {/* Shelter Occupancy */}
                <View style={styles.panelCard}>
                  <Text style={styles.panelTitle}>Shelter Occupancy</Text>
                  {[
                    { name:'Community Center', occ:'425/500', pct:85 },
                    { name:'Sports Complex', occ:'520/800', pct:65 },
                    { name:'School Gymnasium', occ:'150/300', pct:50 },
                  ].map((s,i)=>(
                    <View key={i} style={styles.shelterRow}>
                      <View style={{ flex:1 }}>
                        <Text style={styles.shelterName}>{s.name}</Text>
                        <Text style={styles.shelterSub}>{s.occ} occupied</Text>
                      </View>
                      <View style={[styles.urgentPill, { backgroundColor: '#f3f4f6' }]}>
                        <Text style={styles.shelterPct}>{s.pct}%</Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Response Teams */}
                <View style={[styles.panelCard,{ marginBottom: 100 }]}>
                  <Text style={styles.panelTitle}>Response Teams</Text>
                  {[
                    { name:'Alpha Team', area:'Sector 7', members:8, status:'deployed' },
                    { name:'Bravo Team', area:'Base Station', members:6, status:'standby' },
                    { name:'Charlie Team', area:'Sector 3', members:7, status:'deployed' },
                    { name:'Delta Team', area:'Base Station', members:5, status:'maintenance' },
                  ].map((t,i)=>(
                    <View key={i} style={styles.teamRow}>
                      <View style={{ flex:1 }}>
                        <Text style={styles.teamName}>{t.name}</Text>
                        <Text style={styles.teamSub}>{t.area}</Text>
                      </View>
                      <View style={[styles.teamStatusPill,{ backgroundColor: t.status==='deployed'?'#fee2e2':t.status==='standby'?'#e5e7eb':'#eef2ff' }]}>
                        <Text style={[styles.teamStatusText,{ color: t.status==='deployed'?'#991b1b': t.status==='standby'?'#111827':'#1d4ed8' }]}>{t.status}</Text>
                      </View>
                      <Text style={styles.teamMembers}>{t.members} members</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {currentOfficialTab === 'verification' && (
              <View style={{ padding: 12, marginBottom: 24 }}>
                {/* Title + subtitle */}
                <Text style={styles.analyticsTitle}>Report{"\n"}Verification</Text>
                <Text style={styles.analyticsSubtitle}>Review and verify citizen incident reports</Text>

                {/* Search + Filter row */}
                <View style={styles.verifySearchRow}>
                  <View style={styles.verifySearchBox}>
                    <Ionicons name="search-outline" size={16} color="#6b7280" />
                    <TextInput value={verifyQuery} onChangeText={setVerifyQuery} placeholder="Search reports..." placeholderTextColor="#9ca3af" style={styles.verifySearchInput} />
                  </View>
                  <Pressable style={styles.verifyFilterBtn} onPress={()=>Alert.alert('Filter','Filter options coming soon')}> 
                    <Ionicons name="filter-outline" size={16} color="#111827" />
                    <Text style={styles.verifyFilterText}>Filter</Text>
                  </Pressable>
                </View>

                {/* Summary cards */}
                <View style={{ gap: 8, marginTop: 6 }}>
                  <View style={styles.verifyStatCard}>
                    <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
                      <View>
                        <Text style={styles.verifyStatTitle}>Pending Review</Text>
                        <Text style={styles.verifyStatValue}>{reports.filter(r=>r.status==='Pending').length}</Text>
                      </View>
                      <Ionicons name="time-outline" size={22} color="#f59e0b" />
                    </View>
                  </View>
                  <View style={styles.verifyStatCard}>
                    <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
                      <View>
                        <Text style={styles.verifyStatTitle}>Verified</Text>
                        <Text style={styles.verifyStatValue}>{reports.filter(r=>r.status==='Verified').length}</Text>
                      </View>
                      <Ionicons name="checkmark-done-outline" size={22} color="#10b981" />
                    </View>
                  </View>
                  <View style={styles.verifyStatCard}>
                    <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
                      <View>
                        <Text style={styles.verifyStatTitle}>Flagged</Text>
                        <Text style={styles.verifyStatValue}>{reports.filter(r=>r.status==='Flagged').length}</Text>
                      </View>
                      <Ionicons name="flag-outline" size={22} color="#ef4444" />
                    </View>
                  </View>
                  <View style={styles.verifyStatCard}>
                    <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
                      <View>
                        <Text style={styles.verifyStatTitle}>Avg AI Score</Text>
                        <Text style={styles.verifyStatValue}>{Math.round(reports.reduce((s,r)=>s+r.aiScore,0)/reports.length)}%</Text>
                      </View>
                      <Ionicons name="star-outline" size={22} color="#3b82f6" />
                    </View>
                  </View>
                </View>

                {/* Tabs like screenshot */}
                <View style={styles.segmentContainer}>
                  {(['Pending','Verified','Flagged','All Reports'] as const).map(seg => {
                    const counts = {
                      Pending: reports.filter(r=>r.status==='Pending').length,
                      Verified: reports.filter(r=>r.status==='Verified').length,
                      Flagged: reports.filter(r=>r.status==='Flagged').length,
                      'All Reports': reports.length,
                    } as const;
                    const active = verificationFilter === seg;
                    return (
                      <Pressable key={seg} style={[styles.segmentItem, active && styles.segmentItemActive]} onPress={()=>setVerificationFilter(seg)}>
                        <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{seg} ({counts[seg]})</Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Reports List */}
                <View style={{ marginTop: 8, gap: 8 }}>
                  {reports
                    .filter(r => verificationFilter==='All Reports' ? true : r.status===verificationFilter)
                    .filter(r => verifyQuery.trim() ? (
                      r.id.toLowerCase().includes(verifyQuery.toLowerCase()) ||
                      r.title.toLowerCase().includes(verifyQuery.toLowerCase()) ||
                      r.location.toLowerCase().includes(verifyQuery.toLowerCase()) ||
                      r.user.toLowerCase().includes(verifyQuery.toLowerCase())
                    ) : true)
                    .map((r)=>{
                    const scoreColor = r.aiScore>=80?'#10b981': r.aiScore>=60?'#f59e0b':'#ef4444';
                    return (
                      <View key={r.id} style={styles.verifyCard}>
                        {/* Title + badges */}
                        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start' }}>
                          <View style={{ flex:1, paddingRight: 8 }}>
                            <Text style={styles.verifyCardTitle}>{r.title}</Text>
                            <View style={styles.verifyBadgeRow}>
                              <View style={[styles.badgePill,{ backgroundColor:'#fef3c7' }]}> 
                                <Text style={[styles.badgePillText,{ color:'#92400e' }]}>pending</Text>
                              </View>
                              <View style={[styles.badgePill,{ backgroundColor: r.priority==='High'?'#fee2e2':'#dbeafe' }]}> 
                                <Text style={[styles.badgePillText,{ color: r.priority==='High'?'#991b1b':'#1d4ed8' }]}>{r.priority.toLowerCase()} priority</Text>
                              </View>
                              {r.hasMedia && (
                                <View style={[styles.badgePill,{ backgroundColor:'#eef2ff' }]}>
                                  <Text style={[styles.badgePillText,{ color:'#3730a3' }]}>Media</Text>
                                </View>
                              )}
                            </View>
                          </View>
                          {/* Vertical actions - only show for Pending reports */}
                          {verificationFilter === 'Pending' && (
                            <View style={styles.verifyActionCol}>
                              <Pressable style={[styles.primaryBtn, { paddingVertical: 6 }]} onPress={()=>{
                                setReports(prev=>prev.map(x=>x.id===r.id?{...x,status:'Verified'}:x));
                                Alert.alert('Verified', `${r.id} verified.`);
                              }}>
                                <Ionicons name="checkmark" size={16} color="#ffffff" />
                                <Text style={styles.primaryBtnText}>Verify</Text>
                              </Pressable>
                              <Pressable style={[styles.secondaryBtn, { paddingVertical: 6 }]} onPress={()=>{
                                setReports(prev=>prev.map(x=>x.id===r.id?{...x,status:'Flagged'}:x));
                                Alert.alert('Flagged', `${r.id} marked for review.`);
                              }}>
                                <Ionicons name="flag-outline" size={16} color="#111827" />
                                <Text style={styles.secondaryBtnText}>Flag</Text>
                              </Pressable>
                              <Pressable style={[styles.rejectBtn, { paddingVertical: 6 }]} onPress={()=>{
                                setReports(prev=>prev.filter(x=>x.id!==r.id));
                                Alert.alert('Rejected', `${r.id} rejected.`);
                              }}>
                                <Ionicons name="close-outline" size={16} color="#ef4444" />
                                <Text style={styles.rejectBtnText}>Reject</Text>
                              </Pressable>
                            </View>
                          )}
                        </View>

                        {/* Description */}
                        <Text style={styles.verifyDesc}>{r.description}</Text>

                        {/* Meta row */}
                        <View style={{ flexDirection:'row', alignItems:'center', gap: 12, marginTop: 6, flexWrap:'wrap' }}>
                          <Text style={styles.verifyMetaStrong}>{r.location}</Text>
                          <Text style={styles.verifyMeta}>{r.time}</Text>
                          <Text style={styles.verifyMeta}>by {r.user}</Text>
                        </View>

                        {/* Tags */}
                        <View style={styles.verifyChipsRow}>
                          {r.tags.map((t, i)=>(
                            <View key={i} style={styles.verifyChip}><Text style={styles.verifyChipText}>{t}</Text></View>
                          ))}
                        </View>

                        {/* AI Score bar */}
                        <View style={styles.aiRow}>
                          <Text style={styles.aiLabel}>AI Authenticity Score:</Text>
                          <Text style={[styles.aiLabel,{ fontWeight:'800', color: scoreColor }]}>{r.aiScore}%</Text>
                        </View>
                        <View style={styles.aiBarTrack}>
                          <View style={[styles.aiBarFill,{ width: `${r.aiScore}%`, backgroundColor: scoreColor }]} />
                        </View>
                      </View>
                    );
                  })}
                  {reports.filter(r => verificationFilter==='All Reports' ? true : r.status===verificationFilter).length===0 && (
                    <View style={[styles.panelCard,{ alignItems:'center' }]}> 
                      <Text style={{ color:'#6b7280' }}>No reports in {verificationFilter.toLowerCase()}.</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {currentOfficialTab === 'broadcast' && (
              <View style={{ padding: 12, marginBottom: 24 }}>
                <Text style={styles.analyticsTitle}>Alert{ "\n" }Broadcasting</Text>
                <Text style={styles.analyticsSubtitle}>Send emergency alerts to citizens</Text>
                
                {/* Socket Connection Status */}
                <View style={{ backgroundColor: isSocketConnected ? '#d1fae5' : '#fee2e2', padding: 12, borderRadius: 8, marginTop: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isSocketConnected ? '#10b981' : '#ef4444', marginRight: 8 }} />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>
                    {isSocketConnected ? '🟢 Connected to Alert Server' : '🔴 Not Connected - Check Network'}
                  </Text>
                </View>

                {/* Quick Templates */}
                <View style={[styles.panelCard, { marginTop: 8 }]}> 
                  <Text style={styles.panelTitle}>Quick Templates</Text>
                  {[0,1,2,3].map(i=>{
                    const t = QUICK_TEMPLATES[i];
                    const badgeStyle = t.severity==='Severe'?{bg:'#fee2e2',fg:'#b91c1c'}: t.severity==='Moderate'?{bg:'#fef3c7',fg:'#92400e'}:{bg:'#dbeafe',fg:'#1d4ed8'};
                    return (
                      <Pressable key={i} style={styles.templateCard} onPress={()=>{ setBcTitle(t.title); setBcDesc(t.message); setBcSeverity(t.severity); }}>
                        <View style={{ flex:1 }}>
                          <Text style={styles.templateTitle}>{t.title}</Text>
                          <Text style={styles.templateDesc}>{t.message}</Text>
                        </View>
                        <View style={[styles.templateBadge,{ backgroundColor: badgeStyle.bg, marginLeft:'auto', alignSelf:'flex-start' }]}> 
                          <Text style={[styles.templateBadgeText,{ color: badgeStyle.fg }]}>{t.severity.toLowerCase()}</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Compose Alert */}
                <Text style={[styles.panelTitle,{ marginTop: 14 }]}>Compose Alert</Text>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Alert Title</Text>
                  <TextInput value={bcTitle} onChangeText={setBcTitle} placeholder="e.g., Flash Flood Alert" placeholderTextColor="#9ca3af" style={styles.input} />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Alert Message</Text>
                  <TextInput value={bcDesc} onChangeText={setBcDesc} placeholder="Concise details and instructions" placeholderTextColor="#9ca3af" multiline style={styles.textArea} />
                  <Text style={styles.charCount}>Character count: {bcDesc.length}/160 (SMS limit)</Text>
                </View>
                {/* Severity dropdown */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Severity Level</Text>
                  <View style={styles.rangeDropdownWrap}>
                    <Pressable style={styles.rangeDropdown} onPress={()=>setShowSeverityMenu(!showSeverityMenu)}>
                      <Text style={styles.rangeDropdownText}>{bcSeverity? `${bcSeverity} (${bcSeverity==='Severe'?'Red': bcSeverity==='Moderate'?'Yellow':'Blue'})` : 'Choose severity'}</Text>
                      <Text style={styles.dropdownArrow}>▼</Text>
                    </Pressable>
                    {showSeverityMenu && (
                      <View style={styles.rangeMenu}>
                        {(['Severe','Moderate','Informational'] as const).map(opt => (
                          <Pressable key={opt} style={styles.rangeMenuItem} onPress={()=>{ setBcSeverity(opt); setShowSeverityMenu(false); }}>
                            <Text style={styles.rangeMenuItemText}>{opt} ({opt==='Severe'?'Red': opt==='Moderate'?'Yellow':'Blue'})</Text>
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
                {/* Primary Language dropdown */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Primary Language</Text>
                  <View style={styles.rangeDropdownWrap}>
                    <Pressable style={styles.rangeDropdown} onPress={()=>setShowBcLanguageMenu(!showBcLanguageMenu)}>
                      <Text style={styles.rangeDropdownText}>{bcLanguage || 'Choose language'}</Text>
                      <Text style={styles.dropdownArrow}>▼</Text>
                    </Pressable>
                    {showBcLanguageMenu && (
                      <View style={styles.rangeMenu}>
                        {(['English','Hindi','Gujarati','Marathi','Bengali','Tamil','Telugu','Kannada','Punjabi','Urdu'] as const).map(l => (
                          <Pressable key={l} style={styles.rangeMenuItem} onPress={()=>{ setBcLanguage(l); setShowBcLanguageMenu(false); }}>
                            <Text style={styles.rangeMenuItemText}>{l}</Text>
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
                {/* Target Region dropdown */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Target Region</Text>
                  <View style={styles.rangeDropdownWrap}>
                    <Pressable style={styles.rangeDropdown} onPress={()=>setShowRegionMenu(!showRegionMenu)}>
                      <Text style={styles.rangeDropdownText}>{selectedRegion? selectedRegion.label : 'Select Region'}</Text>
                      <Text style={styles.dropdownArrow}>▼</Text>
                    </Pressable>
                    {showRegionMenu && (
                      <View style={styles.rangeMenu}>
                        {REGION_OPTIONS.map(r => (
                          <Pressable key={r.key} style={styles.rangeMenuItem} onPress={()=>{ setBcRegionKey(r.key); setShowRegionMenu(false); }}>
                            <Text style={styles.rangeMenuItemText}>{r.label}</Text>
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </View>
                </View>

                {/* Delivery Channels (checkboxes) */}
                <View style={[styles.formGroup,{ marginTop: 6 }]}> 
                  <Text style={styles.formLabel}>Delivery Channels</Text>
                  {[ 
                    'SMS/Text Messages',
                    'Mobile Push Notifications',
                    'Voice Calls (IVRS)',
                    'Social Media',
                    'Emergency Radio',
                    'Emergency Broadcast TV'
                  ].map(name => (
                    <Pressable key={name} style={styles.checkboxRow} onPress={()=>toggleChannel(name)}>
                      <View style={[styles.checkboxBox, bcChannels.has(name) && styles.checkboxChecked]}>
                        {bcChannels.has(name) && <Ionicons name="checkmark" size={12} color="#ffffff" />}
                      </View>
                      <Text style={styles.checkboxLabel}>{name}</Text>
                    </Pressable>
                  ))}
                  {bcChannels.size === 0 && (
                    <Text style={{ color:'#b91c1c', fontSize:12, marginTop:4 }}>Select at least one channel to continue.</Text>
                  )}
                </View>

                {/* Preview toggle and send */}
                <View style={{ flexDirection:'row', gap: 10, marginTop: 14 }}>
                  <Pressable style={styles.secondaryBtn} onPress={()=>setShowBcPreview(p=>!p)}>
                    <Ionicons name={showBcPreview? 'eye-off-outline':'eye-outline'} size={16} color="#111827" />
                    <Text style={styles.secondaryBtnText}>{showBcPreview? 'Hide Preview':'Preview'}</Text>
                  </Pressable>
                  <View style={{ flex:1 }} />
                  {(() => {
                    const isBroadcastValid = (
                      bcTitle.trim().length > 0 &&
                      bcDesc.trim().length > 0 &&
                      bcSeverity !== '' &&
                      bcLanguage &&
                      bcRegionKey !== '' &&
                      bcChannels.size > 0
                    );
                    const disabled = bcSending || !isBroadcastValid;
                    return (
                  <Pressable 
                    disabled={disabled}
                    style={[styles.primaryBtn, disabled && styles.primaryBtnDisabled]}
                    onPress={async ()=>{
                      if (!isSocketConnected) {
                        Alert.alert('Not Connected', 'Server connection unavailable. Please check your network.');
                        return;
                      }
                      
                      setBcSending(true);
                      try {
                        const alert = {
                          title: bcTitle,
                          description: bcDesc,
                          severity: bcSeverity.toLowerCase() as 'low' | 'moderate' | 'high' | 'severe',
                          type: bcType.toLowerCase() as 'flood' | 'earthquake' | 'cyclone' | 'fire' | 'landslide' | 'tsunami' | 'drought' | 'other',
                          language: bcLanguage,
                          isActive: true,
                          issuedAt: new Date(),
                          location: { latitude: 19.0760, longitude: 72.8777 },
                          radius: selectedRegion?.people ? Math.sqrt(selectedRegion.people / 1000) : 10,
                        };
                        
                        const response = await SocketService.broadcastDisasterAlert(alert);
                        setBcSending(false);
                        
                        Alert.alert(
                          '✅ Alert Broadcast Successfully', 
                          `Alert sent to ${response.recipientCount} connected device(s)\n\nRegion: ${selectedRegion?.label || 'N/A'}`
                        );
                        
                        // Reset form
                        setBcTitle('');
                        setBcDesc('');
                        setBcSeverity('');
                        setBcType('');
                        setBcLanguage('');
                        setBcRegionKey('');
                        setBcChannels(new Set());
                      } catch (error: any) {
                        setBcSending(false);
                        Alert.alert('Broadcast Failed', error.message || 'Failed to send alert. Please try again.');
                      }
                    }}
                  >
                    <Ionicons name="paper-plane-outline" size={16} color="#ffffff" />
                    <Text style={styles.primaryBtnText}>{bcSending? 'Sending…' : 'Send Alert'}</Text>
                  </Pressable>
                    );
                  })()}
                </View>

                {/* Conditional Preview block above Delivery Estimate */}
                {showBcPreview && (
                  <View style={[styles.alertPreviewCard,{ backgroundColor: bcSeverity==='Severe'?'#f59e0b': bcSeverity==='Moderate'?'#fde68a':'#bfdbfe' }]}>
                    <Text style={styles.previewKicker}>EMERGENCY ALERT</Text>
                    <Text style={styles.previewTitle}>{bcTitle || '—'}</Text>
                    <Text style={styles.previewDesc}>{bcDesc || '—'}</Text>
                  </View>
                )}

                {/* Delivery Estimate */}
                <View style={[styles.panelCard,{ marginTop: 12 }]}> 
                  <Text style={styles.panelTitle}>Delivery Estimate</Text>
                  <View style={{ gap:10, marginTop:6 }}>
                    <View style={styles.deliveryRow}><Ionicons name="people-outline" size={18} color="#111827" /><Text style={styles.deliveryText}>{selectedRegion? selectedRegion.people.toLocaleString() : '—'}<Text style={{ color:'#6b7280' }}> Estimated recipients</Text></Text></View>
                    <View style={styles.deliveryRow}><Ionicons name="location-outline" size={18} color="#111827" /><Text style={styles.deliveryText}>{selectedRegion? selectedRegion.label.split(' (')[0] : '—'}<Text style={{ color:'#6b7280' }}> Target area</Text></Text></View>
                    <View style={styles.deliveryRow}><Ionicons name="time-outline" size={18} color="#111827" /><Text style={styles.deliveryText}>~2–5 minutes<Text style={{ color:'#6b7280' }}> Delivery time</Text></Text></View>
                    <View style={styles.deliveryRow}><Ionicons name="albums-outline" size={18} color="#111827" /><Text style={styles.deliveryText}>{bcChannels.size || 0}<Text style={{ color:'#6b7280' }}> channels</Text></Text></View>
                  </View>
                </View>

                {/* Recent Alerts */}
                <View style={[styles.panelCard,{ marginTop: 12 }]}> 
                  <Text style={styles.panelTitle}>Recent Alerts</Text>
                  {[
                    { title:'Flash Flood Warning', time:'2 hours ago', tag:'severe', color:'#ef4444', bg:'#fee2e2' },
                    { title:'Road Closure Notice', time:'4 hours ago', tag:'moderate', color:'#92400e', bg:'#fef3c7' },
                    { title:'Weather Update', time:'6 hours ago', tag:'info', color:'#1d4ed8', bg:'#dbeafe' },
                  ].map((it,i)=> (
                    <View key={i} style={styles.recentRow}>
                      <View style={{ flex:1 }}>
                        <Text style={styles.recentTitle}>{it.title}</Text>
                        <Text style={styles.recentTime}>{it.time}</Text>
                      </View>
                      <View style={[styles.recentBadge,{ backgroundColor: it.bg }]}>
                        <Text style={[styles.recentBadgeText,{ color: it.color }]}>{it.tag}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {currentOfficialTab === 'resources' && (
              <View style={{ padding: 12, marginBottom: 24 }}>
                {/* Header + Add Resource button */}
                <View style={styles.rmHeaderRow}>
                  <View>
                    <Text style={styles.analyticsTitle}>Resource Management</Text>
                    <Text style={styles.analyticsSubtitle}>Coordinate teams, shelters, and emergency supplies</Text>
                  </View>
                  <Pressable style={styles.addResourceBtn} onPress={()=>Alert.alert('Add Resource', 'Coming soon...')}>
                    <Ionicons name="add-circle-outline" size={18} color="#ffffff" />
                    <Text style={styles.addResourceText}>Add Resource</Text>
                  </Pressable>
                </View>

                {/* Stat cards */}
                <View style={styles.rmStatsGrid}>
                  <View style={styles.rmStatCard}>
                    <Text style={styles.rmStatLabel}>Active Teams</Text>
                    <View style={styles.rmStatRow}>
                      <Text style={styles.rmStatValue}>{activeTeams}</Text>
                      <Ionicons name="people-outline" size={20} color="#3b82f6" />
                    </View>
                  </View>
                  <View style={styles.rmStatCard}>
                    <Text style={styles.rmStatLabel}>People Sheltered</Text>
                    <View style={styles.rmStatRow}>
                      <Text style={styles.rmStatValue}>{peopleSheltered}</Text>
                      <Ionicons name="bed-outline" size={20} color="#10b981" />
                    </View>
                  </View>
                  <View style={styles.rmStatCard}>
                    <Text style={styles.rmStatLabel}>Supply Categories</Text>
                    <View style={styles.rmStatRow}>
                      <Text style={styles.rmStatValue}>{supplyCategories}</Text>
                      <Ionicons name="trail-sign-outline" size={20} color="#f59e0b" />
                    </View>
                  </View>
                  <View style={styles.rmStatCard}>
                    <Text style={styles.rmStatLabel}>Response Personnel</Text>
                    <View style={styles.rmStatRow}>
                      <Text style={styles.rmStatValue}>{responsePersonnel}</Text>
                      <Ionicons name="shield-checkmark-outline" size={20} color="#8b5cf6" />
                    </View>
                  </View>
                </View>

                {/* Segmented tabs */}
                <View style={styles.rmTabs}>
                  {[
                    { key:'teams', label:'Response Teams' },
                    { key:'shelters', label:'Shelters' },
                    { key:'supplies', label:'Supplies' },
                  ].map(t => (
                    <Pressable key={t.key} style={[styles.rmTab, resourcesTab===t.key && styles.rmTabActive]} onPress={()=>setResourcesTab(t.key as any)}>
                      <Text style={[styles.rmTabText, resourcesTab===t.key && styles.rmTabTextActive]}>{t.label}</Text>
                    </Pressable>
                  ))}
                </View>

                {/* Teams list */}
                {resourcesTab==='teams' && (
                  <View style={{ gap:10 }}>
                    {teams.map(team => (
                      <View key={team.id} style={styles.rmCard}>
                        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start' }}>
                          <View style={{ flex:1 }}>
                            <Text style={styles.rmCardTitle}>{team.name}</Text>
                            <Text style={styles.rmCardSubtitle}>{team.role}</Text>
                          </View>
                          <View style={[styles.rmStatusPill, team.status==='deployed'? styles.statusRed : styles.statusGreen]}>
                            <Text style={styles.rmStatusText}>{team.status}</Text>
                          </View>
                        </View>
                        <View style={styles.rmMetaRow}><Ionicons name="pin-outline" size={16} color="#6b7280" /><Text style={styles.rmMetaText}>{team.location}</Text></View>
                        <View style={styles.rmMetaRow}><Ionicons name="people-outline" size={16} color="#6b7280" /><Text style={styles.rmMetaText}>{team.members} members</Text></View>
                        <View style={styles.rmMetaRow}><Ionicons name="time-outline" size={16} color="#6b7280" /><Text style={styles.rmMetaText}>Last update: {team.lastUpdate}</Text></View>
                        <Text style={styles.rmSectionLabel}>Equipment:</Text>
                        <View style={styles.chipRow}>
                          {team.equipment.map((e,i)=>(<View key={i} style={styles.rmTag}><Text style={styles.rmTagText}>{e}</Text></View>))}
                        </View>
                        <View style={[styles.rmActionRow, styles.rmActionRowSpaceBetween]}>
                          <Pressable style={[styles.rmGhostBtn, styles.rmButtonCommon]}><Ionicons name="chatbox-ellipses-outline" size={16} color="#111827" /><Text style={styles.rmGhostBtnText}>Contact</Text></Pressable>
                          <Pressable style={[styles.primaryBtn, styles.rmButtonCommon]}><Ionicons name="rocket-outline" size={16} color="#ffffff" /><Text style={styles.primaryBtnText}>Deploy</Text></Pressable>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Shelters list */}
                {resourcesTab==='shelters' && (
                  <View style={{ gap:10 }}>
                    {shelters.map(shelter => {
                      const pct = Math.round((shelter.occupancy / shelter.capacity) * 100);
                      return (
                        <View key={shelter.id} style={styles.rmCard}>
                          <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start' }}>
                            <View style={{ flex:1 }}>
                              <Text style={styles.rmCardTitle}>{shelter.name}</Text>
                              <Text style={styles.rmCardSubtitle}>{shelter.type}</Text>
                            </View>
                            <View style={[styles.rmStatusPill, styles.statusGreen]}>
                              <Text style={styles.rmStatusText}>operational</Text>
                            </View>
                          </View>
                          <Text style={styles.rmSectionLabel}>Occupancy</Text>
                          <Text style={styles.rmMetaTextBold}>{shelter.occupancy}/{shelter.capacity}  ({pct}%)</Text>
                          <View style={styles.rmProgressTrack}><View style={[styles.rmProgressFill,{ width: `${pct}%` }]} /></View>
                          <View style={styles.rmMetaRow}><Ionicons name="location-outline" size={16} color="#6b7280" /><Text style={styles.rmMetaText}>{shelter.location}</Text></View>
                          <View style={styles.rmMetaRow}><Ionicons name="call-outline" size={16} color="#6b7280" /><Text style={styles.rmMetaText}>{shelter.contact}</Text></View>
                          <Text style={styles.rmSectionLabel}>Facilities:</Text>
                          <View style={styles.chipRow}>
                            {shelter.facilities.map((f,i)=>(<View key={i} style={styles.rmTag}><Text style={styles.rmTagText}>{f}</Text></View>))}
                          </View>
                          <View style={styles.rmActionRow}>
                            <Pressable style={[styles.rmGhostBtn, styles.rmButtonCommon]}><Ionicons name="call-outline" size={16} color="#111827" /><Text style={styles.rmGhostBtnText}>Call</Text></Pressable>
                            <Pressable style={[styles.rmGhostBtn, styles.rmButtonCommon]}><Ionicons name="navigate-outline" size={16} color="#111827" /><Text style={styles.rmGhostBtnText}>Directions</Text></Pressable>
                            <Pressable style={[styles.secondaryBtn, styles.rmButtonCommon]}><Text style={styles.secondaryBtnText}>Manage</Text></Pressable>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Supplies list */}
                {resourcesTab==='supplies' && (
                  <View style={{ gap:10 }}>
                    {supplies.map(item => (
                      <View key={item.id} style={styles.rmCard}>
                        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start' }}>
                          <View style={{ flex:1 }}>
                            <Text style={styles.rmCardTitle}>{item.name}</Text>
                            <Text style={styles.rmCardSubtitle}>{item.category}</Text>
                          </View>
                          <View style={[styles.rmStatusPill, item.status==='available'? styles.statusGreen : styles.statusBlue]}>
                            <Text style={styles.rmStatusText}>{item.status}</Text>
                          </View>
                        </View>
                        <View style={{ flexDirection:'row', gap:20, marginTop:6 }}>
                          <View style={{ flex:1 }}>
                            <Text style={styles.rmSectionLabel}>Quantity</Text>
                            <Text style={styles.rmMetaTextBold}>{item.quantityLabel}</Text>
                          </View>
                          <View style={{ flex:1 }}>
                            <Text style={styles.rmSectionLabel}>Location</Text>
                            <Text style={styles.rmMetaTextBold}>{item.location}</Text>
                          </View>
                        </View>
                        {item.expiry && (
                          <View style={{ marginTop:6 }}>
                            <Text style={styles.rmSectionLabel}>Expiry Date</Text>
                            <Text style={styles.rmMetaTextBold}>{item.expiry}</Text>
                          </View>
                        )}
                        <View style={styles.rmActionRow}>
                          <Pressable style={[styles.rmGhostBtn, styles.rmButtonCommon]}><Ionicons name="swap-vertical-outline" size={16} color="#111827" /><Text style={styles.rmGhostBtnText}>Allocate</Text></Pressable>
                          <Pressable style={[styles.secondaryBtn, styles.rmButtonCommon]}><Ionicons name="trending-up-outline" size={16} color="#111827" /><Text style={styles.secondaryBtnText}>Track</Text></Pressable>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <LoadingScreen />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  // Base Container
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  // Landing Page Styles - EXACT Implementation Guide Match
  landingScrollView: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  landingHeader: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  govBadgeRow: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 999,
    marginBottom: 12,
  },
  govBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 0,
  },
  mainTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brandBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  brandBadgeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3730a3',
  },
  tricolorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  colorStripe: {
    width: 28,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 2,
  },
  mainSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  issuedBy: {
    marginTop: 8,
    fontSize: 12,
    color: '#334155',
    textAlign: 'center',
  },
  landingCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.99 }],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  cardDescription: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
    marginBottom: 20,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    gap: 8,
  },
  featureBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  verifyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  verifyBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  badgeText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  launchButton: {
    backgroundColor: '#1e40af',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  launchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  landingFooter: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Old Landing Page Styles (keeping for compatibility)
  landingGradient: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  landingContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  oldLandingHeader: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  landingTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 1,
  },
  landingSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  appOptions: {
    gap: 24,
  },
  appOptionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
    borderLeftWidth: 6,
  },
  appOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  appOptionIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appOptionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  appOptionDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 22,
    marginBottom: 20,
  },
  oldLaunchButton: {
    backgroundColor: '#1e293b',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  oldLaunchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // Citizen App Styles
  citizenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 16,
  },
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appBrand: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  languageToggle: {
    fontSize: 14,
    color: '#64748b',
  },
  languageMenu: {
    position: 'absolute',
    top: 28,
    right: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingVertical: 6,
    width: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
  },
  languageMenuItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  languageMenuText: {
    fontSize: 13,
    color: '#334155',
  },
  languageMenuTextActive: {
    color: '#2563eb',
    fontWeight: '700',
  },
  connectionStatus: {
    fontSize: 14,
    color: '#10b981',
  },
  offlineStatus: {
    color: '#dc2626',
  },

  // Tab Navigation
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  activeTabButton: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  tabLabel: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
    fontWeight: '500',
  },

  // Content Area
  contentArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  // Alerts Styles
  alertsContainer: {
    paddingBottom: 100,
  },
  alertCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  severeAlert: {
    borderLeftColor: '#ef4444',
  },
  moderateAlert: {
    borderLeftColor: '#f59e0b',
  },
  safeAlert: {
    borderLeftColor: '#10b981',
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  alertSeverity: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  alertTime: {
    fontSize: 12,
    color: '#64748b',
  },
  alertMessage: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  alertMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  alertLocation: {
    fontSize: 12,
    color: '#64748b',
  },
  alertImpact: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '600',
  },
  alertActions: {
    flexDirection: 'row',
    gap: 8,
  },
  alertActionButton: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  alertActionText: {
    fontSize: 12,
    color: '#1e293b',
    fontWeight: '500',
  },

  // Report Styles
  reportContainer: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 80,
  },
  reportForm: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  selectButton: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    color: '#64748b',
    flex: 1,
  },
  textAreaContainer: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    minHeight: 90,
    marginBottom: 12,
  },
  textAreaPlaceholder: {
    color: '#9ca3af',
  },
  textAreaInput: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
    paddingBottom: 24,
    minHeight: 90,
  },
  locationRow: {
    marginBottom: 16,
  },
  mediaButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  mediaButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  mediaButtonText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#111827',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  pendingReports: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
  },
  pendingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
  },
  pendingItem: {
    paddingVertical: 8,
  },
  pendingText: {
    fontSize: 14,
    color: '#374151',
  },

  // Facilities Styles
  facilitiesContainer: {
    paddingBottom: 12,
  },
  mapContainer: {
    backgroundColor: 'transparent',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    borderRadius: 0,
    padding: 0,
    alignItems: 'stretch',
    minHeight: 0,
  },
  mapPlaceholder: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 20,
  },
  mapIcons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 16,
  },
  mapIcon: {
    textAlign: 'center',
    fontSize: 12,
    color: '#64748b',
  },
  nearbyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  facilityList: {
    marginHorizontal: 20,
  },
  facilityItem: {
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  facilityText: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
  },
  facilityActions: {
    flexDirection: 'row',
    gap: 8,
  },
  facilityButton: {
    backgroundColor: '#f1f5f9',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Photos Styles
  photosContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  cameraPreview: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    minHeight: 200,
  },
  cameraText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 8,
  },

  recentPhotosTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoThumbnail: {
    width: (width - 56) / 6,
    height: (width - 56) / 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // SOS Button
  sosButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  sosButtonActive: {
    backgroundColor: '#dc2626',
    transform: [{ scale: 1.1 }],
  },
  sosButtonText: {
    fontSize: 20,
  },
  sosButtonLabel: {
    fontSize: 10,
    color: 'white',
    fontWeight: '700',
  },

  // Login Screen Styles
  loginGradient: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergencyHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  emergencyBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: 'white',
    textAlign: 'center',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  appSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  loginCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 32,
    width: width * 0.9,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 12,
    // backdropFilter: 'blur(10px)',
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  loginDescription: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  primaryLoginButton: {
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 10,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  secondaryLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    marginBottom: 24,
    gap: 8,
  },
  secondaryLoginText: {
    color: '#1e40af',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  featuresPreview: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  featureItem: {
    alignItems: 'center',
    gap: 4,
  },
  featureText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },

  // Role Selection Styles
  roleContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 26,
  },
  roleButton: {
    backgroundColor: 'white',
    padding: 32,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roleIcon: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: 16,
  },
  roleTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1e293b',
    marginBottom: 12,
  },
  roleDescription: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },

  // Dashboard Styles
  dashboardGradient: {
    flex: 1,
  },
  dashboardHeader: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  emailText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoutText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  // Plain header for officials
  plainHeader: {
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  plainHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 },
  iconCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  titleLines: { marginLeft: 2, flexShrink: 1, minWidth: 0 },
  titleLine: { color: '#111827', fontWeight: '700', fontSize: 15, lineHeight: 17 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1, minWidth: 0 },
  titleText: { color: '#111827', fontWeight: '800', fontSize: 16, flexShrink: 1 },
  plainHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  logoutOutlineBtn: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: 'white',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  logoutOutlineText: { color: '#111827', fontWeight: '700', fontSize: 12 },
  roleBadge: {
    backgroundColor: 'white',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexShrink: 1,
    maxWidth: 200,
  },
  roleBadgeText: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 12,
  },

  // Features Grid
  featuresContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
    backgroundColor: '#f8fafc',
  },
  officialNavbar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
    gap: 4,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  officialNavItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
  },
  officialNavItemActive: {
    backgroundColor: '#f3f4f6',
  },
  officialNavIndicator: { position: 'absolute', bottom: 4, width: 20, height: 3, borderRadius: 2, backgroundColor: '#111827' },
  officialNavText: {
    color: '#6b7280',
    fontWeight: '700',
    fontSize: 12,
  },
  officialNavTextActive: {
    color: '#111827',
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 20,
  },
  analyticsTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0b1320',
    marginBottom: 6,
  },
  analyticsToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  analyticsSubtitle: {
    color: '#6b7280',
  },
  rangeDropdownWrap: { position: 'relative' },
  rangeDropdown: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rangeDropdownText: { color: '#111827', fontWeight: '700' },
  rangeMenu: {
    position: 'absolute',
    top: 44,
    right: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    width: 140,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  rangeMenuItem: { paddingVertical: 10, paddingHorizontal: 10 },
  rangeMenuItemText: { color: '#374151', fontSize: 12 },
  toolbarBtn: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toolbarBtnText: { color: '#111827', fontWeight: '700', fontSize: 12 },
  toolbarIconBtn: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 8,
    borderRadius: 8,
  },
  statGrid: { gap: 12 },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statTitle: { color: '#6b7280' },
  statValue: { fontSize: 28, fontWeight: '800', color: '#0b1320' },
  statDelta: { marginTop: 6, fontSize: 12 },
  statIconWrap: { backgroundColor: '#f3f4f6', padding: 10, borderRadius: 10 },
  chartCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 12,
  },
  chartTitle: { fontWeight: '700', color: '#0b1320', marginBottom: 8 },
  lineChartMock: { height: 160, backgroundColor: '#f8fafc', borderRadius: 8, position: 'relative', overflow: 'hidden' },
  chartGridLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: '#e5e7eb' },
  chartLine: { position: 'absolute', left: 10, borderRadius: 2 },
  chartDot: { position: 'absolute', width: 8, height: 8, borderRadius: 4, borderWidth: 2, borderColor: 'white' },
  axisLine: { position: 'absolute', backgroundColor: '#9ca3af', height: 1, width: 1 },
  yLabel: { position: 'absolute', left: 6, fontSize: 10, color: '#374151' },
  vGridLine: { position: 'absolute', width: 1, backgroundColor: '#e5e7eb' },
  xLabel: { position: 'absolute', bottom: 6, fontSize: 10, color: '#374151' },
  pieChartMock: { height: 180, alignItems: 'center', justifyContent: 'center' },
  pieCircle: { width: 140, height: 140, borderRadius: 70, backgroundColor: '#3b82f6' },
  stackedBarTrack: { height: 18, backgroundColor: '#f3f4f6', borderRadius: 999, flexDirection: 'row', overflow: 'hidden' },
  stackedBarSeg: { height: '100%' },
  legendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  legendItemRow: { flexDirection: 'row', alignItems: 'center' },
  legendSwatch: { width: 10, height: 10, borderRadius: 2, marginRight: 6 },
  panelCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 12,
  },
  panelTitle: { fontWeight: '700', color: '#0b1320', marginBottom: 8 },
  socialRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  socialName: { color: '#0b1320', fontWeight: '700' },
  socialSub: { color: '#6b7280', fontSize: 12 },
  socialValue: { fontSize: 24, fontWeight: '800', color: '#0b1320', marginHorizontal: 10 },
  socialSent: { color: '#6b7280', fontSize: 12 },
  urgentPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  urgentText: { color: '#991b1b', fontWeight: '800', fontSize: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  riskRow: { marginBottom: 10 },
  riskHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  riskName: { color: '#0b1320', fontWeight: '700' },
  riskPct: { color: '#111827', fontWeight: '800' },
  riskTrack: { height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, overflow: 'hidden', marginTop: 6 },
  riskFill: { height: '100%' },
  riskWindow: { color: '#6b7280', fontSize: 12, marginTop: 4 },
  shelterRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  shelterName: { color: '#0b1320', fontWeight: '700' },
  shelterSub: { color: '#6b7280', fontSize: 12 },
  shelterPct: { color: '#111827', fontWeight: '800', fontSize: 12 },
  teamRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  teamName: { color: '#0b1320', fontWeight: '700' },
  teamSub: { color: '#6b7280', fontSize: 12 },
  teamStatusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginRight: 10 },
  teamStatusText: { fontWeight: '800', fontSize: 12 },
  teamMembers: { color: '#6b7280', fontSize: 12 },

  // Verification tab styles
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    padding: 4,
    gap: 6,
    marginTop: 6,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentItemActive: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  segmentText: { color: '#6b7280', fontWeight: '700', fontSize: 12 },
  segmentTextActive: { color: '#0b1320' },
  verifyCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 10,
  },
  verifyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  verifyTitle: { color: '#0b1320', fontWeight: '800', fontSize: 16, marginLeft: 8 },
  typeIconWrap: { padding: 8, borderRadius: 8 },
  scoreBadge: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  scoreText: { fontWeight: '800', fontSize: 12 },
  verifyMeta: { color: '#6b7280' },
  verifyReporter: { color: '#6b7280', marginTop: 2, fontSize: 12 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#2563eb', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12 },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: 'white', fontWeight: '800', fontSize: 12 },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'white', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12 },
  secondaryBtnText: { color: '#111827', fontWeight: '800', fontSize: 12 },
  dangerBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fef2f2', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12 },
  dangerBtnText: { color: '#991b1b', fontWeight: '800', fontSize: 12 },
  // New verification styles
  verifyCardTitle: { color:'#0b1320', fontSize:16, fontWeight:'800' },
  verifyBadgeRow: { flexDirection:'row', gap:6, marginTop:4, flexWrap:'wrap' },
  badgePill: { paddingHorizontal:8, paddingVertical:2, borderRadius:999 },
  badgePillText: { fontSize:12, fontWeight:'700' },
  verifyActionCol: { gap:6, alignItems:'flex-end' },
  verifyDesc: { color:'#374151', marginTop:8 },
  verifyMetaStrong: { color:'#111827', fontWeight:'700' },
  verifyChipsRow: { flexDirection:'row', flexWrap:'wrap', gap:6, marginTop:8 },
  verifyChip: { backgroundColor:'#f3f4f6', paddingHorizontal:8, paddingVertical:4, borderRadius:999 },
  verifyChipText: { color:'#111827', fontSize:12, fontWeight:'700' },
  aiRow: { flexDirection:'row', alignItems:'center', gap:6, marginTop:10 },
  aiLabel: { color:'#374151' },
  aiBarTrack: { height:6, borderRadius:999, backgroundColor:'#e5e7eb', marginTop:6, overflow:'hidden' },
  aiBarFill: { height:6, borderRadius:999 },
  verifySearchRow: { flexDirection:'row', alignItems:'center', gap:10, marginTop:10 },
  verifySearchBox: { flex:1, flexDirection:'row', alignItems:'center', gap:8, backgroundColor:'#f3f4f6', borderRadius:10, paddingHorizontal:10, height:36, borderWidth:1, borderColor:'#e5e7eb' },
  verifySearchInput: { flex:1, color:'#111827' },
  verifyFilterBtn: { flexDirection:'row', alignItems:'center', gap:6, backgroundColor:'white', borderRadius:8, paddingHorizontal:12, height:36, borderWidth:1, borderColor:'#e5e7eb' },
  verifyFilterText: { color:'#111827', fontWeight:'800', fontSize:12 },
  verifyStatCard: { backgroundColor:'white', borderRadius:12, padding:12, borderWidth:1, borderColor:'#e5e7eb' },
  verifyStatTitle: { color:'#6b7280', fontSize:12, fontWeight:'700' },
  verifyStatValue: { color:'#0b1320', fontSize:24, fontWeight:'900', marginTop:4 },
  rejectBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff1f2', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12 },
  rejectBtnText: { color: '#ef4444', fontWeight: '800', fontSize: 12 },

  // Broadcast tab styles
  formGroup: { marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: 'white',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: '#111827',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: 'white',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    color: '#111827',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, backgroundColor: '#f3f4f6' },
  chipActive: { backgroundColor: '#dbeafe' },
  chipText: { color: '#6b7280', fontWeight: '700', fontSize: 12 },
  chipTextActive: { color: '#1d4ed8' },
  templateCard: { flexDirection:'row', alignItems:'center', gap:12, backgroundColor:'white', borderRadius:12, borderWidth:1, borderColor:'#e5e7eb', padding:12, marginTop:10 },
  templateBadge: { paddingHorizontal:8, paddingVertical:4, borderRadius:8, marginTop:2 },
  templateBadgeText: { fontWeight:'800', fontSize:12, textTransform:'lowercase' },
  templateTitle: { color:'#0b1320', fontWeight:'800' },
  templateDesc: { color:'#6b7280', marginTop:4 },
  checkboxRow: { flexDirection:'row', alignItems:'center', gap:10, paddingVertical:8 },
  checkboxBox: { width:18, height:18, borderRadius:4, borderWidth:1, borderColor:'#9ca3af', alignItems:'center', justifyContent:'center', backgroundColor:'white' },
  checkboxChecked: { backgroundColor:'#111827', borderColor:'#111827' },
  checkboxLabel: { color:'#111827' },
  alertPreviewCard: { borderRadius:12, padding:14, marginTop:12 },
  previewKicker: { color:'#111827', fontWeight:'800', fontSize:12 },
  previewTitle: { color:'#111827', fontWeight:'900', marginTop:4 },
  previewDesc: { color:'#111827', marginTop:4 },
  deliveryRow: { flexDirection:'row', alignItems:'center', gap:10 },
  deliveryText: { color:'#111827' },
  recentRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', borderTopWidth:1, borderTopColor:'#f3f4f6', paddingVertical:10 },
  recentTitle: { color:'#0b1320', fontWeight:'800' },
  recentTime: { color:'#6b7280', fontSize:12 },
  recentBadge: { paddingHorizontal:8, paddingVertical:4, borderRadius:8 },
  recentBadgeText: { fontWeight:'800', fontSize:12, textTransform:'lowercase' },

  // Resources tab styles
  rmHeaderRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 },
  addResourceBtn: { flexDirection:'row', alignItems:'center', gap:6, backgroundColor:'#111827', paddingHorizontal:12, paddingVertical:8, borderRadius:10, marginLeft:'auto', flexShrink:0 },
  addResourceText: { color:'#ffffff', fontWeight:'800' },
  rmStatsGrid: { flexDirection:'row', flexWrap:'wrap', gap:10, marginTop:12 },
  rmStatCard: { flexBasis:'48%', backgroundColor:'white', borderWidth:1, borderColor:'#e5e7eb', borderRadius:12, padding:12 },
  rmStatLabel: { color:'#6b7280', fontSize:12 },
  rmStatRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop:4 },
  rmStatValue: { color:'#0b1320', fontWeight:'900', fontSize:20 },
  rmTabs: { flexDirection:'row', backgroundColor:'#f3f4f6', borderRadius:12, padding:4, marginTop:14 },
  rmTab: { flex:1, paddingVertical:8, alignItems:'center', borderRadius:8 },
  rmTabActive: { backgroundColor:'white', borderWidth:1, borderColor:'#e5e7eb' },
  rmTabText: { color:'#6b7280', fontWeight:'700' },
  rmTabTextActive: { color:'#0b1320' },
  rmCard: { backgroundColor:'white', borderWidth:1, borderColor:'#e5e7eb', borderRadius:12, padding:12 },
  rmCardTitle: { color:'#0b1320', fontWeight:'800' },
  rmCardSubtitle: { color:'#6b7280', marginTop:2 },
  rmStatusPill: { paddingHorizontal:10, paddingVertical:4, borderRadius:999 },
  statusRed: { backgroundColor:'#fee2e2' },
  statusGreen: { backgroundColor:'#dcfce7' },
  statusBlue: { backgroundColor:'#dbeafe' },
  rmStatusText: { fontWeight:'800', fontSize:12, color:'#111827', textTransform:'lowercase' },
  rmMetaRow: { flexDirection:'row', alignItems:'center', gap:8, marginTop:6 },
  rmMetaText: { color:'#6b7280' },
  rmMetaTextBold: { color:'#111827', fontWeight:'800' },
  rmSectionLabel: { color:'#6b7280', fontSize:12, marginTop:8 },
  rmTag: { backgroundColor:'#e5e7eb', paddingHorizontal:10, paddingVertical:6, borderRadius:999 },
  rmTagText: { color:'#111827', fontWeight:'700', fontSize:12 },
  rmActionRow: { flexDirection:'row', alignItems:'center', gap:10, marginTop:10, flexWrap:'wrap' },
  rmActionRowSpaceBetween: { justifyContent:'space-between' },
  rmButtonCommon: { flexShrink:1 },
  rmGhostBtn: { flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:12, paddingVertical:8, borderRadius:10, borderWidth:1, borderColor:'#e5e7eb', backgroundColor:'white' },
  rmGhostBtnText: { color:'#111827', fontWeight:'800' },
  rmProgressTrack: { height:6, borderRadius:999, backgroundColor:'#e5e7eb', marginTop:6 },
  rmProgressFill: { height:6, borderRadius:999, backgroundColor:'#111827' },
  resourceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  resourceName: { color: '#0b1320', fontWeight: '800' },
  resourceMeta: { color: '#6b7280', fontSize: 12 },
  featuresGrid: {
    gap: 16,
  },
  featureCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderLeftWidth: 4,
  },
  citizenCard: {
    borderLeftColor: '#10b981',
  },
  officialCard: {
    borderLeftColor: '#3b82f6',
  },
  emergencyCard: {
    borderLeftColor: '#ef4444',
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  citizenIcon: {
    backgroundColor: '#ecfdf5',
  },
  officialIcon: {
    backgroundColor: '#eff6ff',
  },
  emergencyIcon: {
    backgroundColor: '#fef2f2',
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  featureDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 12,
  },
  tapHint: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Alert Styles
  emergencyBanner: {
    backgroundColor: '#dc2626',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  emergencyText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  emergencySubtext: {
    color: '#fca5a5',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  alertsCounter: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  counterBadge: {
    alignItems: 'center',
    marginRight: 16,
  },
  counterNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#dc2626',
  },
  counterLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  counterInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  counterLastUpdate: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  counterCoverage: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  alertCardCritical: {
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  alertCardHigh: {
    borderLeftWidth: 4,
    borderLeftColor: '#f97316',
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  alertIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  alertTitleInfo: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  severityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  alertDescription: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginVertical: 12,
  },
  alertMetadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  alertMetaItem: {
    alignItems: 'center',
  },
  alertMetaLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  alertMetaValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 2,
  },
  alertInstructions: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    marginVertical: 12,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369a1',
    marginBottom: 8,
  },
  instructionItem: {
    fontSize: 14,
    color: '#0c4a6e',
    marginBottom: 4,
  },
  actionButtonPrimary: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  actionButtonPrimaryText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  actionButtonSecondary: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
  },
  actionButtonSecondaryText: {
    color: '#374151',
    textAlign: 'center',
    fontWeight: '600',
  },
  noAlertsContainer: {
    backgroundColor: 'white',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  noAlertsIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noAlertsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 8,
  },
  noAlertsMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: '600',
  },

  // Report Screen Styles
  offlineWarning: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  // Facilities header and toggle
  facilitiesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  facilitiesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  facilitiesToggle: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    padding: 4,
    borderRadius: 12,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'transparent',
    marginHorizontal: 2,
    gap: 6,
  },
  toggleButtonActive: {
    backgroundColor: 'white',
  },
  toggleText: {
    color: '#e5e7eb',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  toggleTextActive: {
    color: '#111827',
  },
  // Facilities list cards
  facilityCardList: {
    gap: 12,
  },
  facilityCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  facilityCardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  facilityIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  facilityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  facilityName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPillText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  facilityAddress: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  facilityMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#6b7280',
  },
  occupancyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  occupancyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  occupancyPct: {
    fontSize: 12,
    fontWeight: '700',
  },
  occupancyBarTrack: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 6,
  },
  occupancyBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  facilityActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  facilityActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  facilityActionHalf: {
    width: '48%',
    flex: undefined,
  },
  directionBtn: {
    backgroundColor: '#f9fafb',
  },
  callBtn: {
    backgroundColor: '#f9fafb',
  },
  facilityActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 6,
  },
  offlineWarningText: {
    color: '#92400e',
    fontSize: 14,
    fontWeight: '500',
  },
  dropdownArrow: {
    fontSize: 16,
    color: '#6b7280',
  },
  dropdownHint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    marginBottom: 16,
  },
  charCount: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  locationIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  locationDetails: {
    flex: 1,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  locationAddress: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  locationAccuracy: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
  },
  updateLocationButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  updateButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  mediaSection: {
    marginBottom: 20,
  },
  mediaButtonIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  photoPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  photoThumbnailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  photoThumb: {
    width: 42,
    height: 42,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: '#e5e7eb',
  },
  photoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  photoInfo: {
    flex: 1,
  },
  photoName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  photoSize: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  removePhotoButton: {
    backgroundColor: '#ef4444',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    marginRight: 6,
  },
  submitButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  reportCardPending: {
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  statusBadgePending: {
    backgroundColor: '#fbbf24',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusTextPending: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  reportProgress: {
    marginTop: 8,
  },
  reportStatus: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 4,
  },
  submitButtonOffline: {
    backgroundColor: '#111827',
  },
  reportCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  reportDescription: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 12,
    lineHeight: 20,
  },
  reportMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reportLocation: {
    fontSize: 12,
    color: '#6b7280',
    flex: 1,
  },
  reportTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  mediaIndicator: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  tabBottomSpacer: {
    height: 100,
  },

  // Photo Gallery Styles
  galleryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  takePhotoButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  takePhotoIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  takePhotoText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  galleryStats: {
    alignItems: 'flex-end',
  },
  galleryStatsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  galleryStatsSubtext: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  photoGridItem: {
    width: '48%',
    marginBottom: 16,
  },
  photoContainer: {
    aspectRatio: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholder: {
    fontSize: 40,
    color: '#9ca3af',
  },
  photoOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  photoType: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  photoTimestamp: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  cameraInstructions: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 20,
  },
  galleryInstructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0369a1',
    marginBottom: 12,
  },
  galleryInstructionsText: {
    fontSize: 14,
    color: '#0c4a6e',
    marginBottom: 6,
  },
  storageInfo: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  storageTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  storageBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  storageUsed: {
    height: '100%',
    width: '12%',
    backgroundColor: '#3b82f6',
  },
  storageText: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyGallery: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 12,
    marginTop: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  emptyActionButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyActionText: {
    color: 'white',
    fontWeight: '600',
  },
  // Contacts (Zones) styles
  contactsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  contactList: {
    gap: 10,
    marginTop: 8,
    paddingBottom: 120,
  },
  contactCard: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  contactSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  contactCallBtn: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  contactCallText: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 12,
  },
  contactCallBtnPrimary: {
    backgroundColor: '#0b1320',
    borderColor: '#0b1320',
  },
  contactCallTextPrimary: {
    color: 'white',
    fontWeight: '800',
    fontSize: 12,
  },
  
  // Dropdown styles
  selectButtonActive: {
    borderColor: '#3b82f6',
    borderWidth: 2,
  },
  dropdownArrowUp: {
    transform: [{ rotate: '180deg' }],
  },
  dropdownMenu: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 1000,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownItemSelected: {
    backgroundColor: '#eff6ff',
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 2,
  },
  dropdownItemTextSelected: {
    color: '#3b82f6',
  },
  dropdownItemDesc: {
    fontSize: 12,
    color: '#64748b',
  },
  
  // Camera Modal
  cameraModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    zIndex: 1000,
  },
  cameraContainer: {
    flex: 1,
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  cameraCloseButton: {
    padding: 8,
  },
  cameraCloseText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cameraTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  cameraFlashButton: {
    padding: 8,
  },
  cameraFlashText: {
    color: '#ffffff',
    fontSize: 18,
  },
  cameraViewfinder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    position: 'relative',
  },
  cameraStatus: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  cameraSubtext: {
    color: '#a1a1aa',
    fontSize: 14,
  },
  cameraGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  gridLineVertical: {
    width: 1,
    height: '100%',
    left: '33.33%',
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  cameraSwitchButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 24,
  },
  cameraSwitchText: {
    color: '#ffffff',
    fontSize: 20,
  },
  cameraCaptureButton: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#e5e7eb',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    backgroundColor: '#ffffff',
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#9ca3af',
  },
  cameraGalleryButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 24,
  },
  cameraGalleryText: {
    color: '#ffffff',
    fontSize: 20,
  },
  
  // File Options Modal
  fileOptionsModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  imageViewerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.95)',
    zIndex: 2500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageViewerImage: {
    width: '100%',
    height: '100%',
  },
  imageViewerClose: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  imageViewerCloseText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  fileOptionsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    margin: 20,
    minWidth: 280,
    maxWidth: 320,
  },
  fileOptionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  // Alert Details Modal Styles
  // duplicate removed
  // Alert Details Modal Styles
  detailsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  detailsCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  detailsSubtext: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  detailsDescription: {
    marginTop: 10,
    fontSize: 14,
    color: '#1f2937',
    lineHeight: 20,
  },
  detailsFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 8,
  },
  detailsActionHalf: {
    flexBasis: '48%',
    flexGrow: 1,
  },
  fileOptionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  fileOptionsClose: {
    padding: 4,
  },
  fileOptionsCloseText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: 'bold',
  },
  fileOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  fileOptionIcon: {
    fontSize: 24,
    marginRight: 16,
    width: 40,
    textAlign: 'center',
  },
  fileOptionTextContainer: {
    flex: 1,
  },
  fileOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 2,
  },
  fileOptionSubtext: {
    fontSize: 12,
    color: '#64748b',
  },
  // Official Access styles
  officialLoginCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
  },
  officialLoginTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  demoCredsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  demoCredsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  demoCredsText: {
    fontSize: 12,
    color: '#374151',
  },
  officialInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  officialInputIcon: {
    marginRight: 8,
  },
  officialInputField: {
    flex: 1,
    height: 44,
    color: '#111827',
  },
  officialPasswordToggle: {
    padding: 6,
  },
  buttonDisabled: {
    backgroundColor: '#6b7280',
  },
  // SOS Modals
  overlayModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  sosModalContainer: {
    backgroundColor: 'white',
    width: '86%',
    maxWidth: 420,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  sosModalIconWrap: {
    alignItems: 'center',
    marginBottom: 8,
  },
  sosModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 6,
  },
  sosModalDesc: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  sosInfoList: {
    gap: 8,
    marginBottom: 14,
  },
  sosInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  sosInfoText: {
    fontSize: 13,
    color: '#374151',
  },
  sosConfirmButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  sosConfirmButtonText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 14,
  },
  sosCancelButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  sosCancelButtonText: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 14,
  },
  sosProgressTrack: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 8,
  },
  sosProgressFill: {
    height: '100%',
    backgroundColor: '#111827',
  },
  // Zones UI styles
  hazardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 12,
  },
  livePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  livePillActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
  },
  livePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  livePillTextActive: {
    color: '#065f46',
  },
  hazardMapCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  hazardMapMock: {
    height: 120,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  hazardMapBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 10,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  zoneBox: {
    position: 'absolute',
    top: 20,
    left: 12,
    width: 50,
    height: 30,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoneHigh: { backgroundColor: '#fecaca' },
  zoneMedium: { backgroundColor: '#fde68a' },
  zoneSafe: { backgroundColor: '#bbf7d0' },
  zoneLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1f2937',
  },
  userDot: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1f2937',
    right: 12,
    bottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hazardLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
  },
  zoneTabs: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    padding: 0,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 14,
  },
  zoneTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#111827',
    marginHorizontal: 4,
  },
  zoneTabActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  zoneTabText: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '700',
  },
  zoneTabTextActive: { color: '#ffffff' },
  zoneTabContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  zoneStatusCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    padding: 14,
    borderRadius: 12,
    marginTop: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  zoneStatusTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  zoneStatusSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 18,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  hazardList: {
    marginHorizontal: 20,
    gap: 10,
  },
  hazardCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  hazardCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  hazardBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  hazardBadge: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    color: '#111827',
  },
  hazardBadgeHigh: { backgroundColor: '#fecaca' },
  hazardBadgeActive: { backgroundColor: '#fef3c7' },
  hazardAvoidBtn: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  hazardAvoidText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#991b1b',
  },
  hazardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  hazardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hazardMeta: {
    fontSize: 12,
    color: '#6b7280',
  },
  // Safe Zones Styles
  safeZonesList: {
    marginHorizontal: 20,
    gap: 10,
    marginBottom: 80,
  },
  safeZoneCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
  },
  safeZoneIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  safeZoneInfo: {
    flex: 1,
  },
  safeZoneName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  safeZoneType: {
    fontSize: 12,
    color: '#6b7280',
  },
  navigateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  navigateBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111827',
    marginLeft: 4,
  },
  // Legacy styles (keeping for backward compatibility)
  safeList: {
    marginHorizontal: 20,
    gap: 10,
    marginBottom: 80,
  },
  safeCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
  },
  safeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  safeType: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  navigateText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111827',
    marginLeft: 6,
  },
  
  // Map Instructions and Legend Styles
  mapInstructions: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  mapInstructionText: {
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
    fontWeight: '600',
  },
  mapLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  mapLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  mapLegendText: {
    fontSize: 10,
    color: '#374151',
    fontWeight: '600',
  },
  
  // Facility Detail Popup Styles
  facilityDetailPopup: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  facilityDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  facilityDetailTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  facilityDetailType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  facilityDetailAddress: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  facilityDetailPhone: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
  },
  facilityDetailActions: {
    flexDirection: 'row',
    gap: 8,
  },
  facilityDetailBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  facilityDetailBtnSecondary: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  facilityDetailBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});