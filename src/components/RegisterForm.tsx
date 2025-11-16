import React, { useState } from 'react';
import authService from '../services/auth';
import './LoginForm.css';
import RoleSelect from './RoleSelect';
import { useUser } from './UserContext';
import { useTranslation } from "react-i18next";

const RegisterForm = ({
  onRegister,
  onSwitchToLogin,
  onClose,
}: {
  onRegister: (user: any) => void;
  onSwitchToLogin: () => void;
  onClose?: () => void;
}): JSX.Element => {
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    role: 'patient',
  });

  type RegisterFormFields =
    | 'username'
    | 'email'
    | 'password'
    | 'confirmPassword'
    | 'first_name'
    | 'last_name'
    | 'role';
  type ErrorsType = Partial<Record<RegisterFormFields, string>>;

  const [errors, setErrors] = useState<ErrorsType>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const { setUser } = useUser();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name as RegisterFormFields]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
    setGeneralError('');
  };

  const validateUsername = (username: string): string => {
    if (!username.trim()) return t("Username is required");
    if (username.length < 3) return t("Username must be at least 3 characters long");
    if (username.length > 30) return t("Username must be less than 30 characters");
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return t("Username can only contain letters, numbers, and underscores");
    return '';
  };

  const validateEmail = (email: string): string => {
    if (!email.trim()) return t("Email is required");
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) return t("Invalid email format");
    return '';
  };

  const validatePassword = (password: string): string => {
    if (!password) return t("Password is required");
    if (password.length < 8) return t("Password must be at least 8 characters long");
    if (!/[A-Z]/.test(password)) return t("Password must contain at least one uppercase letter");
    if (!/[a-z]/.test(password)) return t("Password must contain at least one lowercase letter");
    if (!/\d/.test(password)) return t("Password must contain at least one number");
    return '';
  };

  const validateForm = () => {
    const newErrors: ErrorsType = {};

    const usernameError = validateUsername(formData.username);
    if (usernameError) newErrors.username = usernameError;

    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t("Passwords do not match");
    }

    if (!formData.role) newErrors.role = t("Please select an account type");

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setGeneralError('');

    try {
      const result = await authService.register(
        formData.username,
        formData.email,
        formData.password,
        formData.first_name,
        formData.last_name,
        formData.role
      );

      if (result.success) {
        const userData = result.data.user || result.data;
        onRegister(userData);
      } else {
        setGeneralError(result.error || t("Registration failed"));
      }
    } catch (error) {
      console.error('Registration error:', error);
      setGeneralError(t("An unexpected error occurred"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        {onClose && (
          <button className="form-close-button" onClick={onClose}>
            ×
          </button>
        )}
        <h2>{t("Create Account")}</h2>
        <p className="login-subtitle">{t("Sign up for a new account")}</p>

        {generalError && <div className="error-message general-error">{generalError}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">{t("Username")} *</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={errors.username ? 'error' : ''}
              placeholder={t("Choose a username")}
              disabled={isLoading}
            />
            {errors.username && <span className="error-message">{errors.username}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">{t("Email")} *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'error' : ''}
              placeholder={t("Enter your email")}
              disabled={isLoading}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="first_name">{t("First Name")}</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder={t("First name")}
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="last_name">{t("Last Name")}</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder={t("Last name")}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">{t("Password")} *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? 'error' : ''}
              placeholder={t("Create a password")}
              disabled={isLoading}
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">{t("Confirm Password")} *</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={errors.confirmPassword ? 'error' : ''}
              placeholder={t("Confirm your password")}
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <span className="error-message">{errors.confirmPassword}</span>
            )}
          </div>

          <RoleSelect value={formData.role} onChange={e => handleChange(e)} disabled={isLoading} />

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? t("Creating Account...") : t("Create Account")}
          </button>
        </form>

        <div className="login-footer">
          <p>
            {t("Already have an account?")}{' '}
            <button type="button" className="link-button" onClick={onSwitchToLogin}>
              {t("Sign in")}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
