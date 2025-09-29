import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth';
import logger from '../services/logging';
import { useUser } from './UserContext';

const LoginRadiusCallback: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasProcessed, setHasProcessed] = useState(false);
  const { refreshAuth } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    // Prevent multiple processing
    if (hasProcessed) {
      logger.debug('LoginRadiusCallback - Already processed, skipping');
      return;
    }

    const handleCallback = async () => {
      try {
        logger.info('LoginRadiusCallback - Processing callback');
        setHasProcessed(true);

        const result = await authService.handleLoginRadiusCallback();

        if (result.success && result.user) {
          logger.info(
            'LoginRadiusCallback - Authentication successful, refreshing auth state'
          );
          // Refresh the authentication state to update the UI
          await refreshAuth();

          // Clean up the URL and navigate to main app
          const newUrl = window.location.pathname.replace(
            /^\/(auth\/loginradius\/)?callback/,
            ''
          );
          window.history.replaceState({}, document.title, newUrl || '/');

          // Navigate to the main app (dashboard) using React Router
          navigate('/');
          return;
        } else {
          // Handle LoginRadius error
          logger.error(
            'LoginRadiusCallback - Authentication failed:',
            result.error
          );
          setError(result.error || 'Authentication failed');
          setIsProcessing(false);
        }
      } catch (error) {
        logger.error('LoginRadiusCallback - Callback handling failed:', error);
        setError('Failed to process authentication callback');
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [refreshAuth, navigate, hasProcessed]);

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          padding: '20px',
          textAlign: 'center',
        }}
      >
        <h2>LoginRadius Authentication Error</h2>
        <p>{error}</p>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '10px 20px',
            marginTop: '20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        padding: '20px',
        textAlign: 'center',
      }}
    >
      <h2>Processing LoginRadius authentication...</h2>
      <p>Please wait while we complete your login.</p>
    </div>
  );
};

export default LoginRadiusCallback;
