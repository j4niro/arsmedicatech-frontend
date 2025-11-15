import { useEffect, useState } from 'react';
import { useSignupPopup } from '../hooks/useSignupPopup';
import authService from '../services/auth';
import { PatientType } from '../types';
import SignupPopup from './SignupPopup';
import { useTranslation } from "react-i18next";

import { Link, useNavigate } from 'react-router-dom';
import { patientAPI } from '../services/api';

const PatientList = () => {
  const { t } = useTranslation();
  const [patients, setPatients] = useState<PatientType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const isAuthenticated = authService.isAuthenticated();
  const { isPopupOpen, showSignupPopup, hideSignupPopup } = useSignupPopup();

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const response = await patientAPI.getAll();
      const patientsData = response.data || response;
      setPatients(patientsData || []);
    } catch (err) {
      setError(t("loadError"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (patientId: string, patientName: string): Promise<void> => {
    if (window.confirm(t("confirmDelete", { name: patientName }))) {
      try {
        await patientAPI.delete(patientId);
        loadPatients();
      } catch (err) {
        setError(t("deleteError"));
        console.error(err);
      }
    }
  };

  const handleEdit = (patientId: string): void => {
    navigate(`/patients/${patientId}/edit`);
  };

  const handleAddNew = (): void => {
    navigate('/patients/new');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        {t("loading")}
      </div>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{t("title")}</h1>

          {isAuthenticated ? (
            <button
              onClick={handleAddNew}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {t("addNew")}
            </button>
          ) : (
            <div className="guest-notice">
              <p>{t("guestMessage")}</p>
              <button onClick={showSignupPopup} className="guest-action-button">
                {t("getStarted")}
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {length > 0 ? (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="th">{t("name")}</th>
                  <th className="th">{t("id")}</th>
                  <th className="th">{t("dob")}</th>
                  <th className="th">{t("phone")}</th>
                  <th className="th">{t("email")}</th>
                  {isAuthenticated && <th className="th">{t("actions")}</th>}
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {patients.map(patient => (
                  <tr key={patient.demographic_no} className="hover:bg-gray-50">
                    <td className="td">
                      <Link to={`/patients/${patient.demographic_no}`} className="text-blue-600 hover:text-blue-900 font-medium">
                        {patient.first_name} {patient.last_name}
                      </Link>
                    </td>
                    <td className="td">{patient.demographic_no}</td>
                    <td className="td">
                      {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : '-'}
                    </td>
                    <td className="td">{patient.phone || '-'}</td>
                    <td className="td">{patient.email || '-'}</td>

                    {isAuthenticated && (
                      <td className="td">
                        <div className="flex space-x-2">
                          <button onClick={() => handleEdit(patient.demographic_no!)} className="text-indigo-600 hover:text-indigo-900">
                            {t("edit")}
                          </button>
                          <button
                            onClick={() => handleDelete(patient.demographic_no!, `${patient.first_name} ${patient.last_name}`)}
                            className="text-red-600 hover:text-red-900"
                          >
                            {t("delete")}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">{t("empty")}</p>

            {isAuthenticated ? (
              <button onClick={handleAddNew} className="btn-primary">
                {t("addFirst")}
              </button>
            ) : (
              <button onClick={showSignupPopup} className="btn-primary">
                {t("signupToAdd")}
              </button>
            )}
          </div>
        )}
      </div>

      <SignupPopup isOpen={isPopupOpen} onClose={hideSignupPopup} />
    </>
  );
};

export default PatientList;
