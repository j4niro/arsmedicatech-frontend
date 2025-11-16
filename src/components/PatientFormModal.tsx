import React, { useEffect, useState } from 'react';
import { useTranslation } from "react-i18next";
import { PatientType } from '../types';
import EmailInput from './EmailInput';
import PhoneInput from './PhoneInput';

interface PatientFormModalProps {
  patient?: PatientType | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function PatientFormModal({
  patient,
  onSubmit,
  onCancel,
  isLoading = false,
}: PatientFormModalProps) {
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    sex: '',
    phone: '',
    email: '',
    location: ['', '', '', ''],
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (patient) {
      setFormData({
        first_name: patient.first_name || '',
        last_name: patient.last_name || '',
        date_of_birth: patient.date_of_birth
          ? patient.date_of_birth.split('T')[0]
          : '',
        sex: patient.sex || '',
        phone: patient.phone || '',
        email: patient.email || '',
        location: patient.location || ['', '', '', ''],
      });
    }
  }, [patient]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLocationChange = (index: number, value: string): void => {
    setFormData(prev => ({
      ...prev,
      location: prev.location.map((item, i) => (i === index ? value : item)),
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    try {
      onSubmit(formData);
    } catch (err: any) {
      setError(err?.response?.data?.error || t("genericError"));
      console.error(err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">
        {patient ? t("editPatient") : t("addNewPatient")}
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("firstName")} *
            </label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t("lastName")} *
            </label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("dateOfBirth")}
            </label>
            <input
              type="date"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t("sex")}</label>
            <select
              name="sex"
              value={formData.sex}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500"
            >
              <option value="">{t("select")}</option>
              <option value="M">{t("male")}</option>
              <option value="F">{t("female")}</option>
              <option value="O">{t("other")}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <PhoneInput
            value={formData.phone}
            onChange={(value) => setFormData(prev => ({ ...prev, phone: value }))}
            label={t("phone")}
            placeholder={t("enterPhone")}
          />

          <EmailInput
            value={formData.email}
            onChange={(value) => setFormData(prev => ({ ...prev, email: value }))}
            label={t("email")}
            placeholder={t("enterEmail")}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t("address")}</label>
          <div className="grid grid-cols-2 gap-2">
            <input placeholder={t("city")} value={formData.location[0]} onChange={e => handleLocationChange(0, e.target.value)} className="px-3 py-2 border rounded-md" />
            <input placeholder={t("state")} value={formData.location[1]} onChange={e => handleLocationChange(1, e.target.value)} className="px-3 py-2 border rounded-md" />
            <input placeholder={t("country")} value={formData.location[2]} onChange={e => handleLocationChange(2, e.target.value)} className="px-3 py-2 border rounded-md" />
            <input placeholder={t("zip")} value={formData.location[3]} onChange={e => handleLocationChange(3, e.target.value)} className="px-3 py-2 border rounded-md" />
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
            {t("cancel")}
          </button>
          <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50">
            {isLoading ? t("saving") : patient ? t("updatePatient") : t("createPatient")}
          </button>
        </div>
      </form>
    </div>
  );
}
