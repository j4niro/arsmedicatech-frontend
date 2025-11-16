import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import React from 'react';
import { useTranslation } from "react-i18next";
import { EncounterType, PatientType } from '../types';

export function SearchResultsTable({
  rows,
  isLoading = false,
  onRowClick,
}: {
  rows: (PatientType | EncounterType)[];
  isLoading?: boolean;
  onRowClick?: (item: PatientType | EncounterType) => void;
}) {

  const { t } = useTranslation();

  const columns = React.useMemo(
    () => [
      {
        id: 'patient_name',
        header: t("patientName"),
        cell: (ctx: any) => {
          const item = ctx.row.original;
          if ('patient' in item && item.patient) {
            return (
              `${item.patient.first_name || ''} ${item.patient.last_name || ''}`.trim() ||
              '-'
            );
          } else {
            return (
              `${item.first_name || ''} ${item.last_name || ''}`.trim() || '-'
            );
          }
        },
      },
      {
        id: 'patient_dob',
        header: t("dob"),
        cell: (ctx: any) => {
          const item = ctx.row.original;
          const dob =
            'patient' in item && item.patient ? item.patient.date_of_birth : item.date_of_birth;
          return dob ? new Date(dob).toLocaleDateString() : '-';
        },
      },
      {
        id: 'visit_date',
        header: t("visitDate"),
        cell: (ctx: any) =>
          'date_created' in ctx.row.original
            ? (ctx.row.original.date_created
                ? new Date(ctx.row.original.date_created).toLocaleDateString()
                : '-')
            : '-',
      },
      {
        accessorKey: 'highlighted_note',
        header: t("snippet"),
        cell: (ctx: any): JSX.Element => (
          <div dangerouslySetInnerHTML={{ __html: ctx.getValue() || '' }} />
        ),
      },
    ],
    [t]
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) return <p className="p-4">{t("loading")}</p>;

  return (
    <table className="min-w-full text-sm">
      <thead className="bg-gray-50 text-left font-semibold">
        {table.getHeaderGroups().map(hg => (
          <tr key={hg.id}>
            {hg.headers.map(header => (
              <th key={header.id} className="px-4 py-2">
                {flexRender(header.column.columnDef.header, header.getContext())}
              </th>
            ))}
          </tr>
        ))}
      </thead>

      <tbody className="divide-y divide-gray-200">
        {table.getRowModel().rows.map(row => (
          <tr
            key={row.id}
            className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
            onClick={() => onRowClick && onRowClick(row.original)}
          >
            {row.getVisibleCells().map(cell => (
              <td key={cell.id} className="px-4 py-2">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function PatientTable({
  patients,
  isLoading = false,
  onEdit,
  onDelete,
  onView,
  onRowClick,
  onSelect,
}: {
  patients: PatientType[];
  isLoading?: boolean;
  onEdit?: (patient: PatientType) => void;
  onDelete?: (patient: PatientType) => void;
  onView?: (patient: PatientType) => void;
  onRowClick?: (patient: PatientType) => void;
  onSelect?: (patient: PatientType) => void;
}) {

  const { t } = useTranslation();

  const columns = React.useMemo(
    () => [
      { accessorKey: 'demographic_no', header: t("id") },
      { accessorKey: 'first_name', header: t("firstName") },
      { accessorKey: 'last_name', header: t("lastName") },
      {
        accessorKey: 'date_of_birth',
        header: t("dob"),
        cell: (ctx: any) =>
          ctx.getValue() ? new Date(ctx.getValue()).toLocaleDateString() : '-',
      },
      { accessorKey: 'phone', header: t("phone") },
      { accessorKey: 'email', header: t("email") },
      {
        id: 'actions',
        header: t("actions"),
        cell: (ctx: any) => {
          const patient = ctx.row.original;
          return (
            <div className="flex space-x-2">
              {onSelect && (
                <button onClick={(e) => { e.stopPropagation(); onSelect(patient); }} className="btn-green">
                  {t("select")}
                </button>
              )}
              {onView && (
                <button onClick={(e) => { e.stopPropagation(); onView(patient); }} className="btn-blue">
                  {t("view")}
                </button>
              )}
              {onEdit && (
                <button onClick={(e) => { e.stopPropagation(); onEdit(patient); }} className="btn-yellow">
                  {t("edit")}
                </button>
              )}
              {onDelete && (
                <button onClick={(e) => { e.stopPropagation(); onDelete(patient); }} className="btn-red">
                  {t("delete")}
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [t, onEdit, onDelete, onView, onSelect]
  );

  const table = useReactTable({ data: patients, columns, getCoreRowModel: getCoreRowModel() });

  if (isLoading) return <p className="p-4">{t("loading")}</p>;
  if (!patients.length) return <p className="p-4 text-gray-500">{t("empty")}</p>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map(hg => (
            <tr key={hg.id}>
              {hg.headers.map(header => (
                <th key={header.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {table.getRowModel().rows.map(row => (
            <tr key={row.id} className="hover:bg-gray-50" onClick={() => onRowClick && onRowClick(row.original)}>
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
