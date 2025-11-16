import React, { useEffect, useState } from 'react';
import { organizationAPI } from '../services/api';
import { useTranslation } from "react-i18next";

interface OrganizationFormProps {
  onSuccess?: (org: any) => void;
  createdBy: string;
  initialValues?: {
    name?: string;
    org_type?: string;
    description?: string;
    country?: string;
    [key: string]: any;
  };
}

const ORG_TYPES = [
  { value: 'individual', label: 'individual' },
  { value: 'provider', label: 'provider' },
  { value: 'admin', label: 'admin' },
];

const OrganizationForm: React.FC<OrganizationFormProps> = ({
  onSuccess,
  createdBy,
  initialValues,
}) => {
  const { t } = useTranslation();

  const [name, setName] = useState(initialValues?.name || '');
  const [orgType, setOrgType] = useState(initialValues?.org_type || ORG_TYPES[0].value);
  const [description, setDescription] = useState(initialValues?.description || '');
  const [country, setCountry] = useState(initialValues?.country || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (initialValues) {
      setName(initialValues.name || '');
      setOrgType(initialValues.org_type || ORG_TYPES[0].value);
      setDescription(initialValues.description || '');
      setCountry(initialValues.country || '');
    }
  }, [initialValues]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      if (initialValues) {
        const updated = {
          ...initialValues,
          name,
          org_type: orgType,
          description,
          country,
          created_by: createdBy,
        };
        if (onSuccess) onSuccess(updated);
        setSuccess(t("organizationUpdated"));
        setLoading(false);
        return;
      }

      const res = await organizationAPI.create({
        name,
        org_type: orgType,
        description,
        country,
        created_by: createdBy,
      });

      if (res.ok) {
        setSuccess(t("organizationCreated"));
        setName('');
        setOrgType(ORG_TYPES[0].value);
        setDescription('');
        setCountry('');
        if (onSuccess) onSuccess(res.organization);
      } else {
        setError(res.error || t("organizationCreateFailed"));
      }
    } catch (err: any) {
      setError(err.message || t("networkError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            {t("organizationName")}
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none sm:text-sm"
            placeholder={t("organizationNamePlaceholder")}
          />
        </div>

        <div>
          <label htmlFor="org_type" className="block text-sm font-medium text-gray-700">
            {t("organizationType")}
          </label>
          <select
            id="org_type"
            value={orgType}
            onChange={e => setOrgType(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
          >
            {ORG_TYPES.map(opt => (
              <option key={opt.value} value={opt.value}>
                {t(opt.label)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            {t("description")}
          </label>
          <textarea
            id="description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
            placeholder={t("organizationDescriptionPlaceholder")}
          />
        </div>

        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700">
            {t("country")}
          </label>
          <input
            id="country"
            type="text"
            value={country}
            onChange={e => setCountry(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
            placeholder={t("countryPlaceholder")}
          />
        </div>
      </div>

      <div className="flex items-center justify-end space-x-3">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-md bg-blue-600 text-white disabled:opacity-50"
        >
          {loading 
            ? (initialValues ? t("saving") : t("creating"))
            : (initialValues ? t("saveChanges") : t("createOrganization"))
          }
        </button>
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}
      {success && <div className="text-green-600 text-sm">{success}</div>}
    </form>
  );
};

export default OrganizationForm;
