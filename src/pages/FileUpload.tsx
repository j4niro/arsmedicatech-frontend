import React, { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { fileUploadAPI } from '../services/api';
import logger from '../services/logging';
import { useTranslation } from 'react-i18next';

interface Upload {
  id: string;
  file_name: string;
  file_type: string;
  date_uploaded: string;
  status: string;
  file_size: number;
  processed_text?: string;
}

const statusColors: Record<string, string> = {
  pending: '#fbbf24',
  processing: '#60a5fa',
  completed: '#22c55e',
  failed: '#ef4444',
  cancelled: '#a1a1aa',
};

const FileUpload: React.FC = () => {
  const { t } = useTranslation();
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchUploads = useCallback(async () => {
    try {
      const res = await fileUploadAPI.getAll();
      setUploads(res);
    } catch (err) {
      setError(t("ErrorLoadingResults"));
    }
  }, [t]);

  useEffect(() => {
    fetchUploads();
    const interval = setInterval(fetchUploads, 4000);
    return () => clearInterval(interval);
  }, [fetchUploads]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setError(null);
      setSuccess(null);

      if (!acceptedFiles.length) return;
      setUploading(true);

      const file = acceptedFiles[0];
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fileUploadAPI.create(formData);
        logger.debug('File uploaded successfully:', res);
        setSuccess(t("FileUpload"));
        fetchUploads();
      } catch (err: any) {
        setError(t("failed"));
      } finally {
        setUploading(false);
      }
    },
    [fetchUploads, t]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  });

  const handleUploadClick = (upload: Upload) => {
    if (upload.status === 'completed') {
      navigate(`/uploads/${upload.id}`);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 24 }}>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>
        {t("FileUpload")}
      </h2>

      <div
        {...getRootProps()}
        style={{
          border: '2px dashed #888',
          borderRadius: 12,
          padding: 40,
          textAlign: 'center',
          background: isDragActive ? '#f0f9ff' : '#fafafa',
          color: '#333',
          cursor: 'pointer',
          marginBottom: 24,
          transition: 'background 0.2s',
        }}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>{t("DragDrop")}</p>
        ) : (
          <p>{t("DragDrop")}</p>
        )}

        {uploading && (
          <p style={{ color: '#60a5fa', marginTop: 8 }}>
            {t("Uploading")}
          </p>
        )}
      </div>

      {error && <div style={{ color: '#ef4444', marginBottom: 12 }}>{error}</div>}
      {success && <div style={{ color: '#22c55e', marginBottom: 12 }}>{success}</div>}

      <h3 style={{ fontSize: 20, fontWeight: 600, margin: '24px 0 12px' }}>
        {t("uploads")}
      </h3>

      <div
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          background: '#fff',
        }}
      >
        {uploads.length === 0 ? (
          <div style={{ padding: 24, color: '#888' }}>
            {t("NoUploads")}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={{ padding: 10, textAlign: 'left', fontWeight: 500 }}>
                  {t("FileUpload")}
                </th>
                <th style={{ padding: 10, textAlign: 'left', fontWeight: 500 }}>
                  {t("Type")}
                </th>
                <th style={{ padding: 10, textAlign: 'left', fontWeight: 500 }}>
                  {t("Uploaded")}
                </th>
                <th style={{ padding: 10, textAlign: 'left', fontWeight: 500 }}>
                  {t("Status")}
                </th>
              </tr>
            </thead>

            <tbody>
              {uploads.map(u => (
                <tr
                  key={u.id}
                  style={{
                    borderBottom: '1px solid #f1f5f9',
                    cursor: u.status === 'completed' ? 'pointer' : 'default',
                    backgroundColor:
                      u.status === 'completed' ? '#f8fafc' : 'transparent',
                    transition: 'background-color 0.2s',
                  }}
                  onClick={() => handleUploadClick(u)}
                  onMouseEnter={e => {
                    if (u.status === 'completed') {
                      e.currentTarget.style.backgroundColor = '#e2e8f0';
                    }
                  }}
                  onMouseLeave={e => {
                    if (u.status === 'completed') {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                    }
                  }}
                >
                  <td style={{ padding: 10 }}>{u.file_name}</td>
                  <td style={{ padding: 10 }}>{u.file_type}</td>
                  <td style={{ padding: 10 }}>
                    {new Date(u.date_uploaded).toLocaleString()}
                  </td>
                  <td style={{ padding: 10 }}>
                    <span
                      style={{
                        background: statusColors[u.status] || '#e5e7eb',
                        color: '#222',
                        borderRadius: 6,
                        padding: '2px 10px',
                        fontWeight: 500,
                        fontSize: 14,
                      }}
                    >
                      {t(`common.${u.status}`)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
