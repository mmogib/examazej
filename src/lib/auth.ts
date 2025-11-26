// Authentication client for Hono API
const AUTH_API_URL = 'https://shuffler-auth.mshahrani.website/api/auth';
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

export interface User {
  email: string;
  name: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
  expiresIn: string;
}

export interface AuthError {
  error: string;
  message?: string;
}

// Verify access code and get JWT token
export async function verifyCode(code: string): Promise<AuthResponse> {
  const response = await fetch(`${AUTH_API_URL}/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    const error: AuthError = await response.json();
    throw new Error(error.message || error.error || 'Failed to verify code');
  }

  const data: AuthResponse = await response.json();
  
  // Store token and user data
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  
  return data;
}

// Get current user from token
export async function getCurrentUser(): Promise<User | null> {
  const token = localStorage.getItem(TOKEN_KEY);
  
  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${AUTH_API_URL}/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      // Token is invalid or expired
      signOut();
      return null;
    }

    const data = await response.json();
    
    if (data.success && data.user) {
      // Update stored user data
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return data.user;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get current user:', error);
    signOut();
    return null;
  }
}

// Get stored user data (without API call)
export function getStoredUser(): User | null {
  const userData = localStorage.getItem(USER_KEY);
  if (!userData) return null;
  
  try {
    return JSON.parse(userData);
  } catch {
    return null;
  }
}

// Get stored token
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return !!getToken();
}

// Sign out
export function signOut(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  // Also remove old Supabase data if exists
  localStorage.removeItem('userFullName');
  localStorage.removeItem('userEmail');
}

// Verify token validity (optional - useful for route guards)
export async function verifyToken(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user;
}
