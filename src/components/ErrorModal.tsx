import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignupPopup } from '../hooks/useSignupPopup';
import { useTranslation } from 'react-i18next';
import './ErrorModal.css';

interface ErrorModalProps {
  error?: string;
  description?: string;
  suggested_action?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const createErrorModalState = (
  error: string,
  description: string,
  suggested_action?: string
) => ({
  isOpen: true,
  error,
  description,
  suggested_action,
});

const ErrorModal: React.FC<ErrorModalProps> = ({
  error = 'Something went wrong',
  description = 'An error occurred.',
  suggested_action,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const { showSignupPopup } = useSignupPopup();
  const { t } = useTranslation();

  if (!isOpen) return null;

  const handleSuggestedAction = () => {
    onClose();
    switch (suggested_action) {
      case 'login':
        showSignupPopup();
        window.history.replaceState(null, '', '/?auth=login');
        break;
      case 'register':
        showSignupPopup();
        window.history.replaceState(null, '', '/?auth=register');
        break;
      case 'home':
      default:
        navigate('/');
        break;
    }
  };

  const getActionButtonText = () => {
    switch (suggested_action) {
      case 'login':
        return t("login");
      case 'register':
        return t("signUp");
      case 'home':
      default:
        return t("home");
    }
  };

  return (
    <div className="error-modal-overlay">
      <div className="error-modal">
        <div className="error-modal-header">
          <h3 className="error-modal-title">{error}</h3>
          <button className="error-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="error-modal-body">
          <p className="error-modal-description">{description}</p>
        </div>

        <div className="error-modal-footer">
          {suggested_action && (
            <button onClick={handleSuggestedAction} className="error-modal-action-button">
              {getActionButtonText()}
            </button>
          )}
          <button onClick={onClose} className="error-modal-dismiss-button">
            {t("dismiss")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;
