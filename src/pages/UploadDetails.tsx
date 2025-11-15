import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  uploader?: string;
  file_path?: string;
  bucket_name?: string;
  s3_key?: string;
  task_id?: string;
}

const statusColors: Record<string, string> = {
  pending: '#fbbf24',
  processing: '#60a5fa',
  completed: '#22c55e',
  failed: '#ef4444',
  cancelled: '#a1a1aa',
};

const UploadDetails: React.FC = () => {
  const { t } = useTranslation();

  const { uploadId } = useParams<{ uploadId: string }>();
  const navigate = useNavigate();
  const [upload, setUpload] = useState<Upload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (uploadId) {
      loadUploadDetails();
    }
  }, [uploadId]);

  const loadUploadDetails = async () => {
    if (!uploadId) return;

    setLoading(true);
    setError(null);
    try {
      const uploadData = await fileUploadAPI.getById(uploadId);
      setUpload(uploadData);
      logger.debug('Upload details loaded:', uploadData);
    } catch (err: any) {
      setError(t('upload_load_error'));
      logger.error('Error loading upload details:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return t('file_size_zero');
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 800, margin: '40px auto', padding: 24 }}>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          {t('loading_upload_details')}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 800, margin: '40px auto', padding: 24 }}>
        <div style={{ color: '#ef4444', marginBottom: 12 }}>{error}</div>
        <button
          onClick={() => navigate('/uploads')}
          style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          {t('back_to_uploads')}
        </button>
      </div>
    );
  }

  if (!upload) {
    return (
      <div style={{ maxWidth: 800, margin: '40px auto', padding: 24 }}>
        <div style={{ color: '#ef4444', marginBottom: 12 }}>
          {t('upload_not_found')}
        </div>
        <button
          onClick={() => navigate('/uploads')}
          style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          {t('back_to_uploads')}
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => navigate('/uploads')}
          style={{
            background: 'none',
            border: '1px solid #d1d5db',
            padding: '8px 16px',
            borderRadius: 6,
            cursor: 'pointer',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          ← {t('back_to_uploads')}
        </button>

        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
          {upload.file_name}
        </h1>

        <div
          style={{
            display: 'flex',
            gap: 16,
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <span
            style={{
              background: statusColors[upload.status] || '#e5e7eb',
              color: '#222',
              borderRadius: 6,
              padding: '4px 12px',
              fontWeight: 500,
              fontSize: 14,
            }}
          >
            {t(`status_${upload.status}`)}
          </span>

          <span style={{ color: '#6b7280' }}>
            {t('uploaded_on')} {new Date(upload.date_uploaded).toLocaleString()}
          </span>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24,
          marginBottom: 32,
        }}
      >
        {/* FILE INFORMATION */}
        <div style={{ background: '#f9fafb', padding: 20, borderRadius: 8 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
            {t('file_information')}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div>
              <strong>{t('file_type')}:</strong> {upload.file_type.toUpperCase()}
            </div>
            <div>
              <strong>{t('file_size')}:</strong> {formatFileSize(upload.file_size)}
            </div>

            {upload.file_path && (
              <div>
                <strong>{t('file_path')}:</strong> {upload.file_path}
              </div>
            )}

            {upload.bucket_name && (
              <div>
                <strong>{t('bucket')}:</strong> {upload.bucket_name}
              </div>
            )}
          </div>
        </div>

        {/* PROCESSING DETAILS */}
        <div style={{ background: '#f9fafb', padding: 20, borderRadius: 8 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
            {t('processing_details')}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div>
              <strong>{t('status')}:</strong> {t(`status_${upload.status}`)}
            </div>

            {upload.task_id && (
              <div>
                <strong>{t('task_id')}:</strong> {upload.task_id}
              </div>
            )}

            {upload.uploader && (
              <div>
                <strong>{t('uploader')}:</strong> {upload.uploader}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* COMPLETED WITH TEXT */}
      {upload.status === 'completed' && upload.processed_text && (
        <div
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            padding: 24,
          }}
        >
          <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>
            {t('extracted_text')}
          </h3>

          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 6,
              padding: 16,
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              fontSize: 14,
              lineHeight: 1.5,
              maxHeight: '500px',
              overflowY: 'auto',
            }}
          >
            {upload.processed_text}
          </div>
        </div>
      )}

      {/* COMPLETED WITHOUT TEXT */}
      {upload.status === 'completed' && !upload.processed_text && (
        <div
          style={{
            background: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: 8,
            padding: 16,
          }}
        >
          <p style={{ color: '#92400e', margin: 0 }}>
            {t('no_text_extracted')}
          </p>
        </div>
      )}

      {/* FAILED */}
      {upload.status === 'failed' && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #f87171',
            borderRadius: 8,
            padding: 16,
          }}
        >
          <p style={{ color: '#991b1b', margin: 0 }}>
            {t('processing_failed')}
          </p>
        </div>
      )}

      {/* PROCESSING */}
      {upload.status === 'processing' && (
        <div
          style={{
            background: '#eff6ff',
            border: '1px solid #60a5fa',
            borderRadius: 8,
            padding: 16,
          }}
        >
          <p style={{ color: '#1e40af', margin: 0 }}>
            {t('processing_in_progress')}
          </p>
        </div>
      )}
    </div>
  );
};

export default UploadDetails;
