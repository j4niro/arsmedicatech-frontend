import React, { useEffect, useState } from "react";
import { EncounterType, SOAPNotesType } from "../types";
import { useTranslation } from "react-i18next";

interface EncounterFormProps {
  encounter?: EncounterType | null;
  patientId?: string;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function EncounterForm({
  encounter,
  patientId,
  onSubmit,
  onCancel,
  isLoading = false,
}: EncounterFormProps) {
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    provider_id: "",
    date_created: "",
    note_text: "",
    diagnostic_codes: [] as string[],
    status: "",
    soap_notes: {
      subjective: "",
      objective: "",
      assessment: "",
      plan: "",
    } as SOAPNotesType,
  });

  const [diagnosticCode, setDiagnosticCode] = useState("");

  useEffect(() => {
    if (encounter) {
      setFormData({
        provider_id: encounter.provider_id || "",
        date_created: encounter.date_created ? encounter.date_created.split("T")[0] : "",
        note_text: typeof encounter.note_text === "string" ? encounter.note_text : "",
        diagnostic_codes: encounter.diagnostic_codes || [],
        status: encounter.status || "",
        soap_notes:
          (typeof encounter.note_text === "object" && encounter.note_text !== null) ||
          encounter.note_type === "soap"
            ? (encounter.note_text as SOAPNotesType)
            : { subjective: "", objective: "", assessment: "", plan: "" },
      });
    } else {
      setFormData(prev => ({
        ...prev,
        date_created: new Date().toISOString().split("T")[0],
      }));
    }
  }, [encounter]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSOAPChange = (field: keyof SOAPNotesType, value: string) => {
    setFormData(prev => ({
      ...prev,
      soap_notes: { ...prev.soap_notes, [field]: value },
    }));
  };

  const addDiagnosticCode = () => {
    if (diagnosticCode.trim()) {
      setFormData(prev => ({
        ...prev,
        diagnostic_codes: [...prev.diagnostic_codes, diagnosticCode.trim()],
      }));
      setDiagnosticCode("");
    }
  };

  const removeDiagnosticCode = (index: number) => {
    setFormData(prev => ({
      ...prev,
      diagnostic_codes: prev.diagnostic_codes.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = { ...formData, note_text: formData.soap_notes };
    delete submitData.soap_notes;
    onSubmit(submitData);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">
        {encounter ? t("editEncounter") : t("newEncounter")}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">{t("basicInformation")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">{t("providerId")} *</label>
              <input
                type="text"
                name="provider_id"
                value={formData.provider_id}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t("date")} *</label>
              <input
                type="date"
                name="date_created"
                value={formData.date_created}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t("status")}</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">{t("selectStatus")}</option>
                <option value="draft">Draft</option>
                <option value="completed">Completed</option>
                <option value="signed">Signed</option>
                <option value="locked">Locked</option>
              </select>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg">
          <div className="bg-blue-50 px-6 py-4 border-b rounded-t-lg">
            <h3 className="text-lg font-semibold">{t("soapNotes")}</h3>
            <p className="text-sm text-blue-700">{t("soapDescription")}</p>
          </div>

          <div className="p-6 space-y-6">
            {(["subjective", "objective", "assessment", "plan"] as const).map(field => (
              <div key={field} className="border-l-4 pl-4" style={{ borderColor: "#2563eb" }}>
                <label className="block text-sm font-semibold mb-2 uppercase tracking-wide">
                  {t(field)}
                </label>
                <textarea
                  value={formData.soap_notes[field]}
                  onChange={e => handleSOAPChange(field, e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">{t("diagnosticCodes")}</h3>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={diagnosticCode}
              onChange={e => setDiagnosticCode(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md"
            />
            <button type="button" onClick={addDiagnosticCode} className="px-4 py-2 bg-green-600 text-white rounded-md">
              {t("add")}
            </button>
          </div>

          {formData.diagnostic_codes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.diagnostic_codes.map((code, index) => (
                <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                  {code}
                  <button type="button" onClick={() => removeDiagnosticCode(index)} className="ml-2">
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-4 pt-4 border-t">
          <button type="button" onClick={onCancel} className="px-6 py-2 bg-gray-200 rounded-md">
            {t("cancel")}
          </button>
          <button type="submit" disabled={isLoading} className="px-6 py-2 bg-blue-600 text-white rounded-md">
            {isLoading ? t("saving") : encounter ? t("updateEncounter") : t("createEncounter")}
          </button>
        </div>
      </form>
    </div>
  );
}
