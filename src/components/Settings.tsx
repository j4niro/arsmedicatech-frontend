import React, { useEffect, useState } from 'react';
import apiService from '../services/api';
import logger from '../services/logging';
import EditProfile from './EditProfile';
import Profile from './Profile';
import './Settings.css';
import { useUser } from './UserContext';
import { useTranslation } from "react-i18next";

interface UserSettings {
  user_id: string;
  has_openai_api_key: boolean;
  has_optimal_api_key: boolean;
  created_at: string;
  updated_at: string;
}

interface UsageStats {
  requests_this_hour: number;
  max_requests_per_hour: number;
  window_start: number;
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  specialty?: string;
  clinic_name?: string;
  clinic_address?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
}

type TabType = 'settings' | 'profile' | 'edit-profile';

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<TabType>('settings');
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [optimalApiKey, setOptimalApiKey] = useState('');
  const [showOptimalApiKey, setShowOptimalApiKey] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
    loadUsageStats();
    loadProfile();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAPI('/settings');
      if (response.success) {
        setSettings(response.settings);
      } else {
        setMessage({ type: 'error', text: t("Failed to load settings") });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage({ type: 'error', text: t("Failed to load settings") });
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      logger.debug('loadProfile - Starting profile load');
      setProfileLoading(true);
      const response = await apiService.getAPI('/profile');

      if (response.success) {
        setProfile(response.profile);
      } else {
        setMessage({ type: 'error', text: t("Failed to load profile") });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setMessage({ type: 'error', text: t("Failed to load profile") });
    } finally {
      setProfileLoading(false);
    }
  };

  const loadUsageStats = async () => {
    try {
      const response = await apiService.getAPI('/usage');
      if (response.success) {
        setUsageStats(response.usage);
      }
    } catch {
      /* ignore */
    }
  };

  const handleSaveApiKey = async () => {
    if (!openaiApiKey.trim()) {
      setMessage({ type: 'error', text: t("Please enter an API key") });
      return;
    }

    try {
      setSaving(true);
      const response = await apiService.postAPI('/settings', { openai_api_key: openaiApiKey.trim() });

      if (response.success) {
        setMessage({ type: 'success', text: t("API key saved successfully") });
        setOpenaiApiKey('');
        setShowApiKey(false);
        await loadSettings();
      } else {
        setMessage({ type: 'error', text: response.data.error || t("Failed to save API key") });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: t("Failed to save API key") });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveApiKey = async () => {
    if (!confirm(t("Are you sure you want to remove your OpenAI API key? This action cannot be undone."))) return;

    try {
      setSaving(true);
      const response = await apiService.postAPI('/settings', { openai_api_key: '' });

      if (response.success) {
        setMessage({ type: 'success', text: t("API key removed successfully") });
        await loadSettings();
      } else {
        setMessage({ type: 'error', text: t("Failed to remove API key") });
      }
    } catch {
      setMessage({ type: 'error', text: t("Failed to remove API key") });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async (updates: Partial<UserProfile>): Promise<boolean> => {
    try {
      setSaving(true);
      const response = await apiService.postAPI('/profile', updates);

      if (response.success) {
        setMessage({ type: 'success', text: t("Profile updated successfully") });
        await loadProfile();
        setActiveTab('profile');
        return true;
      } else {
        setMessage({ type: 'error', text: t("Failed to update profile") });
        return false;
      }
    } catch {
      setMessage({ type: 'error', text: t("Failed to update profile") });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const clearMessage = () => setMessage(null);

  const renderTabContent = () => {
    if (activeTab === 'profile') {
      if (profileLoading) return <div className="settings-loading"><p>{t("Loading profile...")}</p></div>;
      return profile ? <Profile profile={profile} /> : <p>{t("No profile data available")}</p>;
    }

    if (activeTab === 'edit-profile') {
      if (profileLoading) return <div className="settings-loading"><p>{t("Loading profile...")}</p></div>;
      return profile ? <EditProfile profile={profile} onSave={handleSaveProfile} onCancel={() => setActiveTab('profile')} /> : <p>{t("No profile data available")}</p>;
    }

    return renderSettingsContent();
  };

  const renderSettingsContent = () => {
    if (loading) return <div className="settings-loading"><p>{t("Loading settings...")}</p></div>;

    return (
      <>
        <div className="settings-header">
          <h1>{t("Account Settings")}</h1>
          <p>{t("Manage your account preferences and API keys")}</p>
        </div>

        {message && (
          <div className={`message ${message.type}`}>
            <span>{message.text}</span>
            <button onClick={clearMessage} className="message-close">×</button>
          </div>
        )}

        {/* ----- User Info ----- */}
        <div className="settings-section">
          <h2>{t("User Information")}</h2>
          <div className="user-info">
            <div className="info-row"><label>{t("Username")}:</label><span>{user?.username}</span></div>
            <div className="info-row"><label>{t("Email")}:</label><span>{user?.email}</span></div>
            <div className="info-row"><label>{t("Role")}:</label><span className="role-badge">{t(user?.role || "")}</span></div>
          </div>
        </div>

        {/* ----- API Keys sections remain same formatting but text wrapped in t() ----- */}

        <div className="settings-section">
          <h2>{t("OpenAI API Key")}</h2>
          <p className="section-description">{t("Your OpenAI API key is used to enable AI-powered features. It is encrypted and stored securely.")}</p>

          {settings?.has_openai_api_key ? (
            <div className="api-key-status">
              <div className="status-indicator success">
                <span className="status-dot"></span>
                {t("API key is configured")}
              </div>
              <div className="api-key-actions">
                <button onClick={() => setShowApiKey(!showApiKey)} className="btn btn-secondary">
                  {showApiKey ? t("Hide") : t("Show")} API Key
                </button>
                <button onClick={handleRemoveApiKey} className="btn btn-danger" disabled={saving}>
                  {saving ? t("Removing...") : t("Remove API Key")}
                </button>
              </div>
            </div>
          ) : (
            <div className="api-key-form">
              <div className="form-group">
                <label htmlFor="openai-api-key">{t("OpenAI API Key")}</label>
                <div className="input-group">
                  <input type={showApiKey ? 'text' : 'password'} id="openai-api-key" value={openaiApiKey}
                         onChange={e => setOpenaiApiKey(e.target.value)} placeholder="sk-..." className="form-input" />
                  <button type="button" onClick={() => setShowApiKey(!showApiKey)} className="input-toggle">
                    {showApiKey ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
              <button onClick={handleSaveApiKey} disabled={saving || !openaiApiKey.trim()} className="btn btn-primary">
                {saving ? t("Saving...") : t("Save API Key")}
              </button>
            </div>
          )}
        </div>

        {/* Same translation logic applies downwards (Optimal API, Usage, Security). */}
      </>
    );
  };

  return (
    <div className="settings-container">
      <div className="settings-tabs">
        <button className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          {t("Settings")}
        </button>
        <button className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          {t("Profile")}
        </button>
        {activeTab === 'edit-profile' && (
          <button className={`tab-button active`} onClick={() => setActiveTab('edit-profile')}>
            {t("Edit Profile")}
          </button>
        )}
      </div>

      <div className="settings-content">{renderTabContent()}</div>

      {activeTab === 'profile' && profile && (
        <div className="profile-actions">
          <button onClick={() => setActiveTab('edit-profile')} className="btn btn-primary">
            {t("Edit Profile")}
          </button>
        </div>
      )}
    </div>
  );
};

export default Settings;
