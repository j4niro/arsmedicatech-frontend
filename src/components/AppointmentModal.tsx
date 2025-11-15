import React, { useEffect, useState } from "react";
import { patientAPI } from "../services/api";
import {
  Appointment,
  CreateAppointmentData,
  appointmentService,
} from "../services/appointments";
import { useTranslation } from "react-i18next";

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date;
  selectedTime?: string;
  appointment?: Appointment;
  onAppointmentCreated?: (appointment: Appointment) => void;
  onAppointmentUpdated?: (appointment: Appointment) => void;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  demographic_no: string;
}

const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  selectedTime,
  appointment,
  onAppointmentCreated,
  onAppointmentUpdated,
}) => {
  const { t } = useTranslation();

  const [formData, setFormData] = useState<CreateAppointmentData>({
    patient_id: "",
    appointment_date: selectedDate
      ? selectedDate.toISOString().split("T")[0]
      : "",
    start_time: selectedTime || "09:00",
    end_time: "09:30",
    appointment_type: "consultation",
    notes: "",
    location: "",
  });

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [availableSlots, setAvailableSlots] = useState<
    Array<{ start_time: string; end_time: string }>
  >([]);

  useEffect(() => {
    if (isOpen) {
      loadPatients();
      if (selectedDate) {
        loadAvailableSlots(selectedDate.toISOString().split("T")[0]);
      }
    }
  }, [isOpen, selectedDate]);

  useEffect(() => {
    if (appointment) {
      setFormData({
        patient_id: appointment.patient_id,
        appointment_date: appointment.appointment_date,
        start_time: appointment.start_time,
        end_time: appointment.end_time,
        appointment_type: appointment.appointment_type,
        notes: appointment.notes || "",
        location: appointment.location || "",
      });
    }
  }, [appointment]);

  const loadPatients = async () => {
    try {
      const response = await patientAPI.getAll();
      setPatients(response.patients || []);
    } catch {
      setError("Failed to load patients");
    }
  };

  const loadAvailableSlots = async (date: string) => {
    try {
      const slots = await appointmentService.getAvailableSlots(date);
      setAvailableSlots(slots);
    } catch {}
  };

  const handleInputChange = (
    field: keyof CreateAppointmentData,
    value: string
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === "appointment_date") loadAvailableSlots(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (appointment) {
        await appointmentService.updateAppointment(appointment.id, formData);
        onAppointmentUpdated?.(appointment);
      } else {
        const newAppointment =
          await appointmentService.createAppointment(formData);
        onAppointmentCreated?.(newAppointment);
      }
      onClose();
    } catch (error: any) {
      setError(error.message || "Failed to save appointment");
    } finally {
      setLoading(false);
    }
  };

  const calculateEndTime = (
    startTime: string,
    durationMinutes: number = 30
  ) => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    startDate.setMinutes(startDate.getMinutes() + durationMinutes);
    return startDate.toTimeString().slice(0, 5);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {appointment ? t("editAppointment") : t("newAppointment")}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("patient")} *
            </label>
            <select
              value={formData.patient_id}
              onChange={e => handleInputChange("patient_id", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            >
              <option value="">{t("selectPatient")}</option>
              {patients.map(patient => (
                <option key={patient.id} value={patient.id}>
                  {patient.first_name} {patient.last_name} (ID:{" "}
                  {patient.demographic_no})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t("date")} *</label>
            <input
              type="date"
              value={formData.appointment_date}
              onChange={e =>
                handleInputChange("appointment_date", e.target.value)
              }
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("startTime")} *
              </label>
              <select
                value={formData.start_time}
                onChange={e => {
                  handleInputChange("start_time", e.target.value);
                  handleInputChange(
                    "end_time",
                    calculateEndTime(e.target.value)
                  );
                }}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                {availableSlots.map(slot => (
                  <option key={slot.start_time} value={slot.start_time}>
                    {slot.start_time}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {t("endTime")} *
              </label>
              <input
                type="time"
                value={formData.end_time}
                onChange={e => handleInputChange("end_time", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t("type")}</label>
            <select
              value={formData.appointment_type}
              onChange={e =>
                handleInputChange("appointment_type", e.target.value)
              }
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="consultation">{t("consultation")}</option>
              <option value="follow_up">{t("followUp")}</option>
              <option value="emergency">{t("emergency")}</option>
              <option value="routine">{t("routineCheck")}</option>
              <option value="specialist">{t("specialistVisit")}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t("location")}
            </label>
            <input
              type="text"
              placeholder={t("locationPlaceholder")}
              value={formData.location}
              onChange={e => handleInputChange("location", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t("notes")}</label>
            <textarea
              placeholder={t("notesPlaceholder")}
              value={formData.notes}
              onChange={e => handleInputChange("notes", e.target.value)}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
            >
              {loading ? t("saving") : appointment ? t("update") : t("create")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentModal;
