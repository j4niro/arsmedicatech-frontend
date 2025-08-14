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

      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        const timeoutTime = performance.now();
        const duration = timeoutTime - startTime;
        logger.warn(
          'UserContext - Auth check timed out after 60 seconds, setting loading to false',
          { duration: duration.toFixed(2), startTime, timeoutTime }
        );
        setIsLoading(false);
        // Don't clear user data on timeout, just stop loading
      }, 60000); // 60 second timeout to catch the full delay

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

  const setUserWithLogging = (newUser: User | null) => {
    logger.debug('UserContext - setUser called with:', newUser);
    setUser(newUser);
    setIsAuthenticated(!!newUser);
    logger.debug('UserContext - isAuthenticated set to:', !!newUser);
  };

  return (
    <UserContext.Provider
      value={{ user, setUser: setUserWithLogging, isAuthenticated, isLoading }}
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
