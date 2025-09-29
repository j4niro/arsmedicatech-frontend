import React from 'react';
import authService from '../services/auth';
import logger from '../services/logging';

interface LoginRadiusAuthButtonProps {
  role?: string;
  intent?: 'signin' | 'signup';
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

const LoginRadiusAuthButton: React.FC<LoginRadiusAuthButtonProps> = ({
  role = 'patient',
  intent = 'signin',
  children,
  className = '',
  disabled = false,
}) => {
  const handleLoginRadiusAuth = () => {
    if (disabled) return;

    try {
      logger.info('Initiating LoginRadius authentication', { role, intent });

      const authUrl = authService.initiateLoginRadiusAuth(role);

      if (authUrl) {
        logger.debug('Redirecting to LoginRadius:', authUrl);
        window.location.assign(authUrl);
      } else {
        logger.error('Failed to generate LoginRadius auth URL');
        // You could show an error message to the user here
        alert(
          'LoginRadius authentication is not available. Please check your configuration.'
        );
      }
    } catch (error) {
      logger.error('LoginRadius authentication initiation failed:', error);
      alert('Failed to initiate LoginRadius authentication. Please try again.');
    }
  };

  return (
    <button
      type="button"
      onClick={handleLoginRadiusAuth}
      className={`loginradius-auth-button ${className}`}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px 24px',
        border: '2px solid #007bff',
        borderRadius: '8px',
        backgroundColor: '#007bff',
        color: 'white',
        fontSize: '16px',
        fontWeight: '500',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.2s ease',
        textDecoration: 'none',
        minHeight: '48px',
        width: '100%',
        marginBottom: '12px',
      }}
      onMouseEnter={e => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = '#0056b3';
          e.currentTarget.style.borderColor = '#0056b3';
        }
      }}
      onMouseLeave={e => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = '#007bff';
          e.currentTarget.style.borderColor = '#007bff';
        }
      }}
    >
      {children}
    </button>
  );
};

export default LoginRadiusAuthButton;
