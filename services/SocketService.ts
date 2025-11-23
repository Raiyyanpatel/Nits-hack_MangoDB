import { io, Socket } from 'socket.io-client';
import { DisasterAlert, SOSAlert, IncidentReport, User } from '../types';

export interface LocationData {
  userId: string;
  userName: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

/**
 * Socket.IO Service for real-time communication
 * Handles connections, alerts, SOS, and incident reports
 */
class SocketService {
  private socket: Socket | null = null;
  private serverUrl: string;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private user: User | null = null;
  private connectingPromise: Promise<boolean> | null = null;

  constructor() {
    // IMPORTANT: Change this to your server IP address
    // For local testing on same network: use your PC's IP (e.g., '192.168.1.100')
    // For Expo tunnel: use ngrok or similar tunneling service
    // For production: use your deployed server URL
    this.serverUrl = 'https://w14t36gv-3000.inc1.devtunnels.ms/'; // Change this to your PC's IP!
  }

  /**
   * Initialize and connect to Socket.IO server
   */
  connect(user: User): Promise<boolean> {
    // If already connecting, return existing promise
    if (this.connectingPromise) {
      console.log('⏳ Connection already in progress...');
      return this.connectingPromise;
    }

    // If already connected, just update user and resolve
    if (this.socket?.connected) {
      console.log('✅ Already connected to Socket.IO server');
      this.user = user;
      this.registerUser(user);
      return Promise.resolve(true);
    }

    this.connectingPromise = new Promise((resolve, reject) => {
      console.log('🔌 Connecting to Socket.IO server:', this.serverUrl);
      this.user = user;

      // Try polling first (more reliable on mobile networks), then websocket
      this.socket = io(this.serverUrl, {
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
        timeout: 30000, // Increased to 30 seconds
        forceNew: false,
        upgrade: true,
        autoConnect: true,
      });

      // Connection successful
      this.socket.on('connect', () => {
        console.log('✅ Connected to Socket.IO server');
        console.log('   Socket ID:', this.socket?.id);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.connectingPromise = null;

        // Register user with server
        this.registerUser(user);

        resolve(true);
      });

      // Connection error
      this.socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error.message);
        this.reconnectAttempts++;

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('🚫 Max reconnection attempts reached');
          this.connectingPromise = null;
          reject(new Error('Failed to connect to server'));
        }
      });

      // Disconnection
      this.socket.on('disconnect', (reason) => {
        console.log('❌ Disconnected from server:', reason);
        this.isConnected = false;

        if (reason === 'io server disconnect') {
          // Server initiated disconnect, manually reconnect
          this.socket?.connect();
        }
      });

      // Reconnection attempt
      this.socket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`🔄 Reconnection attempt ${attemptNumber}...`);
      });

      // Reconnection successful
      this.socket.on('reconnect', (attemptNumber) => {
        console.log(`✅ Reconnected after ${attemptNumber} attempts`);
        this.reconnectAttempts = 0;
        if (this.user) {
          this.registerUser(this.user);
        }
      });

      // Registration confirmation
      this.socket.on('registered', (data) => {
        console.log('👤 User registered:', data);
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (!this.isConnected) {
          this.connectingPromise = null;
          reject(new Error('Connection timeout'));
        }
      }, 30000);
    });

    return this.connectingPromise;
  }

  /**
   * Register user with server
   */
  private registerUser(user: User) {
    if (!this.socket?.connected) return;

    this.socket.emit('register', {
      userId: user.id,
      role: user.role,
      userName: user.name,
      email: user.email,
    });
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting from Socket.IO server');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.connectingPromise = null;
    }
  }

  /**
   * Check if connected to server
   */
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  /**
   * Get socket ID
   */
  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  // ============================================
  // DISASTER ALERT METHODS
  // ============================================

  /**
   * Broadcast disaster alert to all connected devices
   * Used by officials to send alerts
   */
  broadcastDisasterAlert(alert: Partial<DisasterAlert>): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Not connected to server'));
        return;
      }

      console.log('🚨 Broadcasting disaster alert:', alert.title);

      // Emit alert
      this.socket.emit('broadcast-alert', alert);

      // Listen for confirmation
      this.socket.once('alert-broadcasted', (response) => {
        console.log('✅ Alert broadcasted successfully');
        console.log('   Recipients:', response.recipientCount);
        resolve(response);
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        reject(new Error('Broadcast timeout'));
      }, 5000);
    });
  }

  /**
   * Listen for incoming disaster alerts
   * Used by all users to receive real-time alerts
   */
  onDisasterAlert(callback: (alert: DisasterAlert) => void) {
    if (!this.socket) {
      console.warn('⚠️ Socket not initialized');
      return;
    }

    console.log('👂 Listening for disaster alerts');

    this.socket.on('disaster-alert', (alert: DisasterAlert) => {
      console.log('🚨 Received disaster alert:', alert.title);
      callback(alert);
    });
  }

  /**
   * Remove disaster alert listener
   */
  offDisasterAlert() {
    if (this.socket) {
      this.socket.off('disaster-alert');
      console.log('🔇 Stopped listening for disaster alerts');
    }
  }

  // ============================================
  // SOS METHODS
  // ============================================

  /**
   * Send SOS alert
   * Used by citizens in emergency situations
   */
  sendSOSAlert(sosData: Partial<SOSAlert>): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Not connected to server'));
        return;
      }

      console.log('🆘 Sending SOS alert');

      this.socket.emit('send-sos', sosData);

      this.socket.once('sos-sent', (response) => {
        console.log('✅ SOS sent successfully');
        resolve(response);
      });

      setTimeout(() => {
        reject(new Error('SOS timeout'));
      }, 5000);
    });
  }

  /**
   * Listen for SOS alerts
   * Used by officials to receive SOS alerts
   */
  onSOSAlert(callback: (sos: SOSAlert) => void) {
    if (!this.socket) return;

    console.log('👂 Listening for SOS alerts');

    this.socket.on('sos-alert', (sos: SOSAlert) => {
      console.log('🆘 Received SOS alert');
      callback(sos);
    });
  }

  /**
   * Remove SOS alert listener
   */
  offSOSAlert() {
    if (this.socket) {
      this.socket.off('sos-alert');
    }
  }

  // ============================================
  // INCIDENT REPORT METHODS
  // ============================================

  /**
   * Submit incident report
   * Used by citizens to report incidents
   */
  submitIncidentReport(report: Partial<IncidentReport>): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Not connected to server'));
        return;
      }

      console.log('📝 Submitting incident report');

      this.socket.emit('report-incident', report);

      this.socket.once('report-submitted', (response) => {
        console.log('✅ Report submitted successfully');
        resolve(response);
      });

      setTimeout(() => {
        reject(new Error('Report submission timeout'));
      }, 5000);
    });
  }

  /**
   * Listen for new incident reports
   * Used by officials
   */
  onIncidentReport(callback: (report: IncidentReport) => void) {
    if (!this.socket) return;

    console.log('👂 Listening for incident reports');

    this.socket.on('new-incident-report', (report: IncidentReport) => {
      console.log('📝 Received new incident report');
      callback(report);
    });
  }

  /**
   * Remove incident report listener
   */
  offIncidentReport() {
    if (this.socket) {
      this.socket.off('new-incident-report');
    }
  }

  // ============================================
  // ACKNOWLEDGMENT METHODS
  // ============================================

  /**
   * Acknowledge alert receipt
   */
  acknowledgeAlert(alertId: string, userId: string) {
    if (!this.socket?.connected) return;

    this.socket.emit('acknowledge-alert', {
      alertId,
      userId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Listen for alert acknowledgments
   */
  onAlertAcknowledged(callback: (data: any) => void) {
    if (!this.socket) return;

    this.socket.on('alert-acknowledged', callback);
  }

  // ============================================
  // LOCATION TRACKING METHODS
  // ============================================

  /**
   * Send citizen location to server
   * Used by citizens to share their GPS coordinates
   */
  sendLocation(locationData: LocationData): void {
    if (!this.socket || !this.socket.connected) {
      console.log('⚠️ Socket not connected, cannot send location');
      return;
    }

    this.socket.emit('citizen:location', locationData);
    console.log('📍 Location sent to server:', locationData);
  }

  /**
   * Listen for citizen locations
   * Used by officials to receive real-time citizen locations
   */
  onCitizenLocation(callback: (location: LocationData) => void): void {
    if (!this.socket) {
      console.log('⚠️ Socket not initialized');
      return;
    }

    this.socket.on('citizen:location:update', callback);
    console.log('👂 Listening for citizen locations');
  }

  /**
   * Stop listening for citizen locations
   */
  offCitizenLocation(): void {
    if (this.socket) {
      this.socket.off('citizen:location:update');
      console.log('🔇 Stopped listening for citizen locations');
    }
  }

  /**
   * Request all current citizen locations
   * Used by officials when they first connect
   */
  requestAllLocations(): void {
    if (!this.socket || !this.socket.connected) {
      console.log('⚠️ Socket not connected');
      return;
    }

    this.socket.emit('official:request:locations');
    console.log('📤 Requested all citizen locations');
  }

  /**
   * Listen for all locations response
   */
  onAllLocations(callback: (locations: LocationData[]) => void): void {
    if (!this.socket) return;

    this.socket.on('official:all:locations', callback);
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Send ping to check connection
   */
  ping(): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Not connected'));
        return;
      }

      const startTime = Date.now();

      this.socket.emit('ping');

      this.socket.once('pong', () => {
        const latency = Date.now() - startTime;
        console.log(`🏓 Pong received (${latency}ms)`);
        resolve(latency);
      });

      setTimeout(() => {
        reject(new Error('Ping timeout'));
      }, 3000);
    });
  }

  /**
   * Update server URL (for configuration)
   */
  setServerUrl(url: string) {
    this.serverUrl = url;
    console.log('🔧 Server URL updated:', url);
  }

  /**
   * Get current server URL
   */
  getServerUrl(): string {
    return this.serverUrl;
  }
}

// Export singleton instance
export default new SocketService();
