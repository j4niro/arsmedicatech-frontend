import { useEffect, useState } from 'react';
import { educationAPI } from '../services/api';
import logger from '../services/logging';

export interface EducationArtifact {
  id: string;
  title: string;
  url: string;
  type: '3d_visualization' | 'video' | 'interactive' | 'document';
  category: string;
  informationCard: {
    description: string;
    features: Array<{
      title: string;
      description: string;
    }>;
    disclaimer?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface UseEducationReturn {
  artifact: EducationArtifact | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useEducation = (artifactId: string): UseEducationReturn => {
  const [artifact, setArtifact] = useState<EducationArtifact | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArtifact = async () => {
    if (!artifactId) {
      setError('No artifact ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      logger.debug('Fetching education artifact:', artifactId);
      const data = await educationAPI.getById(artifactId);

      logger.debug('Education artifact fetched:', data);
      setArtifact(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to load education artifact';
      logger.error('Error fetching education artifact:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchArtifact();
  };

  useEffect(() => {
    fetchArtifact();
  }, [artifactId]);

  return {
    artifact,
    loading,
    error,
    refetch,
  };
};

// Hook for fetching multiple education artifacts
interface UseEducationListReturn {
  artifacts: EducationArtifact[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useEducationList = (category?: string): UseEducationListReturn => {
  const [artifacts, setArtifacts] = useState<EducationArtifact[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArtifacts = async () => {
    try {
      setLoading(true);
      setError(null);

      logger.debug('Fetching education artifacts:', { category });
      const data = category
        ? await educationAPI.getByCategory(category)
        : await educationAPI.getAll();

      logger.debug('Education artifacts fetched:', data);
      setArtifacts(data || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to load education artifacts';
      logger.error('Error fetching education artifacts:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchArtifacts();
  };

  useEffect(() => {
    fetchArtifacts();
  }, [category]);

  return {
    artifacts,
    loading,
    error,
    refetch,
  };
};
