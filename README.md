# SocketService Documentation

## Overview

`SocketService` is a comprehensive Socket.IO client service for real-time communication in the Disaster Management mobile application. It handles bidirectional communication between citizens, officials, and the server for disaster alerts, SOS signals, incident reports, and GPS location tracking.

## Features

- ✅ Real-time disaster alert broadcasting
- ✅ SOS emergency signal transmission
- ✅ Incident report submission and reception
- ✅ GPS location tracking (citizen → officials)
- ✅ Automatic reconnection with exponential backoff
- ✅ Connection state management
- ✅ User registration and role-based communication
- ✅ Network-resilient transport (polling → websocket upgrade)

---

## Installation

The service uses `socket.io-client`. Install it if not already present:

```bash
npm install socket.io-client
```

---

## Configuration

### Server URL Setup

Update the `serverUrl` in the constructor based on your deployment:

```typescript
constructor() {
  // Local network (same WiFi)
  this.serverUrl = 'http://192.168.1.6:3000';
  
  // Port forwarding (public IP)
  // this.serverUrl = 'http://YOUR_PUBLIC_IP:3000';
  
  // ngrok tunnel (testing across networks)
  // this.serverUrl = 'https://abc123.ngrok.io';
  
  // Dev tunnel (current setup)
  this.serverUrl = 'https://w14t36gv-3000.inc1.devtunnels.ms/';
  
  // Production (cloud deployment)
  // this.serverUrl = 'https://your-app.onrender.com';
}
```

### Transport Configuration

The service uses a **progressive transport strategy**:
1. Starts with `polling` (reliable on mobile networks)
2. Upgrades to `websocket` if available (lower latency)

```typescript
transports: ['polling', 'websocket'],
reconnection: true,
timeout: 30000, // 30 seconds
reconnectionAttempts: 5,
```

---

## Usage

### Import the Service

```typescript
import SocketService from './src/services/SocketService';
```

The service is a **singleton** - one instance shared across the app.

---

## API Reference

### Connection Management

#### `connect(user: User): Promise<boolean>`

Establishes connection to the Socket.IO server and registers the user.

**Parameters:**
- `user`: User object with `id`, `name`, `email`, `role`

**Returns:** Promise that resolves to `true` if connected successfully

**Example:**
```typescript
const user = {
  id: '123',
  name: 'John Doe',
  email: 'john@example.com',
  role: 'citizen'
};

try {
  const connected = await SocketService.connect(user);
  console.log('Connected:', connected);
} catch (error) {
  console.error('Connection failed:', error);
}
```

**Features:**
- Prevents multiple simultaneous connection attempts
- Auto-registers user with server upon connection
- Handles reconnection automatically
- 30-second connection timeout

---

#### `disconnect()`

Disconnects from the server and cleans up resources.

**Example:**
```typescript
SocketService.disconnect();
```

---

#### `isSocketConnected(): boolean`

Check if currently connected to the server.

**Returns:** `true` if connected, `false` otherwise

**Example:**
```typescript
if (SocketService.isSocketConnected()) {
  console.log('Socket is connected');
}
```

---

#### `getSocketId(): string | undefined`

Get the current socket connection ID.

**Returns:** Socket ID string or `undefined` if not connected

---

### Disaster Alert Methods

#### `broadcastDisasterAlert(alert: Partial<DisasterAlert>): Promise<any>`

Broadcast a disaster alert to all connected devices. **Used by officials only.**

**Parameters:**
- `alert`: Alert object containing:
  ```typescript
  {
    id?: string;
    title: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    type: string;
    location: string;
    coordinates?: { lat: number; lon: number };
    timestamp?: string;
    affectedAreas?: string[];
  }
  ```

**Returns:** Promise with broadcast response including recipient count

**Example:**
```typescript
const alert = {
  title: 'Flash Flood Warning',
  message: 'Heavy rainfall expected. Move to higher ground.',
  severity: 'high',
  type: 'flood',
  location: 'Mumbai, Maharashtra',
  coordinates: { lat: 19.0760, lon: 72.8777 }
};

try {
  const response = await SocketService.broadcastDisasterAlert(alert);
  console.log(`Alert sent to ${response.recipientCount} devices`);
} catch (error) {
  console.error('Broadcast failed:', error);
}
```

**Server Events:**
- Emits: `'broadcast-alert'`
- Listens: `'alert-broadcasted'` (confirmation)

---

#### `onDisasterAlert(callback: (alert: DisasterAlert) => void)`

Listen for incoming disaster alerts. **Used by all users.**

**Parameters:**
- `callback`: Function called when an alert is received

**Example:**
```typescript
SocketService.onDisasterAlert((alert) => {
  console.log('🚨 New Alert:', alert.title);
  Alert.alert(
    alert.title,
    alert.message,
    [{ text: 'OK' }]
  );
});
```

**Cleanup:**
```typescript
// Remove listener when component unmounts
useEffect(() => {
  SocketService.onDisasterAlert(handleAlert);
  
  return () => {
    SocketService.offDisasterAlert();
  };
}, []);
```

---

#### `offDisasterAlert()`

Stop listening for disaster alerts.

---

### SOS Methods

#### `sendSOSAlert(sosData: Partial<SOSAlert>): Promise<any>`

Send an SOS emergency signal. **Used by citizens in distress.**

**Parameters:**
- `sosData`: SOS object containing:
  ```typescript
  {
    id?: string;
    userId: string;
    userName: string;
    location: { lat: number; lon: number };
    address?: string;
    emergencyType: string;
    message?: string;
    timestamp?: string;
  }
  ```

**Example:**
```typescript
const sosData = {
  userId: user.id,
  userName: user.name,
  location: { lat: 19.0760, lon: 72.8777 },
  address: 'Near Gateway of India',
  emergencyType: 'Trapped in building',
  message: 'Urgent help needed'
};

try {
  await SocketService.sendSOSAlert(sosData);
  Alert.alert('SOS Sent', 'Emergency services notified');
} catch (error) {
  Alert.alert('Failed', 'Could not send SOS');
}
```

---

#### `onSOSAlert(callback: (sos: SOSAlert) => void)`

Listen for SOS alerts. **Used by officials.**

**Example:**
```typescript
SocketService.onSOSAlert((sos) => {
  console.log('🆘 SOS from:', sos.userName);
  Alert.alert(
    'SOS Alert',
    `${sos.userName} needs help!\n${sos.emergencyType}\nLocation: ${sos.address}`
  );
});
```

---

#### `offSOSAlert()`

Stop listening for SOS alerts.

---

### Incident Report Methods

#### `submitIncidentReport(report: Partial<IncidentReport>): Promise<any>`

Submit an incident report with optional photo and AI verification. **Used by citizens.**

**Parameters:**
- `report`: Report object containing:
  ```typescript
  {
    id?: string;
    userId: string;
    userName: string;
    type: string;
    description: string;
    location: string;
    coordinates: { lat: number; lon: number };
    severity: 'low' | 'medium' | 'high';
    imageUrl?: string;
    aiAuthenticityScore?: number; // 0-100
    verification?: 'verified' | 'flagged' | 'rejected';
    timestamp?: string;
  }
  ```

**Example:**
```typescript
const report = {
  userId: user.id,
  userName: user.name,
  type: 'Flood',
  description: 'Water level rising rapidly',
  location: 'Andheri West',
  coordinates: { lat: 19.1334, lon: 72.8291 },
  severity: 'high',
  imageUrl: 'file://...',
  aiAuthenticityScore: 87,
  verification: 'verified'
};

try {
  await SocketService.submitIncidentReport(report);
  Alert.alert('Success', 'Report submitted to officials');
} catch (error) {
  Alert.alert('Error', 'Could not submit report');
}
```

---

#### `onIncidentReport(callback: (report: IncidentReport) => void)`

Listen for new incident reports. **Used by officials.**

**Example:**
```typescript
SocketService.onIncidentReport((report) => {
  console.log('📝 New Report:', report.type);
  setReports(prev => [report, ...prev]);
  
  // Show notification
  Alert.alert(
    'New Report',
    `${report.type} reported in ${report.location}\nAI Score: ${report.aiAuthenticityScore}%`
  );
});
```

---

#### `offIncidentReport()`

Stop listening for incident reports.

---

### Location Tracking Methods

#### `sendLocation(locationData: LocationData)`

Send GPS coordinates to the server. **Used by citizens for real-time tracking.**

**Parameters:**
- `locationData`:
  ```typescript
  {
    userId: string;
    userName: string;
    latitude: number;
    longitude: number;
    accuracy: number; // meters
    timestamp: number; // Unix timestamp
  }
  ```

**Example:**
```typescript
import LocationService from './LocationService';

// Start tracking (sends location every 60 seconds)
LocationService.startTracking(user.id, user.name, (location) => {
  SocketService.sendLocation(location);
});
```

**Automatic Tracking:**
```typescript
useEffect(() => {
  if (user?.role === 'citizen') {
    LocationService.startTracking(user.id, user.name, (location) => {
      SocketService.sendLocation(location);
    });
  }
  
  return () => {
    LocationService.stopTracking();
  };
}, [user]);
```

---

#### `onCitizenLocation(callback: (location: LocationData) => void)`

Listen for citizen location updates. **Used by officials.**

**Example:**
```typescript
SocketService.onCitizenLocation((location) => {
  console.log(`📍 ${location.userName} at ${location.latitude}, ${location.longitude}`);
  
  // Update map or list
  setCitizenLocations(prev => {
    const index = prev.findIndex(loc => loc.userId === location.userId);
    if (index >= 0) {
      const updated = [...prev];
      updated[index] = location;
      return updated;
    }
    return [...prev, location];
  });
});
```

---

#### `requestAllLocations()`

Request all current citizen locations. **Used by officials on login.**

**Example:**
```typescript
useEffect(() => {
  if (user?.role === 'official') {
    SocketService.requestAllLocations();
    
    SocketService.onAllLocations((locations) => {
      console.log(`Received ${locations.length} citizen locations`);
      setCitizenLocations(locations);
    });
  }
}, [user]);
```

---

#### `offCitizenLocation()`

Stop listening for citizen locations.

---

### Utility Methods

#### `acknowledgeAlert(alertId: string, userId: string)`

Send acknowledgment that an alert was received and read.

**Example:**
```typescript
SocketService.acknowledgeAlert(alert.id, user.id);
```

---

#### `onAlertAcknowledged(callback: (data: any) => void)`

Listen for alert acknowledgments (officials can see who read alerts).

---

#### `ping(): Promise<number>`

Send a ping to measure server latency.

**Returns:** Promise resolving to latency in milliseconds

**Example:**
```typescript
const latency = await SocketService.ping();
console.log(`Server latency: ${latency}ms`);
```

---

#### `setServerUrl(url: string)`

Update the server URL (useful for switching environments).

**Example:**
```typescript
SocketService.setServerUrl('https://production-server.com');
```

---

#### `getServerUrl(): string`

Get the current server URL.

---

## Event Lifecycle

### Connection Flow

```
App Start
    ↓
User Logs In
    ↓
SocketService.connect(user)
    ↓
[Connecting...] ← Uses polling transport
    ↓
[Connected] → Upgrades to websocket
    ↓
User Registered → Emits 'register' event
    ↓
Setup Listeners → onDisasterAlert, onIncidentReport, etc.
    ↓
Ready for Communication
```

### Reconnection Flow

```
Connection Lost
    ↓
[Reconnecting...] ← Attempt 1
    ↓
[Reconnecting...] ← Attempt 2
    ↓
[Reconnecting...] ← Attempt 3
    ↓
[Connected] → Auto re-register user
    ↓
Resume Communication
```

If all 5 attempts fail → User must manually retry

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Connection timeout` | Server unreachable after 30s | Check server URL and network |
| `Not connected to server` | Method called before `connect()` | Ensure `connect()` is called first |
| `Max reconnection attempts reached` | Server down for extended period | Check server status, restart app |
| `Broadcast timeout` | No confirmation from server in 5s | Verify server is running |

### Best Practices

```typescript
// Always check connection before critical operations
if (SocketService.isSocketConnected()) {
  await SocketService.broadcastDisasterAlert(alert);
} else {
  // Retry connection
  await SocketService.connect(user);
}

// Use try-catch for all async operations
try {
  await SocketService.sendSOSAlert(sosData);
} catch (error) {
  console.error('SOS failed:', error);
  Alert.alert('Error', 'Could not send SOS. Please try again.');
}

// Clean up listeners to prevent memory leaks
useEffect(() => {
  SocketService.onDisasterAlert(handleAlert);
  
  return () => {
    SocketService.offDisasterAlert();
  };
}, []);
```

---

## React Native Integration

### Complete Example: Citizen App

```typescript
import { useEffect, useState } from 'react';
import SocketService from './src/services/SocketService';
import LocationService from './src/services/LocationService';

function CitizenApp({ user }) {
  const [alerts, setAlerts] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to server
    SocketService.connect(user)
      .then(() => {
        setIsConnected(true);
        console.log('✅ Connected');
        
        // Start location tracking
        LocationService.startTracking(user.id, user.name, (location) => {
          SocketService.sendLocation(location);
        });
      })
      .catch(error => {
        console.error('Connection failed:', error);
        Alert.alert('Connection Error', 'Could not connect to server');
      });

    // Listen for disaster alerts
    SocketService.onDisasterAlert((alert) => {
      setAlerts(prev => [alert, ...prev]);
      Alert.alert('🚨 ' + alert.title, alert.message);
    });

    // Cleanup
    return () => {
      LocationService.stopTracking();
      SocketService.offDisasterAlert();
      SocketService.disconnect();
    };
  }, [user]);

  const sendSOS = async () => {
    const location = await LocationService.getCurrentLocation();
    
    try {
      await SocketService.sendSOSAlert({
        userId: user.id,
        userName: user.name,
        location: { lat: location.latitude, lon: location.longitude },
        emergencyType: 'Trapped',
        message: 'Need immediate help'
      });
      
      Alert.alert('SOS Sent', 'Help is on the way');
    } catch (error) {
      Alert.alert('Failed', 'Could not send SOS');
    }
  };

  return (
    <View>
      <Text>Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</Text>
      <Button title="Send SOS" onPress={sendSOS} />
      {/* Display alerts */}
    </View>
  );
}
```

### Complete Example: Official App

```typescript
function OfficialApp({ user }) {
  const [reports, setReports] = useState([]);
  const [sosAlerts, setSosAlerts] = useState([]);
  const [citizenLocations, setCitizenLocations] = useState([]);

  useEffect(() => {
    SocketService.connect(user)
      .then(() => {
        console.log('✅ Official connected');
        
        // Request all citizen locations
        SocketService.requestAllLocations();
      });

    // Listen for incident reports
    SocketService.onIncidentReport((report) => {
      setReports(prev => [report, ...prev]);
      Alert.alert('📝 New Report', `${report.type} in ${report.location}`);
    });

    // Listen for SOS alerts
    SocketService.onSOSAlert((sos) => {
      setSosAlerts(prev => [sos, ...prev]);
      Alert.alert('🆘 SOS Alert', `${sos.userName} needs help!`);
    });

    // Listen for citizen locations
    SocketService.onCitizenLocation((location) => {
      setCitizenLocations(prev => {
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
    SocketService.onAllLocations((locations) => {
      setCitizenLocations(locations);
    });

    return () => {
      SocketService.offIncidentReport();
      SocketService.offSOSAlert();
      SocketService.offCitizenLocation();
      SocketService.disconnect();
    };
  }, [user]);

  const broadcastAlert = async () => {
    const alert = {
      title: 'Cyclone Warning',
      message: 'Stay indoors. Cyclone expected in 2 hours.',
      severity: 'critical',
      type: 'cyclone',
      location: 'Mumbai Metropolitan Region'
    };

    try {
      const response = await SocketService.broadcastDisasterAlert(alert);
      Alert.alert('Success', `Alert sent to ${response.recipientCount} citizens`);
    } catch (error) {
      Alert.alert('Error', 'Could not broadcast alert');
    }
  };

  return (
    <View>
      <Button title="Broadcast Alert" onPress={broadcastAlert} />
      <Text>Pending Reports: {reports.length}</Text>
      <Text>Active SOS: {sosAlerts.length}</Text>
      <Text>Citizens Tracked: {citizenLocations.length}</Text>
    </View>
  );
}
```

---

## Server Requirements

The SocketService expects the following server-side events:

### Server Must Emit:
- `'disaster-alert'` → When broadcasting alerts
- `'sos-alert'` → When SOS is received
- `'new-incident-report'` → When report is submitted
- `'citizen:location:update'` → When citizen location updates
- `'official:all:locations'` → Response to location request
- `'alert-broadcasted'` → Confirmation of broadcast
- `'sos-sent'` → Confirmation of SOS
- `'report-submitted'` → Confirmation of report

### Server Must Listen For:
- `'register'` → User registration
- `'broadcast-alert'` → Alert broadcast request
- `'send-sos'` → SOS signal
- `'report-incident'` → Incident report
- `'citizen:location'` → GPS location update
- `'official:request:locations'` → Location query
- `'acknowledge-alert'` → Alert acknowledgment
- `'ping'` → Latency check

See `server/server.js` for reference implementation.

---

## Network Configuration Guide

### Local Network (Same WiFi)

```typescript
this.serverUrl = 'http://192.168.1.6:3000';
```

**Requirements:**
- Both devices on same WiFi
- Server running on port 3000
- Windows Firewall allows port 3000

---

### Port Forwarding (Cross-Network)

```typescript
this.serverUrl = 'http://YOUR_PUBLIC_IP:3000';
```

**Requirements:**
1. Find public IP: `curl ifconfig.me`
2. Configure router port forwarding: External 3000 → Internal 192.168.1.6:3000
3. Windows Firewall: Allow public profile on port 3000
4. Update SocketService with public IP

**Test:** `curl http://YOUR_PUBLIC_IP:3000/health` from mobile data

---

### ngrok Tunnel (Development)

```bash
# Start server
npm start

# In new terminal
ngrok http 3000
```

```typescript
this.serverUrl = 'https://abc123.ngrok.io';
```

**Advantages:**
- Works through any firewall
- HTTPS automatic
- No router config needed

**Limitations:**
- 8-hour session limit (free tier)
- URL changes on restart

---

### Cloud Deployment (Production)

Deploy server to Render/Railway/Heroku:

```typescript
this.serverUrl = 'https://your-app.onrender.com';
```

**Benefits:**
- Always available
- HTTPS secure
- Fixed URL
- No local server needed

---

## Troubleshooting

### Connection Timeouts

**Symptoms:** `Connection timeout` error after 30 seconds

**Solutions:**
1. Check server is running: `curl http://SERVER_URL/health`
2. Verify firewall allows port 3000
3. Ensure devices on same network OR using tunnel/cloud
4. Check server logs for incoming connections

---

### Reconnection Loops

**Symptoms:** Constant reconnection attempts

**Solutions:**
1. Check server stability
2. Verify network connectivity
3. Use `ping()` to test latency
4. Consider increasing `reconnectionDelay`

---

### Messages Not Received

**Symptoms:** Alerts/reports not appearing

**Solutions:**
1. Verify listeners are set up: `onDisasterAlert()`, etc.
2. Check server is emitting correct events
3. Use console logs to trace message flow
4. Ensure user is registered: Check `'registered'` event

---

### Location Not Updating

**Symptoms:** GPS coordinates not reaching officials

**Solutions:**
1. Check location permissions granted
2. Verify `LocationService.startTracking()` is called
3. Check socket connection before sending
4. Ensure officials are listening: `onCitizenLocation()`

---

## Performance Considerations

### Optimization Tips

1. **Minimize Alert Frequency**
   ```typescript
   // Bad: Sending location every second
   setInterval(() => sendLocation(), 1000);
   
   // Good: Send every 60 seconds
   LocationService.startTracking(...); // Built-in 60s interval
   ```

2. **Clean Up Listeners**
   ```typescript
   useEffect(() => {
     SocketService.onDisasterAlert(handler);
     return () => SocketService.offDisasterAlert(); // Prevent memory leaks
   }, []);
   ```

3. **Batch Operations**
   ```typescript
   // Instead of multiple individual reports, consider batching
   const reports = [...];
   reports.forEach(report => SocketService.submitIncidentReport(report));
   ```

4. **Connection Pooling**
   ```typescript
   // Reuse existing connection
   if (SocketService.isSocketConnected()) {
     // Use existing connection
   } else {
     await SocketService.connect(user);
   }
   ```

---

## Security Considerations

### Authentication

The service sends user credentials on registration:

```typescript
this.socket.emit('register', {
  userId: user.id,
  role: user.role,
  userName: user.name,
  email: user.email,
});
```

**Production Recommendations:**
- Implement JWT token authentication
- Validate user roles on server
- Use HTTPS in production (wss://)
- Sanitize user inputs before emitting

### Data Privacy

- Location data is sent in real-time to officials
- Ensure users consent to location tracking
- Implement data retention policies
- Encrypt sensitive data in transit

---

## Testing

### Unit Tests Example

```typescript
describe('SocketService', () => {
  beforeEach(() => {
    SocketService.disconnect();
  });

  test('should connect successfully', async () => {
    const user = { id: '1', name: 'Test', email: 'test@test.com', role: 'citizen' };
    const connected = await SocketService.connect(user);
    expect(connected).toBe(true);
    expect(SocketService.isSocketConnected()).toBe(true);
  });

  test('should broadcast alert', async () => {
    const alert = { title: 'Test', message: 'Test', severity: 'low' };
    const response = await SocketService.broadcastDisasterAlert(alert);
    expect(response.recipientCount).toBeGreaterThan(0);
  });
});
```

---

## Changelog

### Version 1.0.0 (Current)
- Initial release
- Disaster alert broadcasting
- SOS emergency signals
- Incident reporting with AI verification
- Real-time GPS tracking (60s intervals)
- Auto-reconnection logic
- Transport optimization (polling → websocket)

---

## License

MIT License - Part of Smart India Hackathon 2025 Disaster Management Project

---

## Support

For issues or questions:
1. Check server logs: `server/server.js`
2. Enable verbose logging: `console.log` throughout service
3. Test connection: `SocketService.ping()`
4. Verify network: `curl http://SERVER_URL/health`

---

## Related Documentation

- [Server Setup Guide](../../../server/README.md)
- [Location Service](./LocationService.ts)
- [Disaster Verification Service](./DisasterVerificationService.ts)
- [Socket.IO Client Docs](https://socket.io/docs/v4/client-api/)

---

**Last Updated:** November 23, 2025  
**Author:** Team MangoDB
**Version:** 1.0.0
