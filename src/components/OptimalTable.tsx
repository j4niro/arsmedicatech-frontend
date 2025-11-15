import React, { useEffect, useState } from 'react';
import { useTranslation } from "react-i18next";

export interface TableColumn {
  key: string;
  header: string;
  type: 'text' | 'number' | 'boolean';
  editable?: boolean;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export interface TableRow {
  id: string;
  [key: string]: any;
}

interface OptimalTableProps {
  columns: TableColumn[];
  data: TableRow[];
  title?: string;
  onDataChange?: (newData: TableRow[]) => void;
  showAddRow?: boolean;
  showDeleteRow?: boolean;
  maxRows?: number;
  className?: string;
}

const OptimalTable: React.FC<OptimalTableProps> = ({
  columns,
  data,
  title,
  onDataChange,
  showAddRow = true,
  showDeleteRow = true,
  maxRows,
  className = '',
}) => {
  const { t } = useTranslation();
  const [tableData, setTableData] = useState<TableRow[]>(data);
  const [editingCell, setEditingCell] = useState<{ rowId: string; columnKey: string } | null>(null);

  useEffect(() => {
    setTableData(data);
  }, [data]);

  const handleCellChange = (rowId: string, columnKey: string, value: any) => {
    const newData = tableData.map(row =>
      row.id === rowId ? { ...row, [columnKey]: value } : row
    );
    setTableData(newData);
    onDataChange?.(newData);
  };

  const handleAddRow = () => {
    if (maxRows && tableData.length >= maxRows) return;

    const newRow: TableRow = {
      id: `row-${Date.now()}-${Math.random()}`,
      ...Object.fromEntries(columns.map(col => [
        col.key,
        col.type === 'boolean' ? false : col.type === 'number' ? 0 : '',
      ])),
    };

    const newData = [...tableData, newRow];
    setTableData(newData);
    onDataChange?.(newData);
  };

  const handleDeleteRow = (rowId: string) => {
    const newData = tableData.filter(row => row.id !== rowId);
    setTableData(newData);
    onDataChange?.(newData);
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
      {title && (
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">{t(title)}</h3>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              {columns.map(column => (
                <th key={column.key} className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <span>{t(column.header)}</span>
                    {column.unit && <span className="text-xs text-gray-400 font-normal">({column.unit})</span>}
                  </div>
                </th>
              ))}
              {showDeleteRow && (
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  {t("actions")}
                </th>
              )}
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-100">
            {tableData.map(row => (
              <tr key={row.id} className="hover:bg-gray-50 transition-colors duration-150">
                {columns.map(column => (
                  <td key={`${row.id}-${column.key}`} className="whitespace-nowrap">
                    {/* same renderCell code unchanged */}
                    {column.type === 'boolean' ? (
                      <div className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={row[column.key] || false}
                          onChange={e => handleCellChange(row.id, column.key, e.target.checked)}
                          className="w-4 h-4"
                        />
                      </div>
                    ) : column.type === 'number' ? (
                      <div className="px-3 py-2">
                        <input
                          type="number"
                          value={row[column.key] || ''}
                          onChange={e => handleCellChange(row.id, column.key, parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 border rounded"
                        />
                      </div>
                    ) : (
                      <div className="px-3 py-2">
                        <input
                          type="text"
                          value={row[column.key] || ''}
                          onChange={e => handleCellChange(row.id, column.key, e.target.value)}
                          className="w-full px-2 py-1 border rounded"
                        />
                      </div>
                    )}
                  </td>
                ))}

                {showDeleteRow && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleDeleteRow(row.id)}
                      className="text-red-600 hover:text-red-900"
                      title={t("deleteRow")}
                    >
                      ✕
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddRow && (!maxRows || tableData.length < maxRows) && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleAddRow}>
            {t("addRow")}
          </button>
        </div>
      )}

      {maxRows && tableData.length >= maxRows && (
        <div className="px-6 py-3 bg-yellow-50 border-t border-yellow-200">
          <p className="text-sm text-yellow-700">{t("maxRowsReached", { count: maxRows })}</p>
        </div>
      )}
    </div>
  );
};

export default OptimalTable;
