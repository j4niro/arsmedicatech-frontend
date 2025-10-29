import React, { useEffect, useState } from 'react';
import { DEMO_MODE } from '../env_vars';
import apiService from '../services/api';
import logger from '../services/logging';
import { LabResult, LabResultsData } from '../types';

interface LabResultsTableProps {
  title: string;
  data: { [key: string]: LabResult };
}

interface RangeVisualizerProps {
  result: number;
  range: [number, number];
  units: string | null;
}

interface ResultStatusIndicatorProps {
  result: number;
  range: [number, number];
}

interface HoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  description: string;
  name: string;
  result: number;
  range: [number, number];
  units: string | null;
  notes?: string;
}

const RangeVisualizer: React.FC<RangeVisualizerProps> = ({
  result,
  range,
  units,
}) => {
  const [min, max] = range;
  const rangeWidth = max - min;

  // Calculate position as percentage within the range
  let resultPosition = 0;
  if (rangeWidth > 0) {
    resultPosition = ((result - min) / rangeWidth) * 100;
  }

  // Clamp position between 0 and 100
  const clampedPosition = Math.max(0, Math.min(100, resultPosition));

  const isOutOfRange = result < min || result > max;

  return (
    <div className="flex items-center space-x-3">
      <div className="flex-1 relative">
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
          {/* Range bar with gradient */}
          <div className="h-full bg-gradient-to-r from-green-300 to-green-400 relative">
            {/* Result indicator */}
            <div
              className={`absolute top-0 h-full w-1.5 rounded-full transition-all duration-300 shadow-md ${
                isOutOfRange ? 'bg-red-500' : 'bg-blue-600'
              }`}
              style={{ left: `${clampedPosition}%` }}
            />
            {/* Range boundaries */}
            <div className="absolute left-0 top-0 h-full w-0.5 bg-gray-600 opacity-50"></div>
            <div className="absolute right-0 top-0 h-full w-0.5 bg-gray-600 opacity-50"></div>
          </div>
        </div>
        {/* Range labels */}
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span className="font-medium">{min}</span>
          <span className="font-medium">{max}</span>
        </div>
      </div>
      <div
        className={`text-sm font-semibold min-w-[80px] text-right ${
          isOutOfRange ? 'text-red-600' : 'text-green-600'
        }`}
      >
        {result}
        {units && (
          <span className="text-gray-500 ml-1 font-normal">{units}</span>
        )}
      </div>
    </div>
  );
};

const ResultStatusIndicator: React.FC<ResultStatusIndicatorProps> = ({
  result,
  range,
}) => {
  const [min, max] = range;
  const isOutOfRange = result < min || result > max;

  if (!isOutOfRange) {
    return (
      <div className="flex items-center space-x-2">
        <div
          className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0 shadow-sm"
          title="Within normal range"
        />
        <span className="text-xs text-green-600 font-medium">Normal</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <div
        className="w-4 h-4 bg-red-500 rounded-full flex-shrink-0 animate-pulse shadow-sm"
        title="Outside normal range"
      />
      <span className="text-xs text-red-600 font-medium">Abnormal</span>
    </div>
  );
};

const HoverModal: React.FC<HoverModalProps> = ({
  isOpen,
  onClose,
  description,
  name,
  result,
  range,
  units,
  notes,
}) => {
  if (!isOpen) return null;

  const [min, max] = range;
  const isOutOfRange = result < min || result > max;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-200">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-xl font-bold text-gray-900">{name}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold transition-colors duration-200"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-700 leading-relaxed">
              {description}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-700">Result:</span>
                <span
                  className={`font-bold text-lg ${isOutOfRange ? 'text-red-600' : 'text-green-600'}`}
                >
                  {result} {units}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-700">
                  Normal Range:
                </span>
                <span className="text-gray-800 font-medium">
                  {min} - {max} {units}
                </span>
              </div>
            </div>
          </div>

          {notes && (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <span className="font-semibold text-gray-700 block mb-2">
                Notes:
              </span>
              <p className="text-sm text-gray-700">{notes}</p>
            </div>
          )}

          {isOutOfRange && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-red-600 text-xl">⚠️</span>
                <p className="text-red-700 font-semibold">
                  Result is outside the normal range
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const LabResultsTable: React.FC<LabResultsTableProps> = ({ title, data }) => {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const items = Object.entries(data);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b border-gray-200 pb-2">
        {title}
      </h2>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Test Name
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Result & Range
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Notes
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {items.map(([name, labResult]) => {
              const isOutOfRange =
                labResult.result < labResult.reference_range[0] ||
                labResult.result > labResult.reference_range[1];

              return (
                <tr
                  key={name}
                  className={`hover:bg-gray-50 cursor-pointer transition-all duration-200 ${
                    isOutOfRange ? 'bg-red-50 hover:bg-red-100' : ''
                  }`}
                  onClick={() => setSelectedItem(name)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <ResultStatusIndicator
                      result={labResult.result}
                      range={labResult.reference_range}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className={`text-sm font-semibold ${
                        isOutOfRange ? 'text-red-800' : 'text-gray-900'
                      }`}
                    >
                      {name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <RangeVisualizer
                      result={labResult.result}
                      range={labResult.reference_range}
                      units={labResult.units}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {labResult.notes || '-'}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {selectedItem && data[selectedItem] && (
        <HoverModal
          isOpen={true}
          onClose={() => setSelectedItem(null)}
          description={data[selectedItem].description}
          name={selectedItem}
          result={data[selectedItem].result}
          range={data[selectedItem].reference_range}
          units={data[selectedItem].units}
          notes={data[selectedItem].notes}
        />
      )}
    </div>
  );
};

const LabResults: React.FC = () => {
  const [labResults, setLabResults] = useState<LabResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  // Cache key for lab results
  const CACHE_KEY = 'lab_results_cache';
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Helper function to get cached data
  const getCachedData = (): LabResultsData | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          logger.debug('LabResults - Using cached data');
          return data;
        }
      }
    } catch (error) {
      logger.warn('LabResults - Failed to parse cached data:', error);
    }
    return null;
  };

  // Helper function to cache data
  const cacheData = (data: LabResultsData) => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      logger.debug('LabResults - Data cached successfully');
    } catch (error) {
      logger.warn('LabResults - Failed to cache data:', error);
    }
  };

  // Helper function to clear cache
  const clearCache = () => {
    try {
      localStorage.removeItem(CACHE_KEY);
      logger.debug('LabResults - Cache cleared');
    } catch (error) {
      logger.warn('LabResults - Failed to clear cache:', error);
    }
  };

  const fetchLabResults = async (isRetry: boolean = false) => {
    try {
      if (isRetry) {
        setIsRetrying(true);
        setRetryCount(prev => prev + 1);
      } else {
        setLoading(true);
        setRetryCount(0);
      }

      setError(null);

      // Try to get cached data first if not retrying
      if (!isRetry) {
        const cachedData = getCachedData();
        if (cachedData) {
          setLabResults(cachedData);
          setLoading(false);
          logger.debug('LabResults - Loaded from cache');
          return;
        }
      }

      logger.debug('LabResults - Fetching lab results from API');
      const data = await apiService.getLabResults();

      setLabResults(data);
      cacheData(data); // Cache the successful response
      logger.debug('LabResults - Successfully fetched and cached data');
    } catch (err) {
      logger.error('LabResults - Failed to fetch lab results:', err);

      let errorMessage = 'Failed to load lab results. Please try again later.';

      if (err instanceof Error) {
        if (err.message.includes('timed out')) {
          errorMessage =
            'Request timed out. The server may be experiencing high load. Please try again.';
        } else if (err.message.includes('Authentication required')) {
          if (DEMO_MODE) {
            errorMessage =
              'Authentication error in demo mode. This may indicate a server configuration issue.';
          } else {
            errorMessage = 'Your session has expired. Please log in again.';
            // Redirect to login or refresh auth
            window.location.href = '/';
            return;
          }
        } else if (err.message.includes('Failed to fetch')) {
          errorMessage =
            'Network error. Please check your connection and try again.';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);

      // If we have cached data, use it as fallback
      const cachedData = getCachedData();
      if (cachedData && !isRetry) {
        logger.debug('LabResults - Using cached data as fallback due to error');
        setLabResults(cachedData);
        setError('Showing cached data. Some information may be outdated.');
      }
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  };

  const handleRetry = () => {
    if (retryCount >= 3) {
      // Clear cache and start fresh after 3 retries
      clearCache();
      setRetryCount(0);
      setError(null);
    }
    fetchLabResults(true);
  };

  const handleRefresh = () => {
    clearCache();
    setRetryCount(0);
    setError(null);
    fetchLabResults();
  };

  useEffect(() => {
    logger.debug('LabResults - Component mounted, DEMO_MODE:', DEMO_MODE);
    fetchLabResults();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
            <p className="text-xl text-gray-600 font-medium">
              {isRetrying ? 'Retrying...' : 'Loading lab results...'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {isRetrying
                ? `Attempt ${retryCount + 1}/3 - Please wait while we retry the request`
                : 'Please wait while we fetch your laboratory data'}
            </p>

            {isRetrying && (
              <div className="mt-4">
                <button
                  onClick={() => {
                    setIsRetrying(false);
                    setLoading(false);
                    setError('Request cancelled by user.');
                  }}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
                >
                  Cancel Retry
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md mx-auto">
              <div className="text-red-600 text-4xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold text-red-800 mb-2">
                Error Loading Results
              </h2>
              <p className="text-red-700 mb-4">{error}</p>

              {retryCount > 0 && (
                <p className="text-sm text-red-600 mb-4">
                  Retry attempt: {retryCount}/3
                </p>
              )}

              <div className="space-y-3">
                <button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className={`w-full px-6 py-3 rounded-lg transition-colors duration-200 font-medium ${
                    isRetrying
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {isRetrying ? 'Retrying...' : 'Try Again'}
                </button>

                <button
                  onClick={handleRefresh}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                >
                  Refresh & Clear Cache
                </button>
              </div>

              {retryCount >= 3 && (
                <p className="text-xs text-red-500 mt-3">
                  Multiple retries failed. Try refreshing the page or contact
                  support.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!labResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 max-w-md mx-auto">
              <div className="text-gray-400 text-4xl mb-4">📋</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                No Lab Results Available
              </h2>
              <p className="text-gray-600">
                There are currently no laboratory results to display.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Lab Results
              </h1>
              <p className="text-lg text-gray-600 max-w-3xl">
                Comprehensive laboratory test results with visual indicators and
                detailed information. Click on any test to view detailed
                clinical information.
              </p>
            </div>

            <div className="flex flex-col items-end space-y-2">
              {DEMO_MODE && (
                <div className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full border border-blue-200 font-medium">
                  🚀 Demo Mode
                </div>
              )}

              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
                title="Refresh data and clear cache"
              >
                🔄 Refresh
              </button>

              {error && error.includes('cached data') && (
                <div className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded border border-yellow-200">
                  ⚠️ Showing cached data
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <LabResultsTable title="Hematology" data={labResults.hematology} />

          <LabResultsTable
            title="Differential Hematology"
            data={labResults.differential_hematology}
          />

          <LabResultsTable
            title="General Chemistry"
            data={labResults.general_chemistry}
          />

          <LabResultsTable
            title="Serum Proteins"
            data={labResults.serum_proteins}
          />
        </div>

        <div className="mt-12 bg-white rounded-xl shadow-lg p-8 border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Legend</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-green-500 rounded-full shadow-sm"></div>
              <span className="font-medium text-gray-700">
                Within normal range
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-red-500 rounded-full shadow-sm"></div>
              <span className="font-medium text-gray-700">
                Outside normal range
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-blue-600 rounded-full shadow-sm"></div>
              <span className="font-medium text-gray-700">
                Result indicator on range bar
              </span>
            </div>
          </div>
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              💡 <strong>Tip:</strong> Click on any test name to see detailed
              information about the test and its clinical significance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabResults;
