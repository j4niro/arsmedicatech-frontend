import {
  BuildingOfficeIcon,
  EnvelopeIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import React from 'react';
import { useTranslation } from "react-i18next";

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

interface ProfileProps {
  profile: UserProfile;
}

const Profile: React.FC<ProfileProps> = ({ profile }) => {
  const { t } = useTranslation();

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin':
        return t("Administrator");
      case 'provider':
        return t("Healthcare Provider");
      case 'patient':
        return t("Patient");
      default:
        return t(role.charAt(0).toUpperCase() + role.slice(1));
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'provider':
        return 'bg-blue-100 text-blue-800';
      case 'patient':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>{t("Profile Information")}</h1>
        <p>{t("Your account details and professional information")}</p>
      </div>

      <div className="profile-section">
        <h2>{t("Personal Information")}</h2>
        <div className="profile-grid">
          <div className="profile-item">
            <div className="profile-label">
              <UserIcon className="w-4 h-4" />
              <span>{t("Full Name")}</span>
            </div>
            <div className="profile-value">
              {profile.first_name && profile.last_name
                ? `${profile.first_name} ${profile.last_name}`
                : profile.first_name || profile.last_name || t("Not provided")}
            </div>
          </div>

          <div className="profile-item">
            <div className="profile-label">
              <span className="font-medium">{t("Username")}</span>
            </div>
            <div className="profile-value">{profile.username}</div>
          </div>

          <div className="profile-item">
            <div className="profile-label">
              <EnvelopeIcon className="w-4 h-4" />
              <span>{t("Email")}</span>
            </div>
            <div className="profile-value">{profile.email}</div>
          </div>

          <div className="profile-item">
            <div className="profile-label">
              <PhoneIcon className="w-4 h-4" />
              <span>{t("Phone")}</span>
            </div>
            <div className="profile-value">
              {profile.phone || t("Not provided")}
            </div>
          </div>

          <div className="profile-item">
            <div className="profile-label">
              <span className="font-medium">{t("Role")}</span>
            </div>
            <div className="profile-value">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(profile.role)}`}
              >
                {getRoleDisplayName(profile.role)}
              </span>
            </div>
          </div>

          <div className="profile-item">
            <div className="profile-label">
              <span className="font-medium">{t("Account Status")}</span>
            </div>
            <div className="profile-value">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  profile.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {profile.is_active ? t("Active") : t("Inactive")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {(profile.role === 'provider' || profile.role === 'admin') && (
        <div className="profile-section">
          <h2>{t("Professional Information")}</h2>
          <div className="profile-grid">
            {profile.specialty && (
              <div className="profile-item">
                <div className="profile-label">
                  <span className="font-medium">{t("Specialty")}</span>
                </div>
                <div className="profile-value">{profile.specialty}</div>
              </div>
            )}

            {profile.clinic_name && (
              <div className="profile-item">
                <div className="profile-label">
                  <BuildingOfficeIcon className="w-4 h-4" />
                  <span>{t("Clinic Name")}</span>
                </div>
                <div className="profile-value">{profile.clinic_name}</div>
              </div>
            )}

            {profile.clinic_address && (
              <div className="profile-item">
                <div className="profile-label">
                  <MapPinIcon className="w-4 h-4" />
                  <span>{t("Clinic Address")}</span>
                </div>
                <div className="profile-value">{profile.clinic_address}</div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="profile-section">
        <h2>{t("Account Information")}</h2>
        <div className="profile-grid">
          <div className="profile-item">
            <div className="profile-label">
              <span className="font-medium">{t("Member Since")}</span>
            </div>
            <div className="profile-value">
              {new Date(profile.created_at).toLocaleDateString()}
            </div>
          </div>

          <div className="profile-item">
            <div className="profile-label">
              <span className="font-medium">{t("User ID")}</span>
            </div>
            <div className="profile-value font-mono text-sm text-gray-600">
              {profile.id}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
