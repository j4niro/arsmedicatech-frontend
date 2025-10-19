import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import authService from '../services/auth';
import logger from '../services/logging';

export interface User {
  id: string;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  role: string;
  max_organizations?: number;
  user_organizations?: number;
  appointments?: number; // Optional, if needed
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  refreshAuth: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authCheckStartTime, setAuthCheckStartTime] = useState<number>(0);

  // Debug logging for state changes
  useEffect(() => {
    logger.debug('UserContext - user state changed:', user);
    logger.debug('UserContext - isAuthenticated state changed:', !!user);
  }, [user]);

  useEffect(() => {
    const checkAuth = async () => {
      const startTime = performance.now();
      setAuthCheckStartTime(startTime);
      logger.info('UserContext - Starting auth check', { startTime });

      // EMERGENCY: If we're in demo mode, skip auth check entirely
      if (
        process.env.DEMO_MODE === 'true' ||
        process.env.REACT_APP_DEMO_MODE === 'true' ||
        process.env.API_URL?.includes('demo.arsmedicatech.com')
      ) {
        logger.warn(
          'UserContext - DEMO MODE DETECTED - Skipping auth check to prevent 60+ second delays'
        );
        setIsLoading(false);
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      // Check for traditional authentication first (includes LoginRadius users after they're processed)
      const isAuth = authService.isAuthenticated();
      logger.debug('UserContext - Auth service check:', {
        isAuthenticated: isAuth,
      });

      if (isAuth) {
        const currentUser = authService.getUser();
        logger.debug('UserContext - User data check:', {
          hasUser: !!currentUser,
          userId: currentUser?.id || 'null',
          userSource: currentUser?.source || 'unknown',
        });

        if (currentUser) {
          logger.info('UserContext - Authenticated user found', {
            userId: currentUser.id,
          });
          setUser(currentUser);
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }
      }

      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        const timeoutTime = performance.now();
        const duration = timeoutTime - startTime;
        logger.error(
          'UserContext - CRITICAL: Auth check timed out after 60 seconds - This indicates infrastructure failure',
          {
            duration: duration.toFixed(2),
            startTime,
            timeoutTime,
            apiUrl: process.env.API_URL,
            isDemoMode: process.env.DEMO_MODE,
            recommendation:
              'Check server status, database connectivity, and network configuration',
          }
        );

        // EMERGENCY: Force completion and show error state
        setIsLoading(false);
        setIsAuthenticated(false);
        setUser(null);

        // Log critical error to console for immediate debugging
        console.error('🚨 CRITICAL INFRASTRUCTURE ISSUE DETECTED 🚨');
        console.error('Auth check taking 60+ seconds indicates:');
        console.error('1. Server is down or unresponsive');
        console.error('2. Database connection issues');
        console.error('3. Network/firewall blocking requests');
        console.error('4. Server overloaded or crashed');
        console.error('5. DNS resolution problems');
        console.error('6. CORS configuration issues');
        console.error('7. Load balancer problems');
        console.error('8. SSL/TLS handshake failures');
        console.error('');
        console.error('IMMEDIATE ACTIONS REQUIRED:');
        console.error('1. Check server status and logs');
        console.error('2. Verify database connectivity');
        console.error('3. Check network/firewall rules');
        console.error('4. Monitor server resources (CPU, memory, disk)');
        console.error('5. Verify DNS resolution');
        console.error('6. Check CORS configuration');
        console.error('7. Test API endpoints directly');
        console.error('8. Review load balancer configuration');
      }, 60000); // 60 second timeout

      try {
        logger.debug('UserContext - Starting auth check...');
        const currentUser = await authService.getCurrentUser();
        const successTime = performance.now();
        const duration = successTime - startTime;

        logger.debug('UserContext - getCurrentUser result:', currentUser);
        logger.info('UserContext - Auth check completed successfully', {
          duration: duration.toFixed(2),
          startTime,
          successTime,
        });

        clearTimeout(timeoutId); // Clear timeout on success

        if (currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true);
          logger.debug('UserContext - User authenticated successfully');
        } else {
          setUser(null);
          setIsAuthenticated(false);
          logger.debug(
            'UserContext - No user found, setting as unauthenticated'
          );
        }
      } catch (error) {
        const errorTime = performance.now();
        const duration = errorTime - startTime;

        clearTimeout(timeoutId); // Clear timeout on error
        logger.error('UserContext - Error during auth check:', error);
        logger.info('UserContext - Auth check failed', {
          duration: duration.toFixed(2),
          startTime,
          errorTime,
          error: error instanceof Error ? error.message : String(error),
        });

        // On error, assume user is not authenticated but don't clear existing user data
        // This prevents the app from getting stuck in loading state
        setIsAuthenticated(false);
        logger.debug(
          'UserContext - Auth check failed, setting as unauthenticated'
        );
      } finally {
        const finalTime = performance.now();
        const totalDuration = finalTime - startTime;

        // Always set loading to false, regardless of success/failure
        setIsLoading(false);
        logger.info('UserContext - Auth check completed', {
          totalDuration: totalDuration.toFixed(2),
          startTime,
          finalTime,
        });
      }
    };
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
      setUser(null);
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const setUserWithLogging = (newUser: User | null) => {
    logger.debug('UserContext - setUser called with:', newUser);
    setUser(newUser);
    setIsAuthenticated(!!newUser);
    logger.debug('UserContext - isAuthenticated set to:', !!newUser);
  };

  const setIsLoadingWithLogging = (loading: boolean) => {
    logger.debug('UserContext - setIsLoading called with:', loading);
    setIsLoading(loading);
  };

  // Method to refresh authentication state (useful after LoginRadius auth)
  const refreshAuth = async () => {
    logger.info('UserContext - Refreshing authentication state');
    setIsLoading(true);

    // Check for traditional authentication first (includes LoginRadius users after they're processed)
    if (authService.isAuthenticated()) {
      const currentUser = authService.getUser();
      if (currentUser) {
        logger.info('UserContext - Refreshed user found', {
          userId: currentUser.id,
        });
        setUser(currentUser);
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }
    }

    // If no user found, clear state
    setUser(null);
    setIsAuthenticated(false);
    setIsLoading(false);
  };

  return (
    <UserContext.Provider
      value={{
        user,
        setUser: setUserWithLogging,
        isAuthenticated,
        isLoading,
        setIsLoading: setIsLoadingWithLogging,
        refreshAuth,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
