import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import authService from '../services/auth';
import logger from '../services/logging';
import GoogleAuthButton from './GoogleAuthButton';
import './LoginForm.css';

const LoginForm = ({
  onLogin,
  onSwitchToRegister,
  onClose,
}: {
  onLogin: (user: any) => void;
  onSwitchToRegister: () => void;
  onClose: () => void;
}): JSX.Element => {

  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'patient',
  });

  interface Errors {
    username?: string;
    password?: string;
  }

  const [errors, setErrors] = useState<Errors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
    setGeneralError('');
  };

  const validateForm = () => {
    const newErrors: Errors = {};

    if (!formData.username.trim()) {
      newErrors.username = t("usernameRequired");
    }

    if (!formData.password) {
      newErrors.password = t("passwordRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setGeneralError('');

    try {
      logger.debug('Attempting login with:', formData.username);

      const result = await authService.login(
        formData.username,
        formData.password
      );

      logger.debug('Login result:', result);

      if (result.success) {
        const userData = result.data.user || result.data;
        onLogin(userData);
      } else {
        setGeneralError(result.error || t("unexpectedError"));
      }
    } catch (error) {
      console.error('Login error:', error);
      setGeneralError(t("unexpectedError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignin = () => {
    const url = authService.getFederatedSignInUrl('patient', 'signin');
    window.location.assign(url);
  };

  return (
    <div className="login-container">
      <div className="login-form">
        {onClose && (
          <button className="form-close-button" onClick={onClose}>
            ×
          </button>
        )}

        <h2>{t("welcomeBack")}</h2>
        <p className="login-subtitle">{t("signInToAccount")}</p>

        {generalError && (
          <div className="error-message general-error">{generalError}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">{t("username")}</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={errors.username ? 'error' : ''}
              placeholder={t("enterUsername")}
              disabled={isLoading}
            />
            {errors.username && (
              <span className="error-message">{errors.username}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">{t("password")}</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? 'error' : ''}
              placeholder={t("enterPassword")}
              disabled={isLoading}
            />
            {errors.password && (
              <span className="error-message">{errors.password}</span>
            )}
          </div>

          <GoogleAuthButton onClick={handleGoogleSignin}>
            {t("signInWithGoogle")}
          </GoogleAuthButton>

          <button
            type="submit"
            className="login-button"
            disabled={isLoading}
            data-testid="login-submit"
          >
            {isLoading ? t("signingIn") : t("signIn")}
          </button>
        </form>

        <div className="login-footer">
          <p>
            {t("noAccount")}{' '}
            <button
              type="button"
              className="link-button"
              onClick={onSwitchToRegister}
            >
              {t("signUp")}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};

export default LoginForm;
