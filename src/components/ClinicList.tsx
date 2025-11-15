import React, { useEffect, useState } from "react";
import { organizationAPI } from "../services/api";
import { useTranslation } from "react-i18next";

interface Clinic {
  id: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  location: {
    type: string;
    coordinates: [number, number];
  };
}

interface ClinicListProps {
  organizationId: string;
  onUpdate?: () => void;
}

const ClinicList: React.FC<ClinicListProps> = ({ organizationId, onUpdate }) => {
  const { t } = useTranslation();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newClinicId, setNewClinicId] = useState("");
  const [addingClinic, setAddingClinic] = useState(false);

  useEffect(() => {
    loadClinics();
  }, [organizationId]);

  const loadClinics = async () => {
    try {
      setLoading(true);
      const response = await organizationAPI.getClinics(organizationId);
      setClinics(response?.clinics || []);
    } catch (err: any) {
      setError(err.message || "");
    } finally {
      setLoading(false);
    }
  };

  const handleAddClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClinicId.trim()) return;
    try {
      setAddingClinic(true);
      await organizationAPI.addClinic(organizationId, newClinicId.trim());
      setNewClinicId("");
      await loadClinics();
      onUpdate?.();
    } catch (err: any) {
      setError(err.message || "");
    } finally {
      setAddingClinic(false);
    }
  };

  const handleRemoveClinic = async (clinicId: string) => {
    if (!confirm(t("confirmRemoveClinic"))) return;
    try {
      await organizationAPI.removeClinic(organizationId, clinicId);
      await loadClinics();
      onUpdate?.();
    } catch (err: any) {
      setError(err.message || "");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">{t("clinics")}</h3>
        <span className="text-sm text-gray-500">{t("clinicCount", { count: clinics.length })}</span>
      </div>

      <form onSubmit={handleAddClinic} className="flex gap-2">
        <input
          type="text"
          value={newClinicId}
          onChange={e => setNewClinicId(e.target.value)}
          placeholder={t("enterClinicId")}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
        />
        <button
          type="submit"
          disabled={addingClinic || !newClinicId.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
        >
          {addingClinic ? t("addingClinic") : t("addClinic")}
        </button>
      </form>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-red-800 text-sm">
          {error}
        </div>
      )}

      {clinics.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <h3 className="text-sm font-medium">{t("noClinics")}</h3>
          <p className="text-sm">{t("noClinicsDesc")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {clinics.map(clinic => (
            <div key={clinic.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-lg font-medium text-gray-900">{clinic.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {clinic.address.street}, {clinic.address.city} {clinic.address.state} {clinic.address.zip}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{clinic.address.country}</p>
                  {clinic.location && (
                    <p className="text-xs text-gray-400 mt-1">
                      {t("location")}: {clinic.location.coordinates[1].toFixed(4)}, {clinic.location.coordinates[0].toFixed(4)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveClinic(clinic.id)}
                  className="px-3 py-1 border border-red-300 text-red-700 rounded-md hover:bg-red-50"
                >
                  {t("remove")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClinicList;
