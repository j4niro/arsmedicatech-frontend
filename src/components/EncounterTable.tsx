import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React from "react";
import { EncounterType } from "../types";
import { useTranslation } from "react-i18next";

export function EncounterTable({
  encounters,
  isLoading = false,
  onEdit,
  onDelete,
  onView,
  onRowClick,
}: {
  encounters: EncounterType[];
  isLoading?: boolean;
  onEdit?: (encounter: EncounterType) => void;
  onDelete?: (encounter: EncounterType) => void;
  onView?: (encounter: EncounterType) => void;
  onRowClick?: (encounter: EncounterType) => void;
}) {
  const { t } = useTranslation();

  const columns = React.useMemo(
    () => [
      { accessorKey: "note_id", header: t("noteId") },
      {
        accessorKey: "date_created",
        header: t("visitDate"),
        cell: (ctx: any) => {
          const value = ctx.getValue();
          return value ? new Date(value).toLocaleDateString() : "-";
        },
      },
      { accessorKey: "provider_id", header: t("provider") },
      {
        accessorKey: "note_text",
        header: t("notes"),
        cell: (ctx: any) => {
          const value = ctx.getValue();
          return typeof value === "string" && value.length > 80
            ? value.substring(0, 80) + "..."
            : value || "-";
        },
      },
      {
        accessorKey: "diagnostic_codes",
        header: t("diagnosticCodes"),
        cell: (ctx: any) => {
          const value = ctx.getValue();
          return value && Array.isArray(value) ? value.join(", ") : "-";
        },
      },
      { accessorKey: "status", header: t("status") },
      {
        id: "actions",
        header: t("actions"),
        cell: (ctx: any) => {
          const encounter = ctx.row.original;
          return (
            <div className="flex space-x-2">
              {onView && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onView(encounter);
                  }}
                  className="px-3 py-1 bg-blue-500 text-white rounded"
                >
                  {t("view")}
                </button>
              )}
              {onEdit && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onEdit(encounter);
                  }}
                  className="px-3 py-1 bg-yellow-500 text-white rounded"
                >
                  {t("edit")}
                </button>
              )}
              {onDelete && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onDelete(encounter);
                  }}
                  className="px-3 py-1 bg-red-500 text-white rounded"
                >
                  {t("delete")}
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [t, onEdit, onDelete, onView]
  );

  const table = useReactTable({
    data: encounters,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) return <p className="p-4">{t("loadingEncounters")}</p>;
  if (!encounters || encounters.length === 0)
    return <p className="p-4 text-gray-500">{t("noEncounters")}</p>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th key={header.id} className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>

        <tbody className="bg-white divide-y divide-gray-200">
          {table.getRowModel().rows.map(row => (
            <tr
              key={row.id}
              onClick={() => onRowClick?.(row.original)}
              className={`${onRowClick ? "cursor-pointer hover:bg-gray-50" : ""}`}
            >
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} className="px-6 py-4 text-sm">
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
