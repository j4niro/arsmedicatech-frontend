// Sidebar.tsx (updated with comments explaining changes)
import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { usePluginWidgets } from "../hooks/usePluginWidgets";
import logger from "../services/logging";
import "./Sidebar.css";
import authService from "../services/auth";
import { useUser } from "./UserContext";
import { useTranslation } from "react-i18next";
import { appointmentService } from "../services/appointments";

// Utility functions (assuming they are defined elsewhere; if not, you can define them here)
const is_today = (dateString: string) => {
  const today = new Date().toISOString().split("T")[0];
  return dateString === today;
};

const is_in_past = (dateTime: Date) => {
  const now = new Date();
  return dateTime < now;
};

const isAuthenticated = authService.isAuthenticated();

const Sidebar = () => {
  const { user, isLoading } = useUser();
  const userType = user?.role || "guest";
  const widgets = usePluginWidgets();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { t } = useTranslation();
  const [appointments, setAppointments] = useState<any[]>([]);

  logger.debug("Sidebar user:", user);

  // MODIFICATION: Extracted fetchAppointments into a reusable function for easier calling
  const fetchAppointments = async () => {
    if (isAuthenticated) {
      const user = authService.getUser();
      const userId = user?.id?.split(":")[1] || user?.id;
      console.log("Current User ID:", userId);
      const response = await appointmentService.getAppointments(userId);
      console.log("appointments", response);
      setAppointments(response.appointments || []);
    }
  };

  // Fetch appointments on mount and when authenticated changes
  useEffect(() => {
    fetchAppointments();
  }, [isAuthenticated]);

  // MODIFICATION: Added event listener for 'appointmentCreated' event to refresh appointments
  // This listens for the custom event dispatched from Schedule.tsx when a new appointment is created,
  // ensuring the Sidebar updates its remaining appointments count in real-time
  useEffect(() => {
    const handleAppointmentCreated = () => {
      console.log("Appointment created event received, refreshing sidebar...");
      fetchAppointments();
    };

    window.addEventListener("appointmentCreated", handleAppointmentCreated);

    return () => {
      window.removeEventListener(
        "appointmentCreated",
        handleAppointmentCreated
      );
    };
  }, []);

  if (isLoading) return null;

  // Calculate remaining appointments for today
  const remainingToday = appointments.filter((apt: any) => {
    const aptDate = apt.appointment_date;
    const aptTime = apt.start_time;
    const aptDateTime = new Date(`${aptDate}T${aptTime}`);
    return is_today(aptDate) && !is_in_past(aptDateTime);
  }).length;

  return (
    <aside className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <div className="logo-container">ArsMedicaTech</div>
        <div className="release-info">Version 0.0.1 (alpha)</div>
        <button
          className="sidebar-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? t("expand") : t("collapse")}
        >
          {isCollapsed ? "→" : "←"}
        </button>
      </div>

      <nav className={isCollapsed ? "collapsed" : ""}>
        <ul>
          <li>
            <NavLink
              to="/"
              className={({ isActive }) => (isActive ? "active" : "")}
              title={t("dashboard")}
            >
              {isCollapsed ? "📊" : t("dashboard")}
            </NavLink>
          </li>

          {(userType === "administrator" ||
            userType === "superadmin" ||
            userType === "admin") && (
            <>
              <li>
                <NavLink
                  to="/organization"
                  className={({ isActive }) => (isActive ? "active" : "")}
                  title={t("organization")}
                >
                  {isCollapsed ? "🏢" : t("organization")}
                </NavLink>
              </li>

              <li>
                <NavLink
                  to="/admin"
                  className={({ isActive }) => (isActive ? "active" : "")}
                  title={t("admin")}
                >
                  {isCollapsed ? "⚙️" : t("admin")}
                </NavLink>
              </li>
            </>
          )}

          {userType === "patient" ? (
            <>
              {user?.id && (
                <li>
                  <NavLink
                    to={`/intake/${user.id}`}
                    className={({ isActive }) => (isActive ? "active" : "")}
                    title={t("intakeForm")}
                  >
                    {isCollapsed ? "📝" : t("intakeForm")}
                  </NavLink>
                </li>
              )}
              <li>
                <NavLink
                  to="/health-metrics"
                  className={({ isActive }) => (isActive ? "active" : "")}
                  title={t("healthMetrics")}
                >
                  {isCollapsed ? "📈" : t("healthMetrics")}
                </NavLink>
              </li>
            </>
          ) : (
            <>
              <li>
                <NavLink
                  to="/patients"
                  className={({ isActive }) => (isActive ? "active" : "")}
                  title={t("patients")}
                >
                  {isCollapsed ? "👥" : t("patients")}
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/optimal-table-demo"
                  className={({ isActive }) => (isActive ? "active" : "")}
                  title={t("optimalDemo")}
                >
                  {isCollapsed ? "📊" : t("optimalDemo")}
                </NavLink>
              </li>
            </>
          )}

          <li>
            <NavLink
              to="/lab-results"
              className={({ isActive }) => (isActive ? "active" : "")}
              title={t("labResults")}
            >
              {isCollapsed ? "🧪" : t("labResults")}
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/messages"
              className={({ isActive }) => (isActive ? "active" : "")}
              title={t("messages")}
            >
              {isCollapsed ? "💬" : t("messages")}
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/schedule"
              className={({ isActive }) => (isActive ? "active" : "")}
              title={t("schedule")}
            >
              {isCollapsed ? "📅" : t("schedule")}
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/settings"
              className={({ isActive }) => (isActive ? "active" : "")}
              title={t("settings")}
            >
              {isCollapsed ? "⚙️" : t("settings")}
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/uploads"
              className={({ isActive }) => (isActive ? "active" : "")}
              title={t("uploads")}
            >
              {isCollapsed ? "📁" : t("uploads")}
            </NavLink>
          </li>

          {widgets.map((widget) => (
            <li key={widget.name}>
              <NavLink
                to={widget.path}
                className={({ isActive }) => (isActive ? "active" : "")}
                title={isCollapsed ? widget.name : ""}
              >
                {isCollapsed ? "🔧" : widget.name}
              </NavLink>
            </li>
          ))}

          <li>
            <NavLink
              to="/notes"
              className={({ isActive }) => (isActive ? "active" : "")}
              title={t("notes")}
            >
              {isCollapsed ? "📝" : t("notes")}
            </NavLink>
          </li>
        </ul>
      </nav>

      {!isCollapsed && (
        <div className="sidebar-footer">
          <div className="corner-user-avatar"></div>
          <div className="corner-user-info">
            <h4>
              {t("hello")}, {user?.username}
            </h4>
            <p>{t("remainingAppointments", { count: remainingToday })}</p>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
