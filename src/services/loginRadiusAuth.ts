import {
  API_URL,
  LOGINRADIUS_APP_NAME,
  LOGINRADIUS_CLIENT_ID,
  LOGINRADIUS_CLIENT_SECRET,
  LOGINRADIUS_ISSUER_URL,
  LOGINRADIUS_WEB_REDIRECT_URI,
} from '../env_vars';
import logger from '../services/logging';

// LoginRadius OIDC Configuration
interface LoginRadiusConfig {
  siteUrl: string;
  oidcAppName: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

// Token response from LoginRadius
interface LoginRadiusTokenResponse {
  access_token: string;
  id_token: string;
  refresh_token: string;
  expires_in: number;
  token_type?: string;
  scope?: string;
}

// User info from LoginRadius ID token
interface LoginRadiusUser {
  sub: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  name?: string;
  preferred_username?: string;
  [key: string]: any;
}

class LoginRadiusAuthService {
  private config: LoginRadiusConfig | null = null;
  private token: string | null = null;
  private user: LoginRadiusUser | null = null;

  constructor() {
    this.loadConfig();
    this.loadStoredAuth();
  }

  private loadConfig() {
    // Extract site URL from issuer URL
    const siteUrl = LOGINRADIUS_ISSUER_URL.replace(
      '/service/oidc/' + LOGINRADIUS_APP_NAME,
      ''
    );

    // Load configuration from environment variables
    this.config = {
      siteUrl: siteUrl || '',
      oidcAppName: LOGINRADIUS_APP_NAME || '',
      clientId: LOGINRADIUS_CLIENT_ID || '',
      clientSecret: LOGINRADIUS_CLIENT_SECRET || '',
      redirectUri:
        LOGINRADIUS_WEB_REDIRECT_URI ||
        `${window.location.origin}/auth/loginradius/callback`,
    };

    // Validate required configuration
    if (
      !this.config.siteUrl ||
      !this.config.oidcAppName ||
      !this.config.clientId
    ) {
      logger.warn(
        'LoginRadius configuration incomplete. Some features may not work.'
      );
      logger.warn('Required config:', {
        siteUrl: this.config.siteUrl,
        oidcAppName: this.config.oidcAppName,
        clientId: this.config.clientId
          ? '***' + this.config.clientId.slice(-4)
          : 'Not set',
      });
    } else {
      logger.info('LoginRadius configuration loaded successfully');
    }
  }

  private loadStoredAuth() {
    try {
      this.token = localStorage.getItem('lr_access_token');
      const userData = localStorage.getItem('lr_user');
      this.user = userData ? JSON.parse(userData) : null;
    } catch (error) {
      logger.error('Failed to load stored LoginRadius auth data:', error);
      this.clearStoredAuth();
    }
  }

  private clearStoredAuth() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('lr_access_token');
    localStorage.removeItem('lr_user');
    localStorage.removeItem('lr_refresh_token');
  }

  private generateState(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  private generateNonce(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  /**
   * Initiate LoginRadius OIDC authorization flow
   */
  initiateAuth(role: string = 'patient'): string | null {
    if (!this.config) {
      logger.error('LoginRadius configuration not available');
      return null;
    }

    const state = this.generateState();
    const nonce = this.generateNonce();

    // Store state and nonce for validation
    sessionStorage.setItem('lr_state', state);
    sessionStorage.setItem('lr_nonce', nonce);
    sessionStorage.setItem('lr_role', role);

    const authUrl = new URL(
      `${this.config.siteUrl}/service/oidc/${this.config.oidcAppName}/authorize`
    );
    authUrl.searchParams.set('client_id', this.config.clientId);
    authUrl.searchParams.set('redirect_uri', this.config.redirectUri);
    authUrl.searchParams.set('scope', 'openid profile email');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('nonce', nonce);

    logger.info('Initiating LoginRadius OIDC flow', {
      authUrl: authUrl.toString(),
      role,
      state,
      nonce,
    });

    return authUrl.toString();
  }

  /**
   * Handle the authorization callback and exchange code for tokens
   */
  async handleCallback(): Promise<{
    success: boolean;
    user?: LoginRadiusUser;
    error?: string;
  }> {
    // Check if user is already authenticated
    if (this.isAuthenticated()) {
      logger.info(
        'LoginRadiusCallback - User already authenticated, returning existing user',
        {
          userId: this.user?.id,
          hasToken: !!this.token,
        }
      );
      return {
        success: true,
        user: this.getUser(),
      };
    }

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');

    // Handle authorization errors
    if (error) {
      logger.error('LoginRadius authorization error:', {
        error,
        errorDescription,
      });
      return {
        success: false,
        error: errorDescription || error,
      };
    }

    if (!code || !state) {
      return {
        success: false,
        error: 'Missing authorization code or state parameter',
      };
    }

    // Validate state parameter
    const storedState = sessionStorage.getItem('lr_state');
    if (state !== storedState) {
      logger.error('Invalid state parameter in callback');
      return {
        success: false,
        error: 'Invalid state parameter',
      };
    }

    try {
      // Exchange authorization code for tokens
      const tokenResponse = await this.exchangeCodeForTokens(code);

      if (!tokenResponse.success) {
        return {
          success: false,
          error: tokenResponse.error,
        };
      }

      // Decode and validate ID token
      const lrUser = await this.decodeIdToken(tokenResponse.data!.id_token);

      if (!lrUser) {
        return {
          success: false,
          error: 'Failed to decode ID token',
        };
      }

      // Send user data to backend for verification and user creation
      const backendResponse = await this.verifyWithBackend(
        lrUser,
        tokenResponse.data!
      );

      if (!backendResponse.success) {
        return {
          success: false,
          error: backendResponse.error || 'Backend verification failed',
        };
      }

      // Store the backend's JWT token and user data
      this.token = backendResponse.token;
      this.user = backendResponse.user;

      localStorage.setItem('auth_token', this.token);
      localStorage.setItem('user', JSON.stringify(this.user));

      // Store LoginRadius tokens separately for potential future use
      localStorage.setItem('lr_access_token', tokenResponse.data!.access_token);
      localStorage.setItem('lr_user', JSON.stringify(lrUser));

      if (tokenResponse.data!.refresh_token) {
        localStorage.setItem(
          'lr_refresh_token',
          tokenResponse.data!.refresh_token
        );
      }

      // Clean up session storage
      sessionStorage.removeItem('lr_state');
      sessionStorage.removeItem('lr_nonce');
      sessionStorage.removeItem('lr_role');

      logger.info('LoginRadius authentication successful', {
        userId: backendResponse.user.id,
        email: backendResponse.user.email,
      });

      return {
        success: true,
        user: backendResponse.user,
      };
    } catch (error) {
      logger.error('LoginRadius callback handling failed:', error);
      return {
        success: false,
        error: 'Failed to process authentication callback',
      };
    }
  }

  /**
   * Verify LoginRadius user with backend and create/update user
   */
  private async verifyWithBackend(
    lrUser: LoginRadiusUser,
    tokenData: LoginRadiusTokenResponse
  ): Promise<{
    success: boolean;
    token?: string;
    user?: any;
    error?: string;
  }> {
    try {
      const role = sessionStorage.getItem('lr_role') || 'patient';

      // Convert LoginRadius user to app user format
      const appUserData = this.convertToAppUser(lrUser, role);

      // Send to backend for verification and user creation
      const response = await fetch(`${API_URL}/api/auth/loginradius/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_token: tokenData.id_token,
          access_token: tokenData.access_token,
          user_data: appUserData,
          role: role,
        }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: 'Unknown error' }));
        logger.error('Backend verification failed:', {
          status: response.status,
          error: errorData,
        });
        return {
          success: false,
          error:
            errorData.error ||
            `Backend verification failed: ${response.status}`,
        };
      }

      const data = await response.json();

      return {
        success: true,
        token: data.token,
        user: data.user,
      };
    } catch (error) {
      logger.error('Backend verification network error:', error);
      return {
        success: false,
        error: 'Network error during backend verification',
      };
    }
  }

  /**
   * Exchange authorization code for tokens
   */
  private async exchangeCodeForTokens(code: string): Promise<{
    success: boolean;
    data?: LoginRadiusTokenResponse;
    error?: string;
  }> {
    if (!this.config) {
      return {
        success: false,
        error: 'LoginRadius configuration not available',
      };
    }

    try {
      const response = await fetch(
        `${this.config.siteUrl}/api/oidc/${this.config.oidcAppName}/token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: this.config.clientId,
            client_secret: this.config.clientSecret,
            redirect_uri: this.config.redirectUri,
            grant_type: 'authorization_code',
            code: code,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        logger.error('Token exchange failed:', {
          status: response.status,
          error: errorData,
        });
        return {
          success: false,
          error: `Token exchange failed: ${response.status}`,
        };
      }

      const data: LoginRadiusTokenResponse = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      logger.error('Token exchange network error:', error);
      return {
        success: false,
        error: 'Network error during token exchange',
      };
    }
  }

  /**
   * Decode and validate ID token
   */
  private async decodeIdToken(
    idToken: string
  ): Promise<LoginRadiusUser | null> {
    try {
      // For production, you should validate the JWT signature
      // For now, we'll just decode the payload
      const parts = idToken.split('.');
      if (parts.length !== 3) {
        logger.error('Invalid ID token format');
        return null;
      }

      const payload = JSON.parse(atob(parts[1]));

      // Validate token expiration
      if (payload.exp && payload.exp < Date.now() / 1000) {
        logger.error('ID token has expired');
        return null;
      }

      // Validate nonce if present
      const storedNonce = sessionStorage.getItem('lr_nonce');
      if (payload.nonce && storedNonce && payload.nonce !== storedNonce) {
        logger.error('Invalid nonce in ID token');
        return null;
      }

      return payload as LoginRadiusUser;
    } catch (error) {
      logger.error('Failed to decode ID token:', error);
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem('lr_refresh_token');
    if (!refreshToken || !this.config) {
      return false;
    }

    try {
      const response = await fetch(
        `${this.config.siteUrl}/api/oidc/${this.config.oidcAppName}/token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: this.config.clientId,
            client_secret: this.config.clientSecret,
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
          }),
        }
      );

      if (!response.ok) {
        logger.error('Token refresh failed:', response.status);
        this.clearStoredAuth();
        return false;
      }

      const data: LoginRadiusTokenResponse = await response.json();

      this.token = data.access_token;
      localStorage.setItem('lr_access_token', this.token);

      if (data.refresh_token) {
        localStorage.setItem('lr_refresh_token', data.refresh_token);
      }

      return true;
    } catch (error) {
      logger.error('Token refresh network error:', error);
      this.clearStoredAuth();
      return false;
    }
  }

  /**
   * Logout from LoginRadius
   */
  async logout(): Promise<void> {
    try {
      // If you have a logout endpoint, call it here
      // await fetch(`${this.config.siteUrl}/api/oidc/${this.config.oidcAppName}/logout`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${this.token}`,
      //   },
      // });
    } catch (error) {
      logger.error('Logout error:', error);
    } finally {
      this.clearStoredAuth();
    }
  }

  /**
   * Check if user is authenticated with LoginRadius
   */
  isAuthenticated(): boolean {
    const isAuth = !!(this.token && this.user);
    logger.debug('LoginRadiusAuthService - isAuthenticated check:', {
      hasToken: !!this.token,
      hasUser: !!this.user,
      isAuthenticated: isAuth,
      tokenPreview: this.token ? this.token.substring(0, 10) + '...' : 'null',
      userId: this.user?.id || 'null',
    });
    return isAuth;
  }

  /**
   * Get current user
   */
  getUser(): LoginRadiusUser | null {
    return this.user;
  }

  /**
   * Get access token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Get authorization headers for API requests
   */
  getAuthHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Convert LoginRadius user to app user format
   */
  private convertToAppUser(
    lrUser: LoginRadiusUser,
    role: string = 'patient'
  ): any {
    return {
      id: lrUser.sub,
      username: lrUser.preferred_username || lrUser.email || lrUser.sub,
      email: lrUser.email,
      first_name: lrUser.given_name || '',
      last_name: lrUser.family_name || '',
      role: role,
      source: 'loginradius', // Mark as LoginRadius user
    };
  }
}

// Create singleton instance
const loginRadiusAuthService = new LoginRadiusAuthService();

export default loginRadiusAuthService;
export type { LoginRadiusTokenResponse, LoginRadiusUser };
