import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useEducation } from '../hooks/useEducation';

const Education: React.FC = () => {
  const [searchParams] = useSearchParams();
  const artifactId = searchParams.get('id') || 'default';

  const { artifact, loading, error, refetch } = useEducation(artifactId);

  if (loading) {
    return (
      <div className="education-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading educational content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="education-container">
        <div className="error-container">
          <h2>Error Loading Content</h2>
          <p>{error}</p>
          <button onClick={refetch} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!artifact) {
    return (
      <div className="education-container">
        <div className="error-container">
          <h2>No Content Found</h2>
          <p>The requested educational content could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="education-container">
      <div className="education-header">
        <h1>Patient Education</h1>
        <p>Interactive visualizations to help you understand your health</p>
      </div>

      <div className="education-content">
        <div className="visualization-section">
          <h2 className="visualization-title">{artifact.title}</h2>
          <div className="iframe-container">
            <iframe
              src={artifact.url}
              title={artifact.title}
              className="education-iframe"
              allowFullScreen
            />
          </div>
        </div>

        <div className="information-card">
          <h3>About This Visualization</h3>
          <p>{artifact.informationCard.description}</p>

          <div className="card-features">
            {artifact.informationCard.features.map((feature, index) => (
              <div key={index} className="feature">
                <h4>{feature.title}</h4>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>

          {artifact.informationCard.disclaimer && (
            <div className="disclaimer">
              <p>
                <strong>Note:</strong> {artifact.informationCard.disclaimer}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Education;
