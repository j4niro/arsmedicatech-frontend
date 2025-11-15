import { Box, Tab, Tabs, Typography } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import React, { useEffect, useState } from 'react';
import { adminAPI } from '../services/api';
import { useTranslation } from "react-i18next";

type UserRole = 'administrator' | 'superadmin';
type Organization = { id: string; name: string };
type Clinic = { id: string; name: string };
type Provider = { id: string; name: string };
type Patient = { id: string; name: string };
type Admin = { id: string; email: string };

const TABS = [
  { key: 'organizations', label: 'Organizations' },
  { key: 'clinics', label: 'Clinics' },
  { key: 'providers', label: 'Providers' },
  { key: 'patients', label: 'Patients' },
  { key: 'admins', label: 'Administrators' },
];

const Administration: React.FC = () => {
  const { t } = useTranslation();

  const columns: Record<string, GridColDef[]> = {
    organizations: [
      { field: 'id', headerName: t('ID'), width: 150 },
      { field: 'name', headerName: t('Name'), width: 250 },
    ],
    clinics: [
      { field: 'id', headerName: t('ID'), width: 150 },
      { field: 'name', headerName: t('Name'), width: 250 },
    ],
    providers: [
      { field: 'id', headerName: t('ID'), width: 150 },
      { field: 'name', headerName: t('Name'), width: 250 },
    ],
    patients: [
      { field: 'id', headerName: t('ID'), width: 150 },
      { field: 'name', headerName: t('Name'), width: 250 },
    ],
    admins: [
      { field: 'id', headerName: t('ID'), width: 150 },
      { field: 'email', headerName: t('Email'), width: 250 },
    ],
  };

  const [activeTab, setActiveTab] = useState(0);
  const [role, setRole] = useState<UserRole | null>(null);

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  useEffect(() => {
    adminAPI
      .getOrganizationId()
      .then(response => {
        if (response.data && response.data.id) {
          setOrganizationId(response.data.id);
        } else {
          console.error('Failed to fetch organization ID');
        }
      })
      .catch(error => {
        console.error('Error fetching organization ID:', error);
      });

    const fetchData = async () => {
      setRole('administrator');

      if (role === 'superadmin') {
        setOrganizations(await adminAPI.getOrganizations());
      }

      if (organizationId) {
        setClinics(await adminAPI.getClinics(organizationId));
        setProviders(await adminAPI.getProviders(organizationId));
        setPatients(await adminAPI.getPatients(organizationId));
        setAdmins(await adminAPI.getAdministrators(organizationId));
      }
    };

    fetchData();
  }, []);

  const getRows = () => {
    switch (TABS[activeTab].key) {
      case 'organizations':
        return role === 'superadmin' ? organizations : [];
      case 'clinics':
        return clinics;
      case 'providers':
        return providers;
      case 'patients':
        return patients;
      case 'admins':
        return admins;
      default:
        return [];
    }
  };

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {t("Administration")}
      </Typography>

      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        aria-label="Administration Tabs"
        sx={{ mb: 2 }}
      >
        {TABS.map((tab, idx) => (
          <Tab key={tab.key} label={t(tab.label)} />
        ))}
      </Tabs>

      <Box sx={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={getRows()}
          columns={columns[TABS[activeTab].key]}
          pageSizeOptions={[5, 10, 20]}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 5, page: 0 },
            },
          }}
          disableRowSelectionOnClick
          disableColumnMenu
        />
      </Box>
    </Box>
  );
};

export default Administration;
