import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { EncounterForm } from '../components/EncounterForm';
import { EncounterTable } from '../components/EncounterTable';
import { encounterAPI, patientAPI } from '../services/api';
import logger from '../services/logging';
import { EncounterType, PatientType } from '../types';
import { useTranslation } from 'react-i18next';

export function PatientDetail() {
  const { t } = useTranslation();
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();

  const [patient, setPatient] = useState<PatientType | null>(null);
  const [encounters, setEncounters] = useState<EncounterType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEncounterForm, setShowEncounterForm] = useState(false);
  const [selectedEncounter, setSelectedEncounter] = useState<EncounterType | null>(null);

  const loadPatientData = useCallback(async () => {
    if (!patientId) return;

    logger.debug('Loading patient data for ID:', patientId);
    setIsLoading(true);

    try {
      const patientData = await patientAPI.getById(patientId);
      setPatient(patientData);

      try {
        const encountersData = await encounterAPI.getByPatient(patientId);
        setEncounters(encountersData);
      } catch (err) {
        console.warn('Failed to load encounters (auth may be required):', err);
        setEncounters([]);
      }
    } catch (error) {
      console.error('Error loading patient data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (patientId) {
      loadPatientData();
    }
  }, [patientId, loadPatientData]);

  const handleCreateEncounter = async (encounterData: any) => {
    if (!patientId) return;

    try {
      await encounterAPI.create(patientId, encounterData);
      setShowEncounterForm(false);
      loadPatientData();
    } catch (error) {
      console.error('Error creating encounter:', error);
    }
  };

  const handleUpdateEncounter = async (encounter: EncounterType) => {
    if (!encounter.note_id) return;

    try {
      await encounterAPI.update(encounter.note_id, encounter);
      setShowEncounterForm(false);
      loadPatientData();
    } catch (error) {
      console.error('Error updating encounter:', error);
    }
  };

  const handleDeleteEncounter = async (encounter: EncounterType) => {
    if (!encounter.note_id) return;

    if (window.confirm(t('patient.delete_confirm'))) {
      try {
        await encounterAPI.delete(encounter.note_id);
        loadPatientData();
      } catch (error) {
        console.error('Error deleting encounter:', error);
      }
    }
  };

  const handleEncounterView = (encounter: EncounterType) => {
    navigate(`/encounters/${encounter.note_id}`);
  };

  const handleEncounterEdit = (encounter: EncounterType) => {
    navigate(`/encounters/${encounter.note_id}/edit`);
  };

  const handleEncounterRowClick = (encounter: EncounterType) => {
    navigate(`/encounters/${encounter.note_id}`);
  };

  const handleNewEncounter = () => {
    navigate(`/patients/${patientId}/encounters/new`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center">{t('patient.loading')}</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-red-600">{t('patient.not_found')}</p>
        <button
          onClick={() => navigate('/patients')}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {t('patient.back_to_list')}
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {patient.first_name} {patient.last_name}
            </h1>
            <p className="text-gray-600">
              {t('patient.id')}: {patient.demographic_no}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleNewEncounter}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              {t('patient.new_encounter')}
            </button>

            <button
              onClick={() => navigate('/patients')}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              {t('patient.back_to_list')}
            </button>
          </div>
        </div>
      </div>

      {/* Patient Information */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">{t('patient.info')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div>
            <p><strong>{t('patient.first_name')}:</strong> {patient.first_name || '-'}</p>
            <p><strong>{t('patient.last_name')}:</strong> {patient.last_name || '-'}</p>
            <p><strong>{t('patient.birth_date')}:</strong> {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : '-'}</p>
            <p><strong>{t('patient.sex')}:</strong> {patient.sex || '-'}</p>
          </div>

          <div>
            <p><strong>{t('patient.phone')}:</strong> {patient.phone || '-'}</p>
            <p><strong>{t('patient.email')}:</strong> {patient.email || '-'}</p>
            <p><strong>{t('patient.address')}:</strong> {patient.location ? patient.location.join(', ') : '-'}</p>
          </div>

        </div>
      </div>

      {/* Encounters Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{t('patient.encounters')}</h2>
          <button
            onClick={handleNewEncounter}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            {t('patient.add_encounter')}
          </button>
        </div>

        <EncounterTable
          encounters={encounters}
          onView={handleEncounterView}
          onEdit={handleEncounterEdit}
          onDelete={handleDeleteEncounter}
          onRowClick={handleEncounterRowClick}
        />
      </div>

      {/* Modal (for old UI compatibility) */}
      {showEncounterForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <EncounterForm
              encounter={selectedEncounter}
              patientId={patientId}
              onSubmit={selectedEncounter ? handleUpdateEncounter : handleCreateEncounter}
              onCancel={() => {
                setShowEncounterForm(false);
                setSelectedEncounter(null);
              }}
              isLoading={false}
            />
          </div>
        </div>
      )}

    </div>
  );
}
