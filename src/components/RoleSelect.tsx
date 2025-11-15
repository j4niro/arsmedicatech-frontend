import React from 'react';
import { useTranslation } from "react-i18next";

interface RoleSelectProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}

const RoleSelect: React.FC<RoleSelectProps> = ({
  value,
  onChange,
  disabled = false,
  style,
}) => {
  const { t } = useTranslation();

  return (
    <div className="form-group" style={{ marginBottom: 24, ...style }}>
      <label
        htmlFor="role"
        style={{ fontWeight: 500, marginBottom: 4, display: 'block' }}
      >
        {t("You are a...")}
      </label>

      <select
        id="role"
        name="role"
        value={value}
        onChange={onChange}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '8px',
          borderRadius: 4,
          border: '1px solid #ccc',
          fontSize: 16,
        }}
      >
        <option value="patient">{t("Individual")}</option>
        <option value="provider">{t("Healthcare provider")}</option>
        <option value="administrator">{t("Administrator for a clinic")}</option>
      </select>

      <div
        className="role-description"
        style={{
          marginTop: 8,
          color: '#666',
          fontSize: 14,
          minHeight: 18,
          textAlign: 'left',
        }}
      >
        {value === "patient" && t("Looking to manage or better understand their own health.")}
        {value === "provider" && t("Not affiliated with an existing clinic in our system.")}
        {value === "administrator" && t("You want to manage a clinic.")}
      </div>

      <div style={{ marginTop: 8 }}>
        <a
          href="/about/roles"
          style={{
            fontSize: 14,
            color: '#007bff',
            textDecoration: 'underline',
            cursor: 'pointer',
          }}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("If you are unsure, read more here.")}
        </a>
      </div>
    </div>
  );
};

export default RoleSelect;
