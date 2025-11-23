import { User, UserRole } from '../types';

// Mock implementation for now - replace with actual Firebase implementation
export class AuthService {
  private static currentUser: User | null = null;

  static async initialize(): Promise<void> {
    // Initialize Firebase Auth
    console.log('AuthService initialized');
  }

  static async getCurrentUser(): Promise<User | null> {
    return this.currentUser;
  }

  static async login(email: string, password: string): Promise<User> {
    // Mock login - replace with Firebase Auth
    const mockUser: User = {
      id: '1',
      email,
      name: 'Demo User',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.currentUser = mockUser;
    return mockUser;
  }

  static async registerWithRole(
    email: string, 
    password: string, 
    name: string, 
    role: UserRole
  ): Promise<User> {
    // Mock registration - replace with Firebase Auth
    const mockUser: User = {
      id: Math.random().toString(36).substring(7),
      email,
      name,
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.currentUser = mockUser;
    return mockUser;
  }

  static async updateUserRole(role: UserRole): Promise<User> {
    if (!this.currentUser) {
      throw new Error('No user logged in');
    }

    this.currentUser.role = role;
    this.currentUser.updatedAt = new Date();
    
    return this.currentUser;
  }

  static async logout(): Promise<void> {
    this.currentUser = null;
  }

  static async sendOTP(phoneNumber: string): Promise<void> {
    console.log('OTP sent to:', phoneNumber);
  }

  static async verifyOTP(otp: string): Promise<boolean> {
    // Mock OTP verification
    return otp === '123456';
  }
}