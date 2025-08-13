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

  // Debug logging for state changes
  useEffect(() => {
    logger.debug('UserContext - user state changed:', user);
    logger.debug('UserContext - isAuthenticated state changed:', !!user);
  }, [user]);

  useEffect(() => {
    const checkAuth = async () => {
      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        logger.warn(
          'UserContext - Auth check timed out after 10 seconds, setting loading to false'
        );
        setIsLoading(false);
        // Don't clear user data on timeout, just stop loading
      }, 10000); // 10 second timeout

      try {
        logger.debug('UserContext - Starting auth check...');
        const currentUser = await authService.getCurrentUser();
        logger.debug('UserContext - getCurrentUser result:', currentUser);

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
        clearTimeout(timeoutId); // Clear timeout on error
        logger.error('UserContext - Error during auth check:', error);

        // On error, assume user is not authenticated but don't clear existing user data
        // This prevents the app from getting stuck in loading state
        setIsAuthenticated(false);
        logger.debug(
          'UserContext - Auth check failed, setting as unauthenticated'
        );
      } finally {
        // Always set loading to false, regardless of success/failure
        setIsLoading(false);
        logger.debug(
          'UserContext - Auth check completed, loading set to false'
        );
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
