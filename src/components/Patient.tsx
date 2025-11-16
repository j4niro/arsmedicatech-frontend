import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSignupPopup } from '../hooks/useSignupPopup';
import { patientAPI } from '../services/api';
import authService from '../services/auth';
import { PatientType } from '../types';
import SignupPopup from './SignupPopup';
import { useTranslation } from "react-i18next";

const Patient = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [patient, setPatient] = useState<PatientType>({ history: [] });
  const isAuthenticated = authService.isAuthenticated();
  const { isPopupOpen, showSignupPopup, hideSignupPopup } = useSignupPopup();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPatient();
  }, [id]);

  const loadPatient = async () => {
    try {
      setLoading(true);
      const response = await patientAPI.getById(id as string);
      setPatient(response.data);
    } catch (err) {
      setError(t("loadPatientError"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => navigate(`/patients/${id}/edit`);

  const handleDelete = async () => {
    if (window.confirm(t("confirmDeletePatient", { name: `${patient.first_name} ${patient.last_name}` }))) {
      try {
        await patientAPI.delete(id as string);
        navigate('/patients');
      } catch (err) {
        setError(t("deletePatientError"));
        console.error(err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        {t("loadingPatient")}
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <Link to="/patients" className="text-blue-600 hover:text-blue-900">
          ← {t("backToPatientList")}
        </Link>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">{t("patientNotFound")}</h1>
        <Link to="/patients" className="text-blue-600 hover:text-blue-900">
          ← {t("backToPatientList")}
        </Link>
      </div>
    );
  }

  const formatDate = (dateString?: string) =>
    dateString ? new Date(dateString).toLocaleDateString() : '-';

  const formatLocation = (location?: string[] | null) =>
    Array.isArray(location) && location.length ? location.filter(Boolean).join(', ') : '-';

  return (
    <>
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Link to="/patients" className="text-blue-600 hover:text-blue-900 mb-2 inline-block">
              ← {t("backToPatientList")}
            </Link>
            <h1 className="text-3xl font-bold">
              {patient.first_name} {patient.last_name}
            </h1>
            <p className="text-gray-600">{t("patientID")}: {patient.demographic_no}</p>
          </div>

          {isAuthenticated ? (
            <div className="flex space-x-2">
              <button onClick={handleEdit} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                {t("editPatient")}
              </button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                {t("deletePatient")}
              </button>
            </div>
          ) : (
            <div className="guest-notice">
              <p>{t("signUpToEdit")}</p>
              <button onClick={showSignupPopup} className="guest-action-button">
                {t("getStarted")}
              </button>
            </div>
          )}
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">{t("patientInformation")}</h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Personal Details */}
              <div>
                <h3 className="text-lg font-medium mb-4">{t("personalDetails")}</h3>
                <dl className="space-y-3">
                  <div><dt className="text-sm font-medium text-gray-500">{t("fullName")}</dt>
                    <dd className="text-sm text-gray-900">{patient.first_name} {patient.last_name}</dd></div>

                  <div><dt className="text-sm font-medium text-gray-500">{t("dateOfBirth")}</dt>
                    <dd className="text-sm text-gray-900">{formatDate(patient.date_of_birth)}</dd></div>

                  <div><dt className="text-sm font-medium text-gray-500">{t("sex")}</dt>
                    <dd className="text-sm text-gray-900">
                      {patient.sex === 'M' ? t("male") :
                       patient.sex === 'F' ? t("female") :
                       patient.sex === 'O' ? t("other") : '-'}
                    </dd></div>
                </dl>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-medium mb-4">{t("contactInformation")}</h3>
                <dl className="space-y-3">
                  <div><dt className="text-sm font-medium text-gray-500">{t("phone")}</dt>
                    <dd className="text-sm text-gray-900">{patient.phone || '-'}</dd></div>

                  <div><dt className="text-sm font-medium text-gray-500">{t("email")}</dt>
                    <dd className="text-sm text-gray-900">{patient.email || '-'}</dd></div>

                  <div><dt className="text-sm font-medium text-gray-500">{t("address")}</dt>
                    <dd className="text-sm text-gray-900">{formatLocation(patient.location)}</dd></div>
                </dl>
              </div>
            </div>

            {/* Medical History placeholder */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium mb-4">{t("medicalHistory")}</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-gray-600 text-sm">{t("medicalHistoryComingSoon")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SignupPopup isOpen={isPopupOpen} onClose={hideSignupPopup} onSwitchToLogin={undefined} />
    </>
  );
};

export default Patient;
