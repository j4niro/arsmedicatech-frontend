import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { EntityDetailsModal } from '../components/EntityDetailsModal';
import { encounterAPI } from '../services/api';
import { EncounterType, PatientType, SOAPNotesType } from '../types';
import { useTranslation } from "react-i18next";

export function EncounterDetail() {
  const { t } = useTranslation();
  const { encounterId } = useParams<{ encounterId: string }>();
  const navigate = useNavigate();
  const [encounter, setEncounter] = useState<EncounterType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [entities, setEntities] = useState<any[]>([]);
  const [isExtractingEntities, setIsExtractingEntities] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (encounterId) {
      loadEncounterData();
    }
  }, [encounterId]);

  // Set up global click handler for entity clicks
  useEffect(() => {
    const handleEntityClickEvent = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target.classList.contains('entity-highlight')) {
        const entityId = target.getAttribute('data-entity-id');
        if (
          entityId &&
          (window as any).entityData &&
          (window as any).entityData[entityId]
        ) {
          const entity = (window as any).entityData[entityId];
          handleEntityClick(entity);
        }
      }
    };

    document.addEventListener('click', handleEntityClickEvent);

    return () => {
      document.removeEventListener('click', handleEntityClickEvent);
      delete (window as any).entityData;
    };
  }, []);

  const loadEncounterData = async () => {
    if (!encounterId) return;

    setIsLoading(true);
    try {
      const encounterData = await encounterAPI.getById(encounterId);
      setEncounter(encounterData);
    } catch (error) {
      console.error('Error loading encounter data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const extractEntities = async () => {
    if (!encounter?.note_text) {
      alert(t("no_notes_available_to_extract"));
      return;
    }

    setIsExtractingEntities(true);
    try {
      const noteText =
        typeof encounter.note_text === 'string'
          ? encounter.note_text
          : JSON.stringify(encounter.note_text);

      const result = await encounterAPI.extractEntitiesFromNotes(
        encounter.note_text,
        encounter.note_type || 'text'
      );

      const finalEntities = result.icd_codes || [];
      setEntities(finalEntities);

      if (result.cached) {
        console.log('Results loaded from cache');
      }
    } catch (error) {
      console.error('Error extracting entities:', error);
      alert(t("extract_entities_failed"));
    } finally {
      setIsExtractingEntities(false);
    }
  };

  const handleEntityClick = (entity: any) => {
    setSelectedEntity(entity);
    setIsModalOpen(true);
  };

  const renderSOAPNotes = (soapNotes: SOAPNotesType) => {
    const formatText = (text: string) => {
      if (!text) return t("no_notes_available");
      return text.replace(/\\n/g, '\n');
    };

    const highlightEntitiesInSection = (sectionText: string, sectionName: string) => {
      if (!entities.length) {
        return formatText(sectionText);
      }

      let result = sectionText;
      let offset = 0;

      const sortedEntities = [...entities].sort(
        (a, b) => a.start_char - b.start_char
      );

      sortedEntities.forEach((entity, index) => {
        const entityText = entity.text;
        const foundIndex = result.indexOf(entityText);

        if (foundIndex !== -1) {
          const actualStart = foundIndex;
          const actualEnd = actualStart + entityText.length;

          const before = result.substring(0, actualStart);
          const after = result.substring(actualEnd);

          const entityId = `entity-${index}-${sectionName}`;
          const spanWrapper = `<span class="bg-yellow-200 cursor-pointer hover:bg-yellow-300 border-b-2 border-yellow-400 entity-highlight" data-entity-id="${entityId}">${entityText}</span>`;

          result = `${before}${spanWrapper}${after}`;

          if (!(window as any).entityData) {
            (window as any).entityData = {};
          }
          (window as any).entityData[entityId] = entity;

          offset += spanWrapper.length - entityText.length;
        }
      });

      return formatText(result);
    };

    return (
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold text-blue-600">{t("Subjective")}</h4>
          <div
            className="text-gray-700 bg-gray-50 p-3 rounded whitespace-pre-wrap text-left"
            dangerouslySetInnerHTML={{
              __html: highlightEntitiesInSection(
                soapNotes.subjective || '',
                'subjective'
              ),
            }}
          />
        </div>
        <div>
          <h4 className="font-semibold text-green-600">{t("Objective")}</h4>
          <div
            className="text-gray-700 bg-gray-50 p-3 rounded whitespace-pre-wrap text-left"
            dangerouslySetInnerHTML={{
              __html: highlightEntitiesInSection(
                soapNotes.objective || '',
                'objective'
              ),
            }}
          />
        </div>
        <div>
          <h4 className="font-semibold text-yellow-600">{t("Assessment")}</h4>
          <div
            className="text-gray-700 bg-gray-50 p-3 rounded whitespace-pre-wrap text-left"
            dangerouslySetInnerHTML={{
              __html: highlightEntitiesInSection(
                soapNotes.assessment || '',
                'assessment'
              ),
            }}
          />
        </div>
        <div>
          <h4 className="font-semibold text-red-600">{t("Plan")}</h4>
          <div
            className="text-gray-700 bg-gray-50 p-3 rounded whitespace-pre-wrap text-left"
            dangerouslySetInnerHTML={{
              __html: highlightEntitiesInSection(soapNotes.plan || '', 'plan'),
            }}
          />
        </div>
      </div>
    );
  };

  const renderNoteText = (noteText: any, noteType?: string) => {
    if (
      noteType === 'soap' ||
      (typeof noteText === 'object' &&
        noteText !== null &&
        'subjective' in noteText &&
        'objective' in noteText &&
        'assessment' in noteText &&
        'plan' in noteText)
    ) {
      return renderSOAPNotes(noteText as SOAPNotesType);
    }
    return (
      <div>
        <h4 className="font-semibold text-gray-600 mb-2">{t("Notes")}</h4>
        <p className="text-gray-700 bg-gray-50 p-3 rounded whitespace-pre-wrap">
          {noteText || t("no_notes_available")}
        </p>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center">{t("loading_encounter_details")}</p>
      </div>
    );
  }

  if (!encounter) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-red-600">{t("encounter_not_found")}</p>
        <button
          onClick={() => navigate('/patients')}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {t("back_to_patients")}
        </button>
      </div>
    );
  }

  const patient = encounter.patient as PatientType;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t("Encounter Details")}
            </h1>
            <p className="text-gray-600">{t("Note ID")}: {encounter.note_id}</p>
            {patient && (
              <p className="text-gray-600">
                {t("Patient")}: {patient.first_name} {patient.last_name} (ID: {patient.demographic_no})
              </p>
            )}
          </div>
          <div className="flex space-x-2">
            {patient && (
              <button
                onClick={() => navigate(`/patients/${patient.demographic_no}`)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {t("View Patient")}
              </button>
            )}
            <button
              onClick={() => navigate('/patients')}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              {t("Back to Patients")}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Encounter Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">{t("Encounter Information")}</h2>
          <div className="space-y-3">
            <p>
              <strong>{t("Note ID")}:</strong> {encounter.note_id || '-'}
            </p>
            <p>
              <strong>{t("Visit Date")}:</strong>{' '}
              {encounter.date_created
                ? new Date(encounter.date_created).toLocaleDateString()
                : '-'}
            </p>
            <p>
              <strong>{t("Provider")}:</strong> {encounter.provider_id || '-'}
            </p>
            <p>
              <strong>{t("Status")}:</strong> {encounter.status || '-'}
            </p>
            {encounter.diagnostic_codes &&
              encounter.diagnostic_codes.length > 0 && (
                <div>
                  <strong>{t("Diagnostic Codes")}:</strong>
                  <div className="mt-1">
                    {encounter.diagnostic_codes.map((code, index) => (
                      <span
                        key={index}
                        className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm mr-2 mb-1"
                      >
                        {code}
                      </span>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* Patient Information */}
        {patient && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">{t("Patient Information")}</h2>
            <div className="space-y-3">
              <p>
                <strong>{t("Name")}:</strong> {patient.first_name} {patient.last_name}
              </p>
              <p>
                <strong>{t("ID")}:</strong> {patient.demographic_no}
              </p>
              <p>
                <strong>{t("Date of Birth")}:</strong>{' '}
                {patient.date_of_birth
                  ? new Date(patient.date_of_birth).toLocaleDateString()
                  : '-'}
              </p>
              <p>
                <strong>{t("Sex")}:</strong> {patient.sex || '-'}
              </p>
              <p>
                <strong>{t("Phone")}:</strong> {patient.phone || '-'}
              </p>
              <p>
                <strong>{t("Email")}:</strong> {patient.email || '-'}
              </p>
              <p>
                <strong>{t("Address")}:</strong> {patient.location ? patient.location.join(', ') : '-'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Notes Section */}
      <div className="mt-8 bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">{t("Clinical Notes")}</h2>
        {renderNoteText(encounter.note_text, encounter.note_type)}
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex justify-center space-x-4">
        <button
          onClick={extractEntities}
          disabled={isExtractingEntities}
          className={`px-6 py-2 rounded ${
            isExtractingEntities
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-purple-500 text-white hover:bg-purple-600'
          }`}
        >
          {isExtractingEntities ? t("Extracting...") : t("Extract Entities")}
        </button>

        <button
          onClick={() => navigate(`/encounters/${encounter.note_id}/edit`)}
          className="px-6 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          {t("Edit Encounter")}
        </button>

        {patient && (
          <button
            onClick={() => navigate(`/patients/${patient.demographic_no}`)}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {t("View All Encounters")}
          </button>
        )}
      </div>

      {/* Entity Details Modal */}
      <EntityDetailsModal
        entity={selectedEntity}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEntity(null);
        }}
      />
    </div>
  );
}
