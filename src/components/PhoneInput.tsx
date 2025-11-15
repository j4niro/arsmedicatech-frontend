import React, { useState } from 'react';
import { useTranslation } from "react-i18next";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  label?: string;
  placeholder?: string;
  className?: string;
  countryCode?: string;
  showFormatHint?: boolean;
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  required = false,
  label = "Phone",
  placeholder = "Enter phone number",
  className = "",
  countryCode = "1",
  showFormatHint = false,
}) => {
  const { t } = useTranslation();

  const [error, setError] = useState<string>('');
  const [touched, setTouched] = useState<boolean>(false);

  const getCountryInfo = (code: string) => {
    const countryMap: { [key: string]: { name: string; format: string; minLength: number; maxLength: number } } = {
      "1": { name: "US/Canada", format: "(XXX) XXX-XXXX", minLength: 10, maxLength: 10 },
      "44": { name: "UK", format: "+44 XXXX XXX XXXX", minLength: 10, maxLength: 11 },
      "33": { name: "France", format: "+33 X XX XX XX XX", minLength: 9, maxLength: 9 },
      "49": { name: "Germany", format: "+49 XXX XXXXXXXX", minLength: 10, maxLength: 12 },
      "61": { name: "Australia", format: "+61 X XXXX XXXX", minLength: 9, maxLength: 9 },
      "91": { name: "India", format: "+91 XXXXX XXXXX", minLength: 10, maxLength: 10 },
    };
    return countryMap[code] || { name: "International", format: `+${code} XXXXXXXXXX`, minLength: 7, maxLength: 15 };
  };

  const validatePhone = (phone: string): string => {
    if (required && !phone.trim()) {
      return t("Phone number is required");
    }

    if (!phone.trim()) return '';

    const digitsOnly = phone.replace(/\D/g, '');
    const countryInfo = getCountryInfo(countryCode);

    if (digitsOnly.length < countryInfo.minLength) {
      return t("Phone number must be at least {{count}} digits", { count: countryInfo.minLength });
    }

    if (digitsOnly.length > countryInfo.maxLength) {
      return t("Phone number is too long");
    }

    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    onChange(raw);
    if (touched) setError(validatePhone(raw));
  };

  const handleBlur = () => {
    setTouched(true);
    setError(validatePhone(value));
  };

  const hasError = error && touched;
  const countryInfo = getCountryInfo(countryCode);

  return (
    <div className={className}>
      <label className="block text-sm font-medium mb-1">
        {t(label)} {required && <span className="text-red-500">*</span>}
      </label>

      <input
        type="tel"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={t(placeholder)}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
          hasError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
        }`}
      />

      {hasError && (
        <p className="text-red-500 text-sm mt-1">
          {error}
        </p>
      )}

      {showFormatHint && (
        <p className="text-gray-500 text-xs mt-1">
          {t("Format: {{format}} ({{country}})", {
            format: countryInfo.format,
            country: countryInfo.name,
          })}
        </p>
      )}
    </div>
  );
};

export default PhoneInput;
