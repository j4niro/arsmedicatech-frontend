import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';
import SignupPopup from '../components/SignupPopup';
import { useUser } from '../components/UserContext';
import { API_URL } from '../env_vars';
import { useSignupPopup } from '../hooks/useSignupPopup';
import apiService from '../services/api';
import authService from '../services/auth';
import logger from '../services/logging';

// Performance Dashboard Component
const PerformanceDashboard: React.FC<{
  performanceMetrics: any;
  showPerformanceDashboard: boolean;
  setShowPerformanceDashboard: (show: boolean) => void;
  userLoading: boolean;
  isAuthenticated: boolean;
  user: any;
}> = ({
  performanceMetrics,
  showPerformanceDashboard,
  setShowPerformanceDashboard,
  userLoading,
  isAuthenticated,
  user,
}) => {
  // Only show in development or when performance monitoring is enabled
  if (
    process.env.NODE_ENV !== 'development' &&
    process.env.REACT_APP_PERFORMANCE_MONITORING !== 'true' &&
    performanceMetrics.totalLoadTime <= 5000
  ) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg text-xs font-mono z-50 max-w-md">
      <div className="flex justify-between items-center mb-2">
        <div className="font-bold text-green-400">🚀 Performance Dashboard</div>
        <button
          onClick={() => setShowPerformanceDashboard(!showPerformanceDashboard)}
          className="text-gray-400 hover:text-white text-lg transition-colors"
          title="Toggle performance dashboard"
        >
          {showPerformanceDashboard ? '−' : '+'}
        </button>
      </div>

      {/* Always show key metrics even when collapsed */}
      {!showPerformanceDashboard && (
        <div className="text-center">
          <div
            className={`text-lg font-bold ${
              performanceMetrics.totalLoadTime > 10000
                ? 'text-red-400'
                : performanceMetrics.totalLoadTime > 5000
                  ? 'text-yellow-400'
                  : 'text-green-400'
            }`}
          >
            {performanceMetrics.totalLoadTime
              ? `${(performanceMetrics.totalLoadTime / 1000).toFixed(1)}s`
              : '...'}
          </div>
          <div className="text-xs text-gray-400">Total Load Time</div>
          <div className="text-xs text-gray-400 mt-1">
            {userLoading ? '🔄 Loading' : '✅ Ready'}
          </div>
          {performanceMetrics.totalLoadTime > 10000 && (
            <div className="text-xs text-red-400 mt-1">⚠️ Critical Delay</div>
          )}
        </div>
      )}

      {showPerformanceDashboard && (
        <>
          <div className="text-xs text-gray-400 mb-2">
            {process.env.NODE_ENV === 'development'
              ? 'Development Mode'
              : 'Production Mode'}
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Component Mount:</span>
              <span className="text-blue-300">
                {new Date(
                  performanceMetrics.componentMount
                ).toLocaleTimeString()}
              </span>
            </div>

            <div className="flex justify-between">
              <span>User Context:</span>
              <span
                className={
                  performanceMetrics.userContextReady
                    ? 'text-green-300'
                    : 'text-yellow-300'
                }
              >
                {performanceMetrics.userContextReady
                  ? `${((performanceMetrics.userContextReady - performanceMetrics.componentMount) / 1000).toFixed(2)}s`
                  : 'Pending...'}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Auth Complete:</span>
              <span
                className={
                  performanceMetrics.authCheckComplete
                    ? 'text-green-300'
                    : 'text-yellow-300'
                }
              >
                {performanceMetrics.authCheckComplete
                  ? `${((performanceMetrics.authCheckComplete - performanceMetrics.componentMount) / 1000).toFixed(2)}s`
                  : 'Pending...'}
              </span>
            </div>

            <div className="flex justify-between border-t border-gray-600 pt-1">
              <span className="font-bold">Total Time:</span>
              <span
                className={`font-bold ${performanceMetrics.totalLoadTime > 5000 ? 'text-red-400' : 'text-green-400'}`}
              >
                {performanceMetrics.totalLoadTime
                  ? `${(performanceMetrics.totalLoadTime / 1000).toFixed(2)}s`
                  : 'Calculating...'}
              </span>
            </div>
          </div>

          {performanceMetrics.bottlenecks.length > 0 && (
            <div className="mt-3 pt-2 border-t border-gray-600">
              <div className="font-bold text-yellow-400 mb-1">
                ⚠️ Bottlenecks:
              </div>
              <div className="space-y-1">
                {performanceMetrics.bottlenecks.map(
                  (bottleneck: string, index: number) => (
                    <div key={index} className="text-yellow-300 text-xs">
                      {bottleneck}
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          <div className="mt-3 pt-2 border-t border-gray-600">
            <div className="text-xs text-gray-400">
              <div>Status: {userLoading ? '🔄 Loading' : '✅ Ready'}</div>
              <div>Auth: {isAuthenticated ? '✅ Yes' : '❌ No'}</div>
              <div>User: {user ? '✅ Loaded' : '❌ None'}</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Performance Warning Banner Component
const PerformanceWarningBanner: React.FC<{
  performanceMetrics: any;
  setShowPerformanceDashboard: (show: boolean) => void;
}> = ({ performanceMetrics, setShowPerformanceDashboard }) => {
  if (performanceMetrics.totalLoadTime <= 10000) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-600 text-white p-2 text-center z-50">
      <div className="flex items-center justify-center space-x-2">
        <span>⚠️</span>
        <span className="font-bold">Performance Issue Detected</span>
        <span>•</span>
        <span>
          Load Time: {(performanceMetrics.totalLoadTime / 1000).toFixed(1)}s
        </span>
        <span>•</span>
        <span>Check console for details</span>
        <button
          onClick={() => setShowPerformanceDashboard(true)}
          className="ml-4 px-2 py-1 bg-red-700 hover:bg-red-800 rounded text-xs transition-colors"
        >
          Show Details
        </button>
      </div>
    </div>
  );
};

// Loading Component
const LoadingSpinner: React.FC<{ message?: string }> = ({
  message = 'Loading...',
}) => (
  <div className="loading-container">
    <div className="loading-spinner"></div>
    <p>{message}</p>
  </div>
);

// Authenticated Dashboard Component
const AuthenticatedDashboard: React.FC<{ user: any; onLogout: () => void }> = ({
  user,
  onLogout,
}) => {
  const dashboardData = {
    totalPatients: '1,083',
    totalIncome: '723.43',
    appointments: '324',
    reports: '1,083',
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Dashboard</h1>
          <p>Welcome back, {user.first_name || user.username}!</p>
        </div>
        <div className="user-info">
          <span className="user-role">{user.role}</span>
          <button onClick={onLogout} className="logout-button">
            Logout
          </button>
        </div>
      </div>
      <div className="dashboard-grid">
        <div className="card stats-card">
          <div className="card-title">Total Patients</div>
          <h2>{dashboardData.totalPatients}</h2>
          <p>+2.7%</p>
        </div>
        <div className="card stats-card">
          <div className="card-title">Total Income</div>
          <h2>${dashboardData.totalIncome}</h2>
          <p>+2.7%</p>
        </div>
        <div className="card stats-card">
          <div className="card-title">Appointments</div>
          <h2>{dashboardData.appointments}</h2>
          <p>+2.7%</p>
        </div>
        <div className="card stats-card">
          <div className="card-title">Reports</div>
          <h2>{dashboardData.reports}</h2>
          <p>+2.7%</p>
        </div>
        <div className="card appointments-card">
          <div className="card-title">Appointments</div>
          {/* This would be a list rendered from data */}
        </div>
        <div className="card activity-card">
          <div className="card-title">Recent Activity</div>
          {/* This would be a list rendered from data */}
        </div>
      </div>
    </div>
  );
};

// Public Dashboard Component
const PublicDashboard: React.FC<{ showSignupPopup: () => void }> = ({
  showSignupPopup,
}) => {
  const dashboardData = {
    totalPatients: '1,083',
    totalIncome: '723.43',
    appointments: '324',
    reports: '1,083',
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Dashboard</h1>
          <p>Welcome to ArsMedicaTech - Your Healthcare Management Solution</p>
        </div>
        <div className="user-info">
          <span className="user-role">Guest</span>
          <button onClick={showSignupPopup} className="signup-button">
            Sign Up
          </button>
        </div>
      </div>
      <div className="dashboard-grid">
        <div className="card stats-card">
          <div className="card-title">Total Patients</div>
          <h2>{dashboardData.totalPatients}</h2>
          <p>+2.7%</p>
        </div>
        <div className="card stats-card">
          <div className="card-title">Total Income</div>
          <h2>${dashboardData.totalIncome}</h2>
          <p>+2.7%</p>
        </div>
        <div className="card stats-card">
          <div className="card-title">Appointments</div>
          <h2>{dashboardData.appointments}</h2>
          <p>+2.7%</p>
        </div>
        <div className="card stats-card">
          <div className="card-title">Reports</div>
          <h2>{dashboardData.reports}</h2>
          <p>+2.7%</p>
        </div>
        <div className="card appointments-card">
          <div className="card-title">Appointments</div>
          <div className="guest-notice">
            <p>Sign up to view and manage appointments</p>
            <button onClick={showSignupPopup} className="guest-action-button">
              Get Started
            </button>
          </div>
        </div>
        <div className="card activity-card">
          <div className="card-title">Recent Activity</div>
          <div className="guest-notice">
            <p>Sign up to view recent activity</p>
            <button onClick={showSignupPopup} className="guest-action-button">
              Get Started
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Component
const Dashboard: React.FC = () => {
  const { user, isAuthenticated, setUser, isLoading: userLoading } = useUser();
  const [showLogin, setShowLogin] = useState(true);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [showPerformanceDashboard, setShowPerformanceDashboard] =
    useState(true);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    componentMount: Date.now(),
    userContextReady: 0,
    authCheckComplete: 0,
    totalLoadTime: 0,
    bottlenecks: [] as string[],
  });

  const {
    isPopupOpen,
    showSignupPopup,
    hideSignupPopup: originalHideSignupPopup,
  } = useSignupPopup();
  const [usersExist, setUsersExist] = useState<boolean | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Performance monitoring
  useEffect(() => {
    const startTime = performance.now();
    logger.info('Dashboard - Performance monitoring started', { startTime });

    // Monitor when user context becomes ready
    if (!userLoading) {
      const userContextTime = performance.now();
      const userContextDuration = userContextTime - startTime;
      logger.info('Dashboard - User context ready', {
        duration: userContextDuration,
        userLoading,
        isAuthenticated,
        hasUser: !!user,
      });

      setPerformanceMetrics(prev => ({
        ...prev,
        userContextReady: userContextTime,
        bottlenecks: [
          ...prev.bottlenecks,
          `User context: ${userContextDuration.toFixed(2)}ms`,
        ],
      }));
    }
  }, [userLoading, isAuthenticated, user]);

  // Monitor when auth check completes
  useEffect(() => {
    if (!userLoading && !loadingTimeout) {
      const authCompleteTime = performance.now();
      const authDuration = authCompleteTime - performanceMetrics.componentMount;
      logger.info('Dashboard - Auth check completed', {
        duration: authDuration,
        userLoading,
        loadingTimeout,
      });

      setPerformanceMetrics(prev => ({
        ...prev,
        authCheckComplete: authCompleteTime,
        totalLoadTime: authDuration,
        bottlenecks: [
          ...prev.bottlenecks,
          `Auth check: ${authDuration.toFixed(2)}ms`,
        ],
      }));
    }
  }, [userLoading, loadingTimeout, performanceMetrics.componentMount]);

  // Performance bottleneck detection
  useEffect(() => {
    const checkPerformance = () => {
      const currentTime = performance.now();
      const totalTime = currentTime - performanceMetrics.componentMount;

      if (totalTime > 5000) {
        logger.warn(
          'Dashboard - Performance warning: Component taking longer than 5 seconds',
          {
            totalTime: totalTime.toFixed(2),
            userLoading,
            loadingTimeout,
            bottlenecks: performanceMetrics.bottlenecks,
          }
        );
      }

      if (totalTime > 10000) {
        logger.error(
          'Dashboard - Performance critical: Component taking longer than 10 seconds',
          {
            totalTime: totalTime.toFixed(2),
            userLoading,
            loadingTimeout,
            bottlenecks: performanceMetrics.bottlenecks,
          }
        );
      }
    };

    const interval = setInterval(checkPerformance, 1000);
    return () => clearInterval(interval);
  }, [
    performanceMetrics.componentMount,
    performanceMetrics.bottlenecks,
    userLoading,
    loadingTimeout,
  ]);

  // Final performance summary when loading completes
  useEffect(() => {
    if (!userLoading && performanceMetrics.totalLoadTime > 0) {
      const summary = {
        totalLoadTime: `${(performanceMetrics.totalLoadTime / 1000).toFixed(2)}s`,
        userContextTime: performanceMetrics.userContextReady
          ? `${((performanceMetrics.userContextReady - performanceMetrics.componentMount) / 1000).toFixed(2)}s`
          : 'N/A',
        authCheckTime: performanceMetrics.authCheckComplete
          ? `${((performanceMetrics.authCheckComplete - performanceMetrics.componentMount) / 1000).toFixed(2)}s`
          : 'N/A',
        bottlenecks: performanceMetrics.bottlenecks,
        finalStatus: {
          userLoading,
          isAuthenticated,
          hasUser: !!user,
          loadingTimeout,
        },
      };

      logger.info('Dashboard - Performance Summary', summary);

      // Log to console for easy debugging
      console.group('🚀 Dashboard Performance Summary');
      console.log('Total Load Time:', summary.totalLoadTime);
      console.log('User Context Ready:', summary.userContextTime);
      console.log('Auth Check Complete:', summary.authCheckTime);
      console.log('Bottlenecks:', summary.bottlenecks);
      console.log('Final Status:', summary.finalStatus);
      console.groupEnd();

      // Performance recommendations
      if (performanceMetrics.totalLoadTime > 5000) {
        console.warn('⚠️ Performance Issue Detected!');
        if (performanceMetrics.totalLoadTime > 10000) {
          console.error('🚨 CRITICAL: Load time exceeds 10 seconds!');
        }
        console.log('Recommendations:');
        console.log('1. Check network connectivity to API endpoints');
        console.log('2. Verify server response times');
        console.log('3. Check for authentication delays');
        console.log('4. Review browser console for errors');
        console.log('5. Check if demo mode is properly configured');
      }
    }
  }, [userLoading, performanceMetrics, isAuthenticated, user, loadingTimeout]);

  // Additional timeout fallback for loading state
  useEffect(() => {
    if (userLoading) {
      const timeoutId = setTimeout(() => {
        logger.warn(
          'Dashboard - Loading timeout reached, forcing loading state to false'
        );
        setLoadingTimeout(true);
      }, 15000); // 15 second timeout as backup

      return () => clearTimeout(timeoutId);
    } else {
      setLoadingTimeout(false);
    }
  }, [userLoading]);

  // Network connectivity check
  useEffect(() => {
    const checkNetworkConnectivity = async () => {
      try {
        logger.debug('Dashboard - Testing network connectivity to API');
        const response = await fetch(`${API_URL}/api/auth/me`, {
          method: 'HEAD',
          mode: 'cors',
        });
        logger.debug(
          'Dashboard - Network connectivity test result:',
          response.status
        );
      } catch (error) {
        logger.error('Dashboard - Network connectivity test failed:', error);
        if (error instanceof TypeError && error.message.includes('fetch')) {
          logger.error(
            'Dashboard - This appears to be a CORS or network configuration issue'
          );
        }
      }
    };

    // Only run this check if we're having loading issues
    if (userLoading) {
      checkNetworkConnectivity();
    }
  }, [userLoading, API_URL]);

  // Keyboard shortcut for performance dashboard
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ctrl+Shift+P to toggle performance dashboard
      if (event.ctrlKey && event.shiftKey && event.key === 'P') {
        event.preventDefault();
        setShowPerformanceDashboard(prev => !prev);
        logger.info(
          'Dashboard - Performance dashboard toggled via keyboard shortcut'
        );
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Custom hideSignupPopup that also clears auth query parameter
  const hideSignupPopup = () => {
    originalHideSignupPopup();
    // Clear auth query parameter
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('auth');
    window.history.replaceState(null, '', `?${newSearchParams.toString()}`);
  };

  // Check for auth query parameter and automatically show the appropriate form
  useEffect(() => {
    const authParam = searchParams.get('auth');
    if (authParam === 'login' && !isAuthenticated) {
      setShowLogin(true);
      showSignupPopup();
    } else if (authParam === 'register' && !isAuthenticated) {
      setShowLogin(false);
      showSignupPopup();
    }
  }, [searchParams, isAuthenticated, showSignupPopup]);

  // Check if any users exist
  useEffect(() => {
    const checkUsersExist = async () => {
      try {
        const response = await apiService.checkUsersExist();
        setUsersExist(response.users_exist);
      } catch (error) {
        // If error (e.g. 403), assume users exist to avoid exposing admin setup
        setUsersExist(true);
      }
    };

    checkUsersExist();
  }, []);

  const handleLogin = (userData: any): void => {
    logger.debug('Dashboard handleLogin called with:', userData);
    const userForContext = {
      id: userData.id.toString(),
      username: userData.username,
      email: userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      role: userData.role,
    };
    logger.debug('Setting user in context:', userForContext);
    setUser(userForContext);
    logger.debug('User set in context successfully');

    // Close the popup after successful login
    hideSignupPopup();
    logger.debug('Signup popup closed after login');
  };

  const handleRegister = (userData: any): void => {
    logger.debug('Dashboard handleRegister called with:', userData);
    const userForContext = {
      id: userData.id.toString(),
      username: userData.username,
      email: userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      role: userData.role,
    };
    logger.debug('Setting user in context:', userForContext);
    setUser(userForContext);
    logger.debug('User set in context successfully');

    // Close the popup after successful registration
    hideSignupPopup();
    logger.debug('Signup popup closed after registration');

    // Redirect admin to organization creation page
    if (userForContext.role === 'admin') {
      navigate('/organization');
    }
  };

  const handleLogout = async () => {
    logger.debug('Dashboard handleLogout called');
    await authService.logout();
    setUser(null);
    logger.debug('User cleared from context');
    window.location.href = '/';
  };

  const handleSetupAdmin = async () => {
    const result = await authService.setupDefaultAdmin();
    if (result.success) {
      alert('Default admin user created! Username: admin, Password: Admin123!');
    } else {
      alert('Error creating admin user: ' + result.error);
    }
  };

  // Render loading state
  if (userLoading && !loadingTimeout) {
    return (
      <>
        <PerformanceWarningBanner
          performanceMetrics={performanceMetrics}
          setShowPerformanceDashboard={setShowPerformanceDashboard}
        />
        <PerformanceDashboard
          performanceMetrics={performanceMetrics}
          showPerformanceDashboard={showPerformanceDashboard}
          setShowPerformanceDashboard={setShowPerformanceDashboard}
          userLoading={userLoading}
          isAuthenticated={isAuthenticated}
          user={user}
        />
        <LoadingSpinner message="Loading..." />
      </>
    );
  }

  // Render timeout state
  if (loadingTimeout) {
    return (
      <>
        <PerformanceWarningBanner
          performanceMetrics={performanceMetrics}
          setShowPerformanceDashboard={setShowPerformanceDashboard}
        />
        <PerformanceDashboard
          performanceMetrics={performanceMetrics}
          showPerformanceDashboard={showPerformanceDashboard}
          setShowPerformanceDashboard={setShowPerformanceDashboard}
          userLoading={userLoading}
          isAuthenticated={isAuthenticated}
          user={user}
        />
        <LoadingSpinner message="Loading timeout - proceeding without user data..." />
      </>
    );
  }

  // Render authenticated dashboard
  if (isAuthenticated && user) {
    logger.debug('Dashboard - showing authenticated dashboard');
    return (
      <>
        <PerformanceWarningBanner
          performanceMetrics={performanceMetrics}
          setShowPerformanceDashboard={setShowPerformanceDashboard}
        />
        <PerformanceDashboard
          performanceMetrics={performanceMetrics}
          showPerformanceDashboard={showPerformanceDashboard}
          setShowPerformanceDashboard={setShowPerformanceDashboard}
          userLoading={userLoading}
          isAuthenticated={isAuthenticated}
          user={user}
        />
        <AuthenticatedDashboard user={user} onLogout={handleLogout} />
        <SignupPopup isOpen={isPopupOpen} onClose={hideSignupPopup} />
      </>
    );
  }

  // Render public dashboard
  logger.debug('Dashboard - showing public dashboard');
  return (
    <>
      <PerformanceWarningBanner
        performanceMetrics={performanceMetrics}
        setShowPerformanceDashboard={setShowPerformanceDashboard}
      />
      <PerformanceDashboard
        performanceMetrics={performanceMetrics}
        showPerformanceDashboard={showPerformanceDashboard}
        setShowPerformanceDashboard={setShowPerformanceDashboard}
        userLoading={userLoading}
        isAuthenticated={isAuthenticated}
        user={user}
      />
      <PublicDashboard showSignupPopup={showSignupPopup} />
      <SignupPopup isOpen={isPopupOpen} onClose={hideSignupPopup} />

      {/* Show auth forms when popup is triggered */}
      {isPopupOpen && (
        <div className="auth-overlay">
          <div className="auth-container">
            {showLogin ? (
              <LoginForm
                onLogin={handleLogin}
                onSwitchToRegister={() => setShowLogin(false)}
                onClose={hideSignupPopup}
              />
            ) : (
              <RegisterForm
                onRegister={handleRegister}
                onSwitchToLogin={() => setShowLogin(true)}
                onClose={hideSignupPopup}
              />
            )}

            {/* Admin setup button - only show if no users exist */}
            {usersExist === false && (
              <div className="admin-setup">
                <button
                  onClick={handleSetupAdmin}
                  className="setup-admin-button"
                >
                  Setup Default Admin
                </button>
                <p className="setup-note">
                  Use this to create the first admin user if no users exist in
                  the system.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;
