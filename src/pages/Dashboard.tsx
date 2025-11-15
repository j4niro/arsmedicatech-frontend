import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import BarChart from '../components/BarChart';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';
import SignupPopup from '../components/SignupPopup';
import { useUser } from '../components/UserContext';
import { API_URL } from '../env_vars';
import { useSignupPopup } from '../hooks/useSignupPopup';
import apiService from '../services/api';
import authService from '../services/auth';
import logger from '../services/logging';
import { useTranslation } from "react-i18next";

const Panel1 = () => {
  const { t } = useTranslation();
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    fetch(`${API_URL}/time`, {
      headers: {
        'Access-Control-Allow-Origin': 'http://127.0.0.1:3010',
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })
      .then(res => res.json())
      .then(data => {
        setCurrentTime(data.time);
      });
  }, []);

  return (
    <header className="App-header">
      <p>{t("current_time")}: {currentTime}</p>
      <p><Link to="patients">{t("Patients")}</Link></p>
      <p><Link to="about">{t("About")}</Link></p>
      <p><Link to="contact">{t("Contact")}</Link></p>

      <button className="sidebar-toggle-button">{t("toggle_sidebar")}</button>
      <button className="profile-button">{t("profile")}</button>
    </header>
  );
};

const DashboardOld = () => {
  const { t } = useTranslation();

  return (
    <div className="dashboard">
      <h2>{t("Dashboard")}</h2>
      <div className="cards-grid">
        <div className="card"><Panel1 /></div>
        <div className="card"><BarChart /></div>
        <div className="card">{t("Panel 3")}</div>
        <div className="card">{t("Panel 4")}</div>
      </div>
    </div>
  );
};

const dashboardData = {
  totalPatients: '1,083',
  totalIncome: '723.43',
  appointments: '324',
  reports: '1,083',
};

const AuthenticatedDashboard = ({
  user,
  onLogout,
}: {
  user: any;
  onLogout: () => void;
}): JSX.Element => {
  const { t } = useTranslation();

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>{t("Dashboard")}</h1>
          <p>{t("welcome_back")}, {user.first_name || user.username}!</p>
        </div>
        <div className="user-info">
          <span className="user-role">{user.role}</span>
          <button onClick={onLogout} className="logout-button">
            {t("Logout")}
          </button>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card stats-card">
          <div className="card-title">{t("Total Patients")}</div>
          <h2>{dashboardData.totalPatients}</h2>
          <p>+2.7%</p>
        </div>

        <div className="card stats-card">
          <div className="card-title">{t("Total Income")}</div>
          <h2>${dashboardData.totalIncome}</h2>
          <p>+2.7%</p>
        </div>

        <div className="card stats-card">
          <div className="card-title">{t("Appointments")}</div>
          <h2>{dashboardData.appointments}</h2>
          <p>+2.7%</p>
        </div>

        <div className="card stats-card">
          <div className="card-title">{t("Reports")}</div>
          <h2>{dashboardData.reports}</h2>
          <p>+2.7%</p>
        </div>

        <div className="card appointments-card">
          <div className="card-title">{t("Appointments")}</div>
        </div>

        <div className="card activity-card">
          <div className="card-title">{t("Recent Activity")}</div>
        </div>
      </div>
    </div>
  );
};

const PublicDashboard = ({ showSignupPopup }: { showSignupPopup: () => void }) => {
  const { t } = useTranslation();

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>{t("Dashboard")}</h1>
          <p>{t("welcome_public_message")}</p>
        </div>

        <div className="user-info">
          <span className="user-role">{t("Guest")}</span>
          <button onClick={showSignupPopup} className="signup-button">
            {t("Sign Up")}
          </button>
        </div>
      </div>

      <div className="dashboard-grid">

        <div className="card stats-card">
          <div className="card-title">{t("Total Patients")}</div>
          <h2>{dashboardData.totalPatients}</h2>
          <p>+2.7%</p>
        </div>

        <div className="card stats-card">
          <div className="card-title">{t("Total Income")}</div>
          <h2>${dashboardData.totalIncome}</h2>
          <p>+2.7%</p>
        </div>

        <div className="card stats-card">
          <div className="card-title">{t("Appointments")}</div>
          <h2>{dashboardData.appointments}</h2>
          <p>+2.7%</p>
        </div>

        <div className="card stats-card">
          <div className="card-title">{t("Reports")}</div>
          <h2>{dashboardData.reports}</h2>
          <p>+2.7%</p>
        </div>

        <div className="card appointments-card">
          <div className="card-title">{t("Appointments")}</div>
          <div className="guest-notice">
            <p>{t("signup_to_view_appointments")}</p>
            <button onClick={showSignupPopup} className="guest-action-button">
              {t("Get Started")}
            </button>
          </div>
        </div>

        <div className="card activity-card">
          <div className="card-title">{t("Recent Activity")}</div>
          <div className="guest-notice">
            <p>{t("signup_to_view_recent_activity")}</p>
            <button onClick={showSignupPopup} className="guest-action-button">
              {t("Get Started")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface UserData {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  role: string;
}

const Dashboard = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated, setUser, isLoading: userLoading } = useUser();

  const [showLogin, setShowLogin] = useState(true);
  const {
    isPopupOpen,
    showSignupPopup,
    hideSignupPopup: originalHideSignupPopup,
  } = useSignupPopup();

  const [usersExist, setUsersExist] = useState<boolean | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const hideSignupPopup = () => {
    originalHideSignupPopup();
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('auth');
    window.history.replaceState(null, '', `?${newSearchParams.toString()}`);
  };

  // Detect parameters ?auth=login/register
  useEffect(() => {
    const authParam = searchParams.get('auth');
    if (authParam === 'login' && !isAuthenticated) {
      setShowLogin(true);
      showSignupPopup();
    } else if (authParam === 'register' && !isAuthenticated) {
      setShowLogin(false);
      showSignupPopup();
    }
  }, [searchParams, isAuthenticated, showSignupPopup]);

  useEffect(() => {
    const checkUsersExist = async () => {
      try {
        const response = await apiService.checkUsersExist();
        setUsersExist(response.users_exist);
      } catch (error) {
        setUsersExist(true);
      }
    };
    checkUsersExist();
  }, []);

  const handleLogin = (userData: UserData): void => {
    const userForContext = {
      id: userData.id.toString(),
      username: userData.username,
      email: userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      role: userData.role,
    };
    setUser(userForContext);
    hideSignupPopup();
  };

  const handleRegister = (userData: UserData): void => {
    const userForContext = {
      id: userData.id.toString(),
      username: userData.username,
      email: userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      role: userData.role,
    };
    setUser(userForContext);
    hideSignupPopup();
    if (userForContext.role === 'admin') {
      navigate('/organization');
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    window.location.href = '/';
  };

  const handleSetupAdmin = async () => {
    const result = await authService.setupDefaultAdmin();
    if (result.success) {
      alert(t("default_admin_created"));
    } else {
      alert(t("default_admin_error") + result.error);
    }
  };

  if (userLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>{t("Loading")}</p>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <>
        <AuthenticatedDashboard user={user} onLogout={handleLogout} />
        <SignupPopup isOpen={isPopupOpen} onClose={hideSignupPopup} />
      </>
    );
  }

  return (
    <>
      <PublicDashboard showSignupPopup={showSignupPopup} />
      <SignupPopup isOpen={isPopupOpen} onClose={hideSignupPopup} />

      {isPopupOpen && (
        <div className="auth-overlay">
          <div className="auth-container">
            {showLogin ? (
              <LoginForm
                onLogin={handleLogin}
                onSwitchToRegister={() => setShowLogin(false)}
                onClose={hideSignupPopup}
              />
            ) : (
              <RegisterForm
                onRegister={handleRegister}
                onSwitchToLogin={() => setShowLogin(true)}
                onClose={hideSignupPopup}
              />
            )}

            {usersExist === false && (
              <div className="admin-setup">
                <button onClick={handleSetupAdmin} className="setup-admin-button">
                  {t("Setup Default Admin")}
                </button>
                <p className="setup-note">{t("setup_note")}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;
