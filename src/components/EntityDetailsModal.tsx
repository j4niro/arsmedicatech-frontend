import { EntityType } from "../types";
import { useTranslation } from "react-i18next";

interface EntityDetailsModalProps {
  entity: EntityType | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EntityDetailsModal({
  entity,
  isOpen,
  onClose,
}: EntityDetailsModalProps) {
  const { t } = useTranslation();

  if (!isOpen || !entity) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {t("entityDetails")}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("entityText")}
            </label>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <span className="text-blue-900 font-medium">{entity.text}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("entityType")}
            </label>
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
              <span className="text-gray-900">{entity.label}</span>
            </div>
          </div>

          {entity.cui && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("umlsCui")}
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                <span className="text-gray-900 font-mono text-sm">{entity.cui}</span>
              </div>
            </div>
          )}

          {entity.icd10cm && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("icd10Code")}
              </label>
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <span className="text-green-900 font-mono font-medium">
                  {entity.icd10cm}
                </span>
              </div>
            </div>
          )}

          {entity.icd10cm_name && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("icd10Description")}
              </label>
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <span className="text-green-900">{entity.icd10cm_name}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("startPosition")}
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                <span className="text-gray-900">{entity.start_char}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("endPosition")}
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                <span className="text-gray-900">{entity.end_char}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
}
