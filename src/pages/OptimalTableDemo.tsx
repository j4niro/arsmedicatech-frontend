import React, { useState } from 'react';
import OptimalTable, { TableColumn, TableRow } from '../components/OptimalTable';
import apiService from '../services/api';
import { useTranslation } from 'react-i18next';

const OptimalTableDemo: React.FC = () => {
  const { t } = useTranslation();

  const columns: TableColumn[] = [
    { key: 'food', header: t('food_item'), type: 'text', editable: true },
    { key: 'sodium_mg', header: t('sodium'), type: 'number', editable: true, unit: 'mg', min: 0, max: 1000 },
    { key: 'potassium_mg', header: t('potassium'), type: 'number', editable: true, unit: 'mg', min: 0, max: 2000 },
    { key: 'fiber_g', header: t('fiber'), type: 'number', editable: true, unit: 'g', min: 0, max: 50 },
    { key: 'saturated_fat_g', header: t('saturated_fat'), type: 'number', editable: true, unit: 'g', min: 0, max: 50 },
    { key: 'calories', header: t('calories'), type: 'number', editable: true, unit: 'kcal', min: 0, max: 1000 },
    { key: 'allergy', header: t('allergy_risk'), type: 'boolean', editable: true }
  ];

  const initialData: TableRow[] = [
    { id: '1', food: 'Oats', sodium_mg: 2, potassium_mg: 429, fiber_g: 10.6, saturated_fat_g: 1.1, calories: 389, allergy: false },
    { id: '2', food: 'Salmon', sodium_mg: 59, potassium_mg: 628, fiber_g: 0, saturated_fat_g: 1.0, calories: 208, allergy: false },
    { id: '3', food: 'Spinach', sodium_mg: 79, potassium_mg: 558, fiber_g: 2.2, saturated_fat_g: 0, calories: 23, allergy: false },
    { id: '4', food: 'Banana', sodium_mg: 1, potassium_mg: 358, fiber_g: 2.6, saturated_fat_g: 0.1, calories: 89, allergy: false },
    { id: '5', food: 'Almonds', sodium_mg: 1, potassium_mg: 705, fiber_g: 12.5, saturated_fat_g: 3.8, calories: 579, allergy: true }
  ];

  const [tableData, setTableData] = useState<TableRow[]>(initialData);
  const [isProcessing, setIsProcessing] = useState(false);
  const [optimalResult, setOptimalResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDataChange = (newData: TableRow[]) => {
    setTableData(newData);
  };

  const handleExportData = () => {
    const csvContent = [
      columns.map(col => col.header).join(','),
      ...tableData.map(row => columns.map(col => row[col.key]).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'food_nutrition_data.csv';
    a.click();

    window.URL.revokeObjectURL(url);
  };

  const handleResetData = () => {
    setTableData(initialData);
    setOptimalResult(null);
    setError(null);
  };

  const handleProcessWithOptimal = async () => {
    setIsProcessing(true);
    setError(null);
    setOptimalResult(null);

    try {
      const result = await apiService.callOptimal(tableData);
      setOptimalResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error_process'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* HEADER */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {t('title')}
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          {t('description')}
        </p>

        {/* BUTTONS */}
        <div className="mb-6 flex space-x-4">
          <button onClick={handleExportData}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            {t('export_csv')}
          </button>

          <button onClick={handleResetData}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
            {t('reset_data')}
          </button>

          <button onClick={handleProcessWithOptimal}
            disabled={isProcessing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400">
            {isProcessing ? t('processing') : t('process_optimal')}
          </button>
        </div>

        {/* TABLE */}
        <OptimalTable
          columns={columns}
          data={tableData}
          title={t('table_title')}
          onDataChange={handleDataChange}
          showAddRow={true}
          showDeleteRow={true}
          maxRows={20}
          className="mb-8"
        />

        {/* ERROR */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-red-800">
              {t('error_title')}
            </h3>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        )}

        {/* OPTIMAL RESULTS */}
        {optimalResult && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-green-800 mb-4">
              {t('optimal_results')}
            </h3>

            {optimalResult.result && (
              <>
                <h4 className="text-lg font-medium text-green-700 mb-3">
                  {t('optimization_results')}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <span className="font-medium">{t('status')}:</span>
                    <div>{optimalResult.result.status}</div>
                  </div>

                  {optimalResult.result.fun && (
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <span className="font-medium">{t('objective_value')}:</span>
                      <div>{optimalResult.result.fun.toFixed(4)}</div>
                    </div>
                  )}

                  {optimalResult.result.nit && (
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <span className="font-medium">{t('iterations')}:</span>
                      <div>{optimalResult.result.nit}</div>
                    </div>
                  )}
                </div>

                {/* EXPLANATION */}
                {optimalResult.result.fun && (
                  <div className="mt-6 bg-yellow-50 p-4 border border-yellow-200 rounded-lg">
                    <h5 className="font-medium">{t('objective_meaning_title')}</h5>
                    <p className="text-sm mt-2">{t('objective_meaning_text')}</p>
                  </div>
                )}

                {/* SERVINGS */}
                {optimalResult.result.x && (
                  <>
                    <h5 className="mt-6 font-medium text-green-700">
                      {t('recommended_servings')}
                    </h5>

                    {/* BARS */}
                    <div className="mt-4 space-y-2">
                      {optimalResult.result.x.map((serving: number, index: number) => {
                        const foodItem = optimalResult.tableData[index];
                        const rounded = Math.round(serving * 100) / 100;
                        const isRecommended = serving > 0.01;

                        return (
                          <div key={index} className="flex items-center space-x-3">
                            <div className="w-24">{foodItem?.food}</div>
                            <div className="flex-1 bg-gray-200 h-4 rounded-full">
                              <div
                                className={`h-4 rounded-full ${isRecommended ? 'bg-green-600' : 'bg-gray-400'}`}
                                style={{ width: `${serving * 100}%` }}
                              />
                            </div>
                            <div className="w-16 text-right font-bold">
                              {rounded > 0.01 ? `${rounded}g` : '0g'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </>
            )}

            {/* RAW PROCESSED DATA */}
            <div className="mt-6">
              <h4 className="font-medium text-green-700 mb-2">
                {t('processed_data')}
              </h4>
              <pre className="bg-white p-4 rounded-lg border text-sm overflow-auto">
                {JSON.stringify(optimalResult.tableData, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* CURRENT TABLE DATA */}
        <div className="bg-white p-6 rounded-xl shadow-md border">
          <h3 className="font-semibold mb-4">{t('current_data')}</h3>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
            {JSON.stringify(tableData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default OptimalTableDemo;
