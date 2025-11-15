import React from 'react';
import { GOOGLE_LOGO } from '../env_vars';
import { useTranslation } from 'react-i18next';

interface GoogleAuthButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  onClick,
  children,
  className,
}) => {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={onClick}
      className={className || 'popup-google-button'}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fff',
        border: '1px solid #ccc',
        borderRadius: 4,
        padding: '8px 16px',
        gap: 10,
      }}
    >
      <img src={GOOGLE_LOGO} alt="Google" style={{ width: 22, height: 22 }} />
      {children || t("continueWithGoogle")}
    </button>
  );
};

export default GoogleAuthButton;
