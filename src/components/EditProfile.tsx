import {
  BuildingOfficeIcon,
  EnvelopeIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import React, { useState } from "react";
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

interface EditProfileProps {
  profile: UserProfile;
  onSave: (updates: Partial<UserProfile>) => Promise<boolean>;
  onCancel: () => void;
}

const EditProfile: React.FC<EditProfileProps> = ({
  profile,
  onSave,
  onCancel,
}) => {
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    first_name: profile.first_name || "",
    last_name: profile.last_name || "",
    phone: profile.phone || "",
    specialty: profile.specialty || "",
    clinic_name: profile.clinic_name || "",
    clinic_address: profile.clinic_address || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const isProvider = profile.role === "provider" || profile.role === "admin";

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.phone && formData.phone.trim()) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      const cleanPhone = formData.phone.replace(/[\s\-\(\)]/g, "");
      if (!phoneRegex.test(cleanPhone)) {
        newErrors.phone = t("invalidPhone");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    setMessage(null);

    try {
      const updates: Partial<UserProfile> = {};

      if (formData.first_name !== profile.first_name) updates.first_name = formData.first_name.trim();
      if (formData.last_name !== profile.last_name) updates.last_name = formData.last_name.trim();
      if (formData.phone !== profile.phone) updates.phone = formData.phone.trim();
      if (isProvider) {
        if (formData.specialty !== profile.specialty) updates.specialty = formData.specialty.trim();
        if (formData.clinic_name !== profile.clinic_name) updates.clinic_name = formData.clinic_name.trim();
        if (formData.clinic_address !== profile.clinic_address) updates.clinic_address = formData.clinic_address.trim();
      }

      if (Object.keys(updates).length === 0) {
        setMessage({ type: "error", text: t("noChanges") });
        setSaving(false);
        return;
      }

      const success = await onSave(updates);

      if (success) {
        setMessage({ type: "success", text: t("updateSuccess") });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: "error", text: t("updateError") });
      }
    } catch {
      setMessage({ type: "error", text: t("updateError") });
    } finally {
      setSaving(false);
    }
  };

  const clearMessage = () => setMessage(null);

  return (
    <div className="edit-profile-container">
      <div className="edit-profile-header">
        <h1>{t("editProfile")}</h1>
        <p>{t("updateInfo")}</p>
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          <span>{message.text}</span>
          <button onClick={clearMessage} className="message-close">×</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="edit-profile-form">
        <div className="form-section">
          <h2>{t("personalInformation")}</h2>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="first_name">
                <UserIcon className="w-4 h-4" />
                {t("firstName")}
              </label>
              <input
                type="text"
                id="first_name"
                value={formData.first_name}
                onChange={e => handleInputChange("first_name", e.target.value)}
                className={`form-input ${errors.first_name ? "error" : ""}`}
              />
            </div>

            <div className="form-group">
              <label htmlFor="last_name">
                <UserIcon className="w-4 h-4" />
                {t("lastName")}
              </label>
              <input
                type="text"
                id="last_name"
                value={formData.last_name}
                onChange={e => handleInputChange("last_name", e.target.value)}
                className={`form-input ${errors.last_name ? "error" : ""}`}
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">
                <PhoneIcon className="w-4 h-4" />
                {t("phoneNumber")}
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={e => handleInputChange("phone", e.target.value)}
                className={`form-input ${errors.phone ? "error" : ""}`}
              />
              {errors.phone && <span className="error-message">{errors.phone}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email">
                <EnvelopeIcon className="w-4 h-4" />
                {t("emailAddress")}
              </label>
              <input type="email" id="email" value={profile.email} disabled className="form-input disabled" />
              <small className="form-help">{t("emailNotEditable")}</small>
            </div>
          </div>
        </div>

        {isProvider && (
          <div className="form-section">
            <h2>{t("professionalInformation")}</h2>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="specialty">{t("medicalSpecialty")}</label>
                <input
                  type="text"
                  id="specialty"
                  value={formData.specialty}
                  onChange={e => handleInputChange("specialty", e.target.value)}
                  className={`form-input ${errors.specialty ? "error" : ""}`}
                />
              </div>

              <div className="form-group">
                <label htmlFor="clinic_name">{t("clinicName")}</label>
                <input
                  type="text"
                  id="clinic_name"
                  value={formData.clinic_name}
                  onChange={e => handleInputChange("clinic_name", e.target.value)}
                  className={`form-input ${errors.clinic_name ? "error" : ""}`}
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="clinic_address">{t("clinicAddress")}</label>
                <textarea
                  id="clinic_address"
                  value={formData.clinic_address}
                  onChange={e => handleInputChange("clinic_address", e.target.value)}
                  className={`form-textarea ${errors.clinic_address ? "error" : ""}`}
                  rows={3}
                />
              </div>
            </div>
          </div>
        )}

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn btn-secondary" disabled={saving}>
            {t("cancel")}
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? t("saving") : t("saveChanges")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfile;
