import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { EncounterForm } from '../components/EncounterForm';
import { encounterAPI, patientAPI } from '../services/api';
import { EncounterType, PatientType } from '../types';
import { useTranslation } from "react-i18next";

export function EncounterFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { encounterId, patientId } = useParams<{
    encounterId?: string;
    patientId?: string;
  }>();

  const [encounter, setEncounter] = useState<EncounterType | null>(null);
  const [patient, setPatient] = useState<PatientType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeData = async () => {
      try {
        if (encounterId) {
          const encounterData = await encounterAPI.getById(encounterId);
          setEncounter(encounterData);

          if (encounterData.patient) {
            setPatient(encounterData.patient);
          }
        }

        if (!encounterId && patientId) {
          const patientData = await patientAPI.getById(patientId);
          setPatient(patientData);
        }
      } catch (error) {
        console.error('Error initializing encounter form:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeData();
  }, [encounterId, patientId]);

  const handleSubmit = async (encounterData: any) => {
    setIsLoading(true);
    try {
      if (encounterId) {
        await encounterAPI.update(encounterId, encounterData);
      } else {
        const targetPatientId = patientId || patient?.demographic_no;
        if (!targetPatientId) {
          throw new Error(t("patient_id_required"));
        }
        await encounterAPI.create(targetPatientId, encounterData);
      }

      if (patient?.demographic_no) {
        navigate(`/patients/${patient.demographic_no}`);
      } else {
        navigate('/patients');
      }
    } catch (error) {
      console.error('Error saving encounter:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (patient?.demographic_no) {
      navigate(`/patients/${patient.demographic_no}`);
    } else {
      navigate('/patients');
    }
  };

  if (isInitializing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">{t("loading_encounter_form")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {encounter ? t("edit_encounter") : t("new_encounter")}
            </h1>
            {patient && (
              <p className="text-gray-600 mt-2">
                {t("Patient")}: {patient.first_name} {patient.last_name} (ID: {patient.demographic_no})
              </p>
            )}
          </div>
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            ← {t("Back")}
          </button>
        </div>
      </div>

      {/* Encounter Form */}
      <EncounterForm
        encounter={encounter}
        patientId={patientId || patient?.demographic_no}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    </div>
  );
}
