import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { API_URL } from '../env_vars';

const NotificationTest: React.FC = () => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<string>('');

  const testSSE = async () => {
    try {
      setStatus(t("testingSSE"));
      const response = await fetch(`${API_URL}/api/sse`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        setStatus(t("sseTestSuccess"));
      } else {
        setStatus(t("sseTestFailed"));
      }
    } catch (error) {
      setStatus(`SSE error: ${error}`);
    }
  };

  const testAppointmentReminder = async () => {
    try {
      setStatus(t("appointmentSending"));
      const response = await fetch(`${API_URL}/api/test/appointment-reminder`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: 'test-123',
          time: new Date().toISOString(),
          content: 'Test appointment reminder',
        }),
      });

      if (response.ok) {
        setStatus(t("appointmentSent"));
      } else {
        setStatus(t("appointmentFailed"));
      }
    } catch (error) {
      setStatus(`Error: ${error}`);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>{t("sseNotificationTest")}</h3>
      <p>{t("useButtonsToTestSSE")}</p>

      <div style={{ marginBottom: '10px' }}>
        <button
          onClick={testSSE}
          style={{
            padding: '8px 16px',
            marginRight: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {t("testSSEMessage")}
        </button>

        <button
          onClick={testAppointmentReminder}
          style={{
            padding: '8px 16px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {t("testAppointmentReminder")}
        </button>
      </div>

      {status && (
        <div
          style={{
            padding: '10px',
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
          }}
        >
          <strong>{t("status")}:</strong> {status}
        </div>
      )}

      <div style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
        <p><strong>{t("instructions")}</strong></p>
        <ul>
          <li>{t("makeSureLoggedIn")}</li>
          <li>{t("openConsoleToSeeEvents")}</li>
          <li>{t("checkMessagesRealTime")}</li>
        </ul>
      </div>
    </div>
  );
};

export default NotificationTest;
