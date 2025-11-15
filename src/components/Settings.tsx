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

  /* -------------------------------------------------------
     LOAD SETTINGS
  -------------------------------------------------------- */
  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAPI('/settings');

      if (response.success) setSettings(response.settings);
      else setMessage({ type: 'error', text: t("loadFailed") });

    } catch (error) {
      setMessage({ type: 'error', text: t("loadFailed") });
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------------------------------
     LOAD PROFILE
  -------------------------------------------------------- */
  const loadProfile = async () => {
    try {
      setProfileLoading(true);
      const response = await apiService.getAPI('/profile');

      if (response.success) setProfile(response.profile);
      else setMessage({ type: 'error', text: t("loadFailed") });

    } catch {
      setMessage({ type: 'error', text: t("loadFailed") });
    } finally {
      setProfileLoading(false);
    }
  };

  /* -------------------------------------------------------
     LOAD USAGE STATS
  -------------------------------------------------------- */
  const loadUsageStats = async () => {
    try {
      const response = await apiService.getAPI('/usage');
      if (response.success) setUsageStats(response.usage);
    } catch {
      /* not critical */
    }
  };

  /* -------------------------------------------------------
     SAVE OPENAI API KEY
  -------------------------------------------------------- */
  const handleSaveApiKey = async () => {
    if (!openaiApiKey.trim()) {
      setMessage({ type: 'error', text: t("enterApiKey") });
      return;
    }

    try {
      setSaving(true);
      const response = await apiService.postAPI('/settings', {
        openai_api_key: openaiApiKey.trim(),
      });

      if (response.success) {
        setMessage({ type: 'success', text: t("apiSaved") });
        setOpenaiApiKey('');
        setShowApiKey(false);
        await loadSettings();
      } else {
        setMessage({ type: 'error', text: response.data.error || t("apiSaveFailed") });
      }

    } catch {
      setMessage({ type: 'error', text: t("apiSaveFailed") });
    } finally {
      setSaving(false);
    }
  };

  /* -------------------------------------------------------
     REMOVE OPENAI API KEY
  -------------------------------------------------------- */
  const handleRemoveApiKey = async () => {
    if (!confirm(t("removeOpenaiConfirm"))) return;

    try {
      setSaving(true);
      const response = await apiService.postAPI('/settings', { openai_api_key: '' });

      if (response.success) {
        setMessage({ type: 'success', text: t("apiRemoved") });
        await loadSettings();
      } else {
        setMessage({ type: 'error', text: t("apiRemoveFailed") });
      }

    } catch {
      setMessage({ type: 'error', text: t("apiRemoveFailed") });
    } finally {
      setSaving(false);
    }
  };

  /* -------------------------------------------------------
     SAVE OPTIMAL API KEY
  -------------------------------------------------------- */
  const handleSaveOptimalApiKey = async () => {
    if (!optimalApiKey.trim()) {
      setMessage({ type: 'error', text: t("enterOptimalApiKey") });
      return;
    }

    try {
      setSaving(true);

      const response = await apiService.postAPI('/settings', {
        optimal_api_key: optimalApiKey.trim(),
      });

      if (response.success) {
        setMessage({ type: 'success', text: t("optimalSaved") });
        setOptimalApiKey('');
        setShowOptimalApiKey(false);
        await loadSettings();
      } else {
        setMessage({ type: 'error', text: t("optimalSaveFailed") });
      }

    } catch {
      setMessage({ type: 'error', text: t("optimalSaveFailed") });
    } finally {
      setSaving(false);
    }
  };

  /* -------------------------------------------------------
     REMOVE OPTIMAL API KEY
  -------------------------------------------------------- */
  const handleRemoveOptimalApiKey = async () => {
    if (!confirm(t("removeOptimalConfirm"))) return;

    try {
      setSaving(true);

      const response = await apiService.postAPI('/settings', {
        optimal_api_key: '',
      });

      if (response.success) {
        setMessage({ type: 'success', text: t("optimalRemoved") });
        await loadSettings();
      } else {
        setMessage({ type: 'error', text: t("optimalRemoveFailed") });
      }

    } catch {
      setMessage({ type: 'error', text: t("optimalRemoveFailed") });
    } finally {
      setSaving(false);
    }
  };

  /* -------------------------------------------------------
     UPDATE PROFILE
  -------------------------------------------------------- */
  const handleSaveProfile = async (
    updates: Partial<UserProfile>,
  ): Promise<boolean> => {
    try {
      setSaving(true);
      const response = await apiService.postAPI('/profile', updates);

      if (response.success) {
        setMessage({ type: 'success', text: t("updated") });
        await loadProfile();
        setActiveTab('profile');
        return true;
      } else {
        setMessage({ type: 'error', text: t("updateFailed") });
        return false;
      }

    } catch {
      setMessage({ type: 'error', text: t("updateFailed") });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const clearMessage = () => setMessage(null);

  /* -------------------------------------------------------
     RENDER TAB CONTENT
  -------------------------------------------------------- */
  const renderTabContent = () => {
    if (activeTab === 'profile') {
      if (profileLoading) return <div className="settings-loading"><p>{t("loading")}</p></div>;
      return profile ? (
        <Profile profile={profile} />
      ) : (
        <p>{t("profile.noData")}</p>
      );
    }

    if (activeTab === 'edit-profile') {
      if (profileLoading) return <div className="settings-loading"><p>{t("loading")}</p></div>;
      return profile ? (
        <EditProfile
          profile={profile}
          onSave={handleSaveProfile}
          onCancel={() => setActiveTab('profile')}
        />
      ) : (
        <p>{t("noData")}</p>
      );
    }

    return renderSettingsContent();
  };

  /* -------------------------------------------------------
     SETTINGS TAB CONTENT
  -------------------------------------------------------- */
  const renderSettingsContent = () => {
    if (loading) return <div className="settings-loading"><p>{t("loading")}</p></div>;

    return (
      <>
        <div className="settings-header">
          <h1>{t("title")}</h1>
          <p>{t("description")}</p>
        </div>

        {message && (
          <div className={`message ${message.type}`}>
            <span>{message.text}</span>
            <button onClick={clearMessage} className="message-close">×</button>
          </div>
        )}

        {/* USER INFO */}
        <div className="settings-section">
          <h2>{t("userInfo")}</h2>
          <div className="user-info">
            <div className="info-row"><label>{t("Username")}:</label> <span>{user?.username}</span></div>
            <div className="info-row"><label>{t("Email")}:</label> <span>{user?.email}</span></div>
            <div className="info-row"><label>{t("Role")}:</label> <span className="role-badge">{t(user?.role || "")}</span></div>
          </div>
        </div>

        {/* OPENAI API KEY */}
        <div className="settings-section">
          <h2>{t("openaiTitle")}</h2>
          <p className="section-description">{t("openaiDescription")}</p>

          {settings?.has_openai_api_key ? (
            <div className="api-key-status">
              <div className="status-indicator success">
                <span className="status-dot"></span>
                {t("apiConfigured")}
              </div>

              <div className="api-key-actions">
                <button className="btn btn-secondary" onClick={() => setShowApiKey(!showApiKey)}>
                  {showApiKey ? t("Hide") : t("Show")} API Key
                </button>

                <button className="btn btn-danger" onClick={handleRemoveApiKey} disabled={saving}>
                  {saving ? t("Removing...") : t("removeOpenai")}
                </button>
              </div>
            </div>
          ) : (
            <div className="api-key-form">
              <div className="form-group">
                <label>{t("openaiTitle")}</label>
                <div className="input-group">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={openaiApiKey}
                    onChange={e => setOpenaiApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="form-input"
                  />
                  <button type="button" className="input-toggle" onClick={() => setShowApiKey(!showApiKey)}>
                    {showApiKey ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>

              <button className="btn btn-primary" onClick={handleSaveApiKey} disabled={saving || !openaiApiKey.trim()}>
                {saving ? t("Saving...") : t("saveOpenai")}
              </button>
            </div>
          )}
        </div>

        {/* OPTIMAL API KEY */}
        <div className="settings-section">
          <h2>{t("optimalTitle")}</h2>
          <p className="section-description">{t("optimalDescription")}</p>

          {settings?.has_optimal_api_key ? (
            <div className="api-key-status">
              <div className="status-indicator success">
                <span className="status-dot"></span>
                {t("optimalConfigured")}
              </div>

              <div className="api-key-actions">
                <button className="btn btn-secondary" onClick={() => setShowOptimalApiKey(!showOptimalApiKey)}>
                  {showOptimalApiKey ? t("Hide") : t("Show")} API Key
                </button>

                <button className="btn btn-danger" onClick={handleRemoveOptimalApiKey} disabled={saving}>
                  {saving ? t("Removing...") : t("removeOptimal")}
                </button>
              </div>
            </div>
          ) : (
            <div className="api-key-form">
              <div className="form-group">
                <label>{t("optimalTitle")}</label>
                <div className="input-group">
                  <input
                    type={showOptimalApiKey ? "text" : "password"}
                    value={optimalApiKey}
                    onChange={e => setOptimalApiKey(e.target.value)}
                    placeholder={t("optimalPlaceholder")}
                    className="form-input"
                  />
                  <button type="button" className="input-toggle" onClick={() => setShowOptimalApiKey(!showOptimalApiKey)}>
                    {showOptimalApiKey ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>

              <button className="btn btn-primary" onClick={handleSaveOptimalApiKey} disabled={saving || !optimalApiKey.trim()}>
                {saving ? t("Saving...") : t("saveOptimal")}
              </button>
            </div>
          )}
        </div>

        {/* USAGE */}
        <div className="settings-section">
          <h2>{t("apiUsage")}</h2>
          <p className="section-description">{t("apiUsageDesc")}</p>

          {usageStats && (
            <div className="usage-info">
              <div className="info-row">
                <label>{t("requests")}</label>
                <span>{usageStats.requests_this_hour} / {usageStats.max_requests_per_hour}</span>
              </div>

              <div className="info-row">
                <label>{t("resetWindow")}</label>
                <span>
                  {new Date(usageStats.window_start * 1000 + 3600000).toLocaleTimeString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* SECURITY */}
        <div className="settings-section">
          <h2>{t("security")}</h2>
          <p className="section-description">{t("securityDescription")}</p>

          <div className="security-info">
            <div className="info-row">
              <label>{t("createdAt")}</label>
              <span>{settings?.created_at ? new Date(settings.created_at).toLocaleDateString() : 'N/A'}</span>
            </div>

            <div className="info-row">
              <label>{t("updatedAt")}</label>
              <span>{settings?.updated_at ? new Date(settings.updated_at).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
        </div>
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
          <button className="tab-button active" onClick={() => setActiveTab('edit-profile')}>
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
