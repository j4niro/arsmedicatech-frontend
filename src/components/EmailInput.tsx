import React, { useState } from "react";
import { useTranslation } from "react-i18next";

interface EmailInputProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  label?: string;
  placeholder?: string;
  className?: string;
}

const EmailInput: React.FC<EmailInputProps> = ({
  value,
  onChange,
  required = false,
  label,
  placeholder,
  className = "",
}) => {
  const { t } = useTranslation();
  const [error, setError] = useState<string>("");
  const [touched, setTouched] = useState<boolean>(false);

  const validateEmail = (email: string): string => {
    if (required && !email.trim()) return t("emailRequired");
    if (email.trim() && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email))
      return t("invalidEmail");
    return "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    if (touched) setError(validateEmail(newValue));
  };

  const handleBlur = () => {
    setTouched(true);
    setError(validateEmail(value));
  };

  const hasError = error && touched;

  return (
    <div className={className}>
      <label className="block text-sm font-medium mb-1">
        {label || t("email")} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="email"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder || t("enterEmail")}
        className={`w-full px-3 py-2 border rounded-md ${
          hasError ? "border-red-500" : "border-gray-300"
        }`}
      />
      {hasError && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default EmailInput;
