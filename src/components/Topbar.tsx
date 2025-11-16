import React, { useState, ChangeEvent } from "react";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { Notification } from "../hooks/useNotifications";
import { useSignupPopup } from "../hooks/useSignupPopup";
import authService from "../services/auth";
import NotificationIndicator from "./NotificationIndicator";
import SignupPopup from "./SignupPopup";
import "./Topbar.css";
import { useUser } from "./UserContext";

import { useTranslation } from "react-i18next";

interface Props {
  unreadCount: number;
  recentNotifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearNotification: (id: string) => void;
  onClearAll: () => void;
}

export default function Topbar(props: Props) {
  const { user, isAuthenticated, setUser } = useUser();
  const { isPopupOpen, showSignupPopup, hideSignupPopup } = useSignupPopup();

  const { i18n, t } = useTranslation();
const [lang, setLang] = useState<string>(i18n.language || "en");
    console.log("Langue actuelle :", i18n.language);

  const handleLanguageChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const newLang = event.target.value;
    i18n.changeLanguage(newLang);
    setLang(newLang);
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      setUser(null);
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  console.log("Langue actuelle :", i18n.language); // 🧠 Debug utile

  return (
    <>
      <header className="topbar">
        <div className="topbar-actions">
          {/* 🔔 Indicateur de notifications */}
          {isAuthenticated && (
            <NotificationIndicator
              unreadCount={props.unreadCount}
              recentNotifications={props.recentNotifications}
              onMarkAsRead={props.onMarkAsRead}
              onMarkAllAsRead={props.onMarkAllAsRead}
              onClearNotification={props.onClearNotification}
              onClearAll={props.onClearAll}
            />
          )}

          {/* 🌍 Sélecteur de langue */}
          <div className="language-container" style={{ marginRight: "12px" }}>
            <select
              value={lang}
              onChange={handleLanguageChange}
              className="language-selector"
              style={{
                padding: "6px 10px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                cursor: "pointer",
                backgroundColor: "white",
                fontSize: "14px",
              }}
            >
              <option value="en">🇬🇧 English</option>
              <option value="fr">🇫🇷 Français</option>
            </select>
          </div>

          {/* 👤 Authentification utilisateur */}
          <div className="auth-status">
            {isAuthenticated && user ? (
              <div className="profile-container">
                <span className="user-name">
                  {`${user.first_name || ""} ${user.last_name || ""}`.trim() ||
                    user.username}
                </span>
                <span className="user-role">{user.role}</span>
                <button onClick={handleLogout} className="logout-button">
                  <ArrowRightOnRectangleIcon className="logout-icon" />
                  {t("logout")}
                </button>
              </div>
            ) : (
              <div className="guest-auth">
                <span className="guest-label">{t("guestUser")}</span>
                <button onClick={showSignupPopup} className="auth-button">
                  {t("login")}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="release-info">Version 0.0.1 (alpha)</div>
      </header>

      <SignupPopup isOpen={isPopupOpen} onClose={hideSignupPopup} />
    </>
  );
}
