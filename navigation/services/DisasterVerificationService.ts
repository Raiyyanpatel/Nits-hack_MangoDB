import * as FileSystem from 'expo-file-system/legacy';

/**
 * Disaster Verification Service
 * Integrates with Roboflow AI model to detect disaster types
 */

export interface RoboflowPrediction {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  class: string;
  class_id: number;
  detection_id: string;
}

export interface RoboflowResponse {
  time: number;
  image: {
    width: number;
    height: number;
  };
  predictions: RoboflowPrediction[];
}

export interface AuthenticityVerificationResult {
  report: {
    image_path: string;
    latitude: number;
    longitude: number;
    timestamp: string;
  };
  detection: {
    class: string;
    confidence: number;
  };
  checks: {
    weather: any;
    news: any;
    seismic: any;
  };
  score: number;
  verdict: string;
  baseline_verdict: string;
  llm_used: boolean;
  metadata: any;
}

class DisasterVerificationService {
  private apiUrl: string = 'https://serverless.roboflow.com/setu-tuhi8/2';
  private apiKey: string = 'J3LjWOxdR2FB8pPMqCPY';
  private verifyApiUrl: string = 'https://dhs0gn69-8080.inc1.devtunnels.ms/verify';

  /**
   * Detect disaster type from image using Roboflow API
   */
  async detectDisaster(imageUri: string): Promise<RoboflowResponse> {
    try {
      console.log('🔍 Starting disaster detection...');
      console.log('   Image URI:', imageUri);

      // Read image as base64
      const base64Image = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64',
      });

      console.log('📤 Sending to Roboflow API...');

      const response = await fetch(`${this.apiUrl}?api_key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: base64Image,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result: RoboflowResponse = await response.json();

      console.log('✅ Detection complete:');
      console.log('   Predictions:', result.predictions.length);
      if (result.predictions.length > 0) {
        const topPrediction = result.predictions[0];
        console.log('   Top Detection:', topPrediction.class);
        console.log('   Confidence:', (topPrediction.confidence * 100).toFixed(1) + '%');
      }

      return result;

    } catch (error: any) {
      console.error('❌ Detection failed:', error.message);
      throw new Error(`Detection failed: ${error.message}`);
    }
  }

  /**
   * Get the highest confidence prediction
   */
  getTopPrediction(response: RoboflowResponse): RoboflowPrediction | null {
    if (!response.predictions || response.predictions.length === 0) {
      return null;
    }

    // Sort by confidence and return the highest
    return response.predictions.sort((a, b) => b.confidence - a.confidence)[0];
  }

  /**
   * Map detected class to incident type
   * Returns the exact class name from Roboflow API
   */
  mapClassToIncidentType(detectedClass: string): string {
    console.log('📝 Using Roboflow class directly:', detectedClass);
    // Return the exact class name from Roboflow API
    return detectedClass;
  }

  /**
   * Update API URL if needed
   */
  setApiUrl(url: string): void {
    this.apiUrl = url;
    console.log('🔧 API URL updated:', url);
  }

  /**
   * Update API Key if needed
   */
  setApiKey(key: string): void {
    this.apiKey = key;
    console.log('🔧 API Key updated');
  }

  /**
   * Verify image authenticity with AI model
   * Sends image + GPS to /verify API for authenticity score
   */
  async verifyImageAuthenticity(
    imageUri: string,
    latitude: number,
    longitude: number
  ): Promise<AuthenticityVerificationResult> {
    try {
      console.log('🔐 Starting authenticity verification...');
      console.log('   Image URI:', imageUri);
      console.log('   Location:', latitude, longitude);

      const formData = new FormData();
      
      // Add image file
      const filename = imageUri.split('/').pop() || 'photo.jpg';
      const imageFile = {
        uri: imageUri,
        name: filename,
        type: 'image/jpeg',
      } as any;
      
      // Get current timestamp in ISO format
      const timestamp = new Date().toISOString();
      
      formData.append('image', imageFile);
      formData.append('latitude', latitude.toString());
      formData.append('longitude', longitude.toString());
      formData.append('timestamp', timestamp);

      console.log('═══════════════════════════════════════════════');
      console.log('📤 SENDING VERIFICATION REQUEST');
      console.log('═══════════════════════════════════════════════');
      console.log('🔗 API URL:', this.verifyApiUrl);
      console.log('📸 Image:', filename);
      console.log('📍 Latitude:', latitude);
      console.log('📍 Longitude:', longitude);
      console.log('⏰ Timestamp:', timestamp);
      console.log('═══════════════════════════════════════════════');

      const response = await fetch(this.verifyApiUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP Error:', response.status);
        console.error('❌ Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result: AuthenticityVerificationResult = await response.json();

      console.log('═══════════════════════════════════════════════');
      console.log('✅ VERIFICATION RESPONSE RECEIVED');
      console.log('═══════════════════════════════════════════════');
      console.log('📋 Full Response:', JSON.stringify(result, null, 2));
      console.log('───────────────────────────────────────────────');
      console.log('🔍 Detected Class:', result.detection.class);
      console.log('📊 Detection Confidence:', result.detection.confidence);
      console.log('🎯 AI Authenticity Score:', result.score);
      console.log('⚖️  Verdict:', result.verdict);
      console.log('🔬 LLM Used:', result.llm_used);
      console.log('☁️  Weather Check:', result.checks.weather.is_severe);
      console.log('📰 News Check:', result.checks.news.is_relevant);
      console.log('🌍 Seismic Check:', result.checks.seismic.is_relevant);
      console.log('═══════════════════════════════════════════════');

      return result;

    } catch (error: any) {
      console.error('❌ Authenticity verification failed:', error.message);
      throw new Error(`Verification failed: ${error.message}`);
    }
  }

  /**
   * Update verification API URL if needed
   */
  setVerifyApiUrl(url: string): void {
    this.verifyApiUrl = url;
    console.log('🔧 Verification API URL updated:', url);
  }
}

export default new DisasterVerificationService();
