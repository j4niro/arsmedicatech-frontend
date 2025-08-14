import { API_URL } from '../env_vars';
import logger from '../services/logging';

class AuthService {
  token: string | null;
  user: { role: 'user' | 'nurse' | 'doctor' | 'admin' } | null;

  constructor() {
    this.token = localStorage.getItem('auth_token');

    // Safely parse user data from localStorage
    try {
      const userData = localStorage.getItem('user');
      this.user = userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.warn('Failed to parse user data from localStorage:', error);
      this.user = null;
      // Clean up invalid data
      localStorage.removeItem('user');
    }
  }

  private buildAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async login(username: string, password: string) {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('auth_token', this.token ?? '');
        localStorage.setItem('user', JSON.stringify(this.user));
        return { success: true, data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    }
  }

  async register(
    username: string,
    email: string,
    password: string,
    first_name: string = '',
    last_name: string = '',
    role: string = 'patient'
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password,
          first_name,
          last_name,
          role,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    }
  }

  async logout(): Promise<void> {
    try {
      if (this.token) {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: this.buildAuthHeaders(),
          credentials: 'include',
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.token = null;
      this.user = null;
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  }

  async getCurrentUser(): Promise<any> {
    // TODO: What was this even for? if (!this.token) {return null;}

    const startTime = performance.now();
    logger.info('AuthService - getCurrentUser started', { startTime });

    try {
      logger.debug(
        'AuthService - Attempting to get current user from:',
        `${API_URL}/api/auth/me`
      );

      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: this.buildAuthHeaders(),
        credentials: 'include',
      });

      const responseTime = performance.now();
      const responseDuration = responseTime - startTime;

      logger.debug(
        'AuthService - getCurrentUser response status:',
        response.status
      );
      logger.info('AuthService - Response received', {
        responseDuration: responseDuration.toFixed(2),
        startTime,
        responseTime,
        status: response.status,
      });

      if (response.ok) {
        const data = await response.json();
        const parseTime = performance.now();
        const parseDuration = parseTime - responseTime;
        const totalDuration = parseTime - startTime;

        logger.debug('AuthService - getCurrentUser success, user data:', data);
        logger.info('AuthService - Request completed successfully', {
          responseDuration: responseDuration.toFixed(2),
          parseDuration: parseDuration.toFixed(2),
          totalDuration: totalDuration.toFixed(2),
          startTime,
          responseTime,
          parseTime,
        });

        this.user = data.user;
        localStorage.setItem('user', JSON.stringify(this.user));
        return this.user;
      } else {
        // Log the error response for debugging
        const errorData = await response.text();
        const errorTime = performance.now();
        const totalDuration = errorTime - startTime;

        logger.warn(
          `AuthService - getCurrentUser failed with status: ${response.status}, Response: ${errorData}`
        );
        logger.info('AuthService - Request failed', {
          totalDuration: totalDuration.toFixed(2),
          startTime,
          errorTime,
          status: response.status,
        });

        // Token might be invalid, clear it
        if (response.status === 401 || response.status === 403) {
          logger.debug(
            'AuthService - Clearing invalid token due to auth error'
          );
          this.logout();
        }
        return null;
      }
    } catch (error) {
      const errorTime = performance.now();
      const totalDuration = errorTime - startTime;

      logger.error('AuthService - getCurrentUser network error:', error);
      logger.info('AuthService - Network error occurred', {
        totalDuration: totalDuration.toFixed(2),
        startTime,
        errorTime,
        error: error instanceof Error ? error.message : String(error),
      });

      // Check if it's a network error (like CORS, connection refused, etc.)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        logger.error(
          'AuthService - Network fetch error, likely CORS or connection issue'
        );
      }

      return null;
    }
  }

  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: this.buildAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    }
  }

  async setupDefaultAdmin(): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const response = await fetch(`${API_URL}/api/admin/setup`, {
        method: 'POST',
        headers: this.buildAuthHeaders(),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    }
  }

  isAuthenticated(): boolean {
    return !!this.token && !!this.user;
  }

  getUser(): any {
    return this.user;
  }

  getToken(): string | null {
    return this.token;
  }

  hasRole(role: string): boolean {
    if (!this.user) return false;

    const roleHierarchy = {
      user: 1,
      nurse: 2,
      doctor: 3,
      admin: 4,
    };

    const userRole = this.user.role as keyof typeof roleHierarchy;
    const userLevel = roleHierarchy[userRole] || 0;
    const requiredLevel =
      roleHierarchy[role as keyof typeof roleHierarchy] || 0;

    return userLevel >= requiredLevel;
  }

  isAdmin(): boolean {
    return this.user?.role === 'admin';
  }

  isDoctor(): boolean {
    return this.hasRole('doctor');
  }

  isNurse(): boolean {
    return this.hasRole('nurse');
  }

  // Helper method to add auth headers to fetch requests
  getAuthHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  async checkUserExists(email: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${API_URL}/api/users/exist?email=${encodeURIComponent(email)}`
      );
      if (response.ok) {
        const data = await response.json();
        return data.users_exist || false;
      }
      return false;
    } catch (error) {
      console.error('Error checking if user exists:', error);
      return false;
    }
  }

  getFederatedSignInUrl(
    role: string,
    intent: 'signin' | 'signup' = 'signin'
  ): string {
    // Returns the backend URL to initiate Cognito OAuth with the selected role and intent
    return `${API_URL}/auth/login/cognito?role=${encodeURIComponent(role)}&intent=${intent}`;
  }

  async handleCognitoCallback(): Promise<{
    success: boolean;
    data?: any;
    error?: string;
    suggestedAction?: string;
  }> {
    try {
      // Get the current URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const error = urlParams.get('error');
      const errorDescription = urlParams.get('error_description');

      if (error) {
        // Handle specific Cognito errors
        if (
          error === 'invalid_request' &&
          errorDescription?.includes('email')
        ) {
          return {
            success: false,
            error: 'Email already exists',
            suggestedAction: 'login',
          };
        }

        return {
          success: false,
          error: errorDescription || error,
        };
      }

      // If no error, the callback was successful
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to process authentication callback',
      };
    }
  }
}

// Create a singleton instance
const authService = new AuthService();

export default authService;
