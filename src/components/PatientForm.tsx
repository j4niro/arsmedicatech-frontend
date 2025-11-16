import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { patientAPI } from '../services/api';
import { useTranslation } from "react-i18next";

const PatientForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    sex: '',
    phone: '',
    email: '',
    location: ['', '', '', ''],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditing) loadPatient();
  }, [id]);

  const loadPatient = async () => {
    try {
      setLoading(true);
      const response = await patientAPI.getById(id as string);
      const patient = response.data;

      setFormData({
        first_name: patient.first_name || '',
        last_name: patient.last_name || '',
        date_of_birth: patient.date_of_birth || '',
        sex: patient.sex || '',
        phone: patient.phone || '',
        email: patient.email || '',
        location: patient.location || ['', '', '', ''],
      });
    } catch (err) {
      setError(t("loadPatientError"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLocationChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      location: prev.location.map((item, i) => (i === index ? value : item)),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isEditing) {
        await patientAPI.update(id, formData);
      } else {
        await patientAPI.create(formData);
      }
      navigate('/patients');
    } catch (err: any) {
      setError(err?.response?.data?.error || t("genericError"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => navigate('/patients');

  if (loading && isEditing) {
    return <div>{t("loadingPatient")}</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        {isEditing ? t("editPatient") : t("addNewPatient")}
      </h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* First & Last Name */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t("firstName")} *</label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border rounded-md focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("lastName")} *</label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border rounded-md focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Birth & Sex */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t("dateOfBirth")}</label>
            <input
              type="date"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-md focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("sex")}</label>
            <select
              name="sex"
              value={formData.sex}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-md focus:ring-blue-500"
            >
              <option value="">{t("select")}</option>
              <option value="M">{t("male")}</option>
              <option value="F">{t("female")}</option>
              <option value="O">{t("other")}</option>
            </select>
          </div>
        </div>

        {/* Contact */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t("phone")}</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-md focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("email")}</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-md focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium mb-2">{t("address")}</label>
          <div className="grid grid-cols-2 gap-4">
            <input placeholder={t("city")} value={formData.location[0] || ''} onChange={e => handleLocationChange(0, e.target.value)} className="px-3 py-2 border rounded-md focus:ring-blue-500" />
            <input placeholder={t("state")} value={formData.location[1] || ''} onChange={e => handleLocationChange(1, e.target.value)} className="px-3 py-2 border rounded-md focus:ring-blue-500" />
            <input placeholder={t("country")} value={formData.location[2] || ''} onChange={e => handleLocationChange(2, e.target.value)} className="px-3 py-2 border rounded-md focus:ring-blue-500" />
            <input placeholder={t("zip")} value={formData.location[3] || ''} onChange={e => handleLocationChange(3, e.target.value)} className="px-3 py-2 border rounded-md focus:ring-blue-500" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4 pt-4">
          <button type="button" onClick={handleCancel} className="px-4 py-2 text-gray-600 border rounded-md hover:bg-gray-50">
            {t("cancel")}
          </button>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
            {loading ? t("saving") : isEditing ? t("updatePatient") : t("createPatient")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientForm;
