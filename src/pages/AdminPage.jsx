import React, { useEffect, useMemo, useState } from 'react';
import {
  FiAlertCircle,
  FiCheckCircle,
  FiPlus,
  FiRefreshCw,
  FiRotateCcw,
  FiSave,
  FiShield,
  FiTrash2,
  FiUploadCloud,
  FiUser,
} from 'react-icons/fi';

import LoadingSpinner from '../components/common/LoadingSpinner';
import AdminDataTable from '../components/admin/AdminDataTable';
import RoleChangeModal from '../components/admin/RoleChangeModal';
import DeleteUserModal from '../components/admin/DeleteUserModal';
import PasswordChangeModal from '../components/admin/PasswordChangeModal';
import {
  createImportJob,
  createUser,
  deleteUser,
  getAdminRecordFilterSuggestions,
  getAdminRecords,
  getFundProfiles,
  getImportJobs,
  getUsers,
  logout,
  updateAdminRecord,
  updateFundProfile,
  updateUserProfile,
  updateUserRole,
  verifyCurrentPassword,
} from '../services/api';

const formatAmount = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  const number = Number(value);
  if (Number.isNaN(number)) return value;
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(number);
};

const formatDateTime = (value) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
};

const TAB_LABELS = {
  imports: 'Importação',
  climate_records: 'Registros Climáticos',
  fund_profiles: 'Perfis de Fundos',
  users: 'Usuários',
  profile: 'Meu Perfil',
};

const emptyUserForm = {
  username: '',
  email: '',
  password: '',
  role: 'importer',
};

const buildSnapshotMap = (rows) =>
  Object.fromEntries(rows.map((row) => [row.id, { ...row }]));

const AdminPage = ({
  currentUser,
  onLoginRequest,
  onCurrentUserRoleChanged,
  onCurrentUserUpdated,
  initialTab = 'imports',
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const isImporter = currentUser?.role === 'importer';
  const canEditManagedData = isAdmin || isImporter;
  const availableTabs = useMemo(() => {
    if (isAdmin) {
      return [
        'imports',
        'climate_records',
        'fund_profiles',
        'users',
        'profile',
      ];
    }
    if (isImporter) {
      return ['imports', 'climate_records', 'fund_profiles', 'profile'];
    }
    return [];
  }, [isAdmin, isImporter]);

  const [activeTab, setActiveTab] = useState(initialTab);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [flashMessage, setFlashMessage] = useState(null);
  const [imports, setImports] = useState([]);
  const [importsLoading, setImportsLoading] = useState(false);

  const [records, setRecords] = useState([]);
  const [recordSnapshots, setRecordSnapshots] = useState({});
  const [recordsMeta, setRecordsMeta] = useState({ total: 0, limit: 80, offset: 0, has_more: false });
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsLoadingMore, setRecordsLoadingMore] = useState(false);
  const [recordsSearchInput, setRecordsSearchInput] = useState('');
  const [recordsSearch, setRecordsSearch] = useState('');
  const [recordsSort, setRecordsSort] = useState({ sortBy: 'year', sortOrder: 'desc' });
  const [recordFilters, setRecordFilters] = useState({});
  const [editedRecords, setEditedRecords] = useState({});
  const [savingAllRecords, setSavingAllRecords] = useState(false);

  const [fundProfiles, setFundProfiles] = useState([]);
  const [fundProfilesLoading, setFundProfilesLoading] = useState(false);

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [userFormError, setUserFormError] = useState('');
  const [userFormLoading, setUserFormLoading] = useState(false);
  const [roleModalUser, setRoleModalUser] = useState(null);
  const [roleModalLoading, setRoleModalLoading] = useState(false);
  const [deleteModalUser, setDeleteModalUser] = useState(null);
  const [deleteModalLoading, setDeleteModalLoading] = useState(false);

  const [profileForm, setProfileForm] = useState({
    username: currentUser?.username || '',
    email: currentUser?.email || '',
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordModalError, setPasswordModalError] = useState('');
  const [passwordModalLoading, setPasswordModalLoading] = useState(false);
  const [editedFundProfiles, setEditedFundProfiles] = useState({});
  const [fundProfileSnapshots, setFundProfileSnapshots] = useState({});
  const [savingAllFundProfiles, setSavingAllFundProfiles] = useState(false);

  useEffect(() => {
    if (availableTabs.length && !availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0]);
    }
  }, [activeTab, availableTabs]);

  useEffect(() => {
    if (initialTab && availableTabs.includes(initialTab)) {
      setActiveTab(initialTab);
    }
  }, [availableTabs, initialTab]);

  useEffect(() => {
    setProfileForm({
      username: currentUser?.username || '',
      email: currentUser?.email || '',
      current_password: '',
      new_password: '',
      new_password_confirmation: '',
    });
  }, [currentUser]);

  useEffect(() => {
    if (!flashMessage) return undefined;
    const timeoutId = window.setTimeout(() => {
      setFlashMessage(null);
    }, 4200);
    return () => window.clearTimeout(timeoutId);
  }, [flashMessage]);

  const loadImports = async () => {
    if (!currentUser) return;
    setImportsLoading(true);
    try {
      const jobs = await getImportJobs({ limit: 100, offset: 0 });
      setImports(jobs);
    } finally {
      setImportsLoading(false);
    }
  };

  const loadUsers = async () => {
    if (!isAdmin) return;
    setUsersLoading(true);
    try {
      const data = await getUsers({ limit: 200, offset: 0 });
      setUsers(data);
    } finally {
      setUsersLoading(false);
    }
  };

  const loadFundProfiles = async () => {
    if (!currentUser) return;
    setFundProfilesLoading(true);
    try {
      const data = await getFundProfiles();
      setFundProfiles(data);
      setFundProfileSnapshots(Object.fromEntries(data.map((row) => [row.id, { ...row }])));
      setEditedFundProfiles({});
    } finally {
      setFundProfilesLoading(false);
    }
  };

  const loadRecords = async ({ reset = false } = {}) => {
    if (!canEditManagedData) return;
    const nextOffset = reset ? 0 : recordsMeta.offset;
    if (reset) {
      setRecordsLoading(true);
    } else {
      setRecordsLoadingMore(true);
    }

    try {
      const response = await getAdminRecords({
        limit: recordsMeta.limit,
        offset: nextOffset,
        search: recordsSearch,
        sortBy: recordsSort.sortBy,
        sortOrder: recordsSort.sortOrder,
        filters: recordFilters,
      });
      setRecords((current) => (reset ? response.records : [...current, ...response.records]));
      setRecordSnapshots((current) => (
        reset ? buildSnapshotMap(response.records) : { ...current, ...buildSnapshotMap(response.records) }
      ));
      if (reset) {
        setEditedRecords({});
      }
      setRecordsMeta({
        total: response.total,
        limit: response.limit,
        offset: response.offset + response.records.length,
        has_more: response.has_more,
      });
    } finally {
      setRecordsLoading(false);
      setRecordsLoadingMore(false);
    }
  };


  useEffect(() => {
    if (!currentUser) return;
    loadImports();
  }, [currentUser]);

  useEffect(() => {
    if (activeTab === 'users') loadUsers();
  }, [activeTab, isAdmin]);

  useEffect(() => {
    if (activeTab === 'fund_profiles') loadFundProfiles();
  }, [activeTab, currentUser]);

  useEffect(() => {
    if (activeTab === 'climate_records' && canEditManagedData) {
      loadRecords({ reset: true });
    }
  }, [
    activeTab,
    canEditManagedData,
    recordFilters,
    recordsSearch,
    recordsSort.sortBy,
    recordsSort.sortOrder,
  ]);

  const importColumns = [
    { key: 'id', label: 'ID', width: 90, sortable: true },
    { key: 'file_name', label: 'Arquivo', width: 260, sortable: true },
    { key: 'file_type', label: 'Tipo', width: 100, sortable: true },
    { key: 'status', label: 'Status', width: 110, sortable: true },
    { key: 'user_email', label: 'Usuário', width: 220, sortable: true },
    { key: 'rows_received', label: 'Recebidas', width: 120, sortable: true },
    { key: 'rows_inserted', label: 'Inseridas', width: 120, sortable: true },
    { key: 'rows_updated', label: 'Atualizadas', width: 130, sortable: true },
    { key: 'rows_duplicated', label: 'Duplicadas', width: 130, sortable: true },
    { key: 'rows_failed', label: 'Falhas', width: 110, sortable: true },
    { key: 'started_at', label: 'Iniciado em', width: 200, sortable: true, render: (row) => formatDateTime(row.started_at) },
    { key: 'finished_at', label: 'Finalizado em', width: 200, sortable: true, render: (row) => formatDateTime(row.finished_at) },
  ];

  const recordColumns = [
    { key: 'id', label: 'ID', width: 90, sortable: true, filterable: false },
    { key: 'year', label: 'Ano', width: 100, sortable: true, editable: true, type: 'number' },
    { key: 'project_title', label: 'Projeto', width: 240, sortable: true, editable: true },
    { key: 'beneficiary_country', label: 'País beneficiário', width: 210, sortable: true, editable: true },
    { key: 'funding_provider', label: 'Provedor financeiro', width: 220, sortable: true, editable: true },
    { key: 'source', label: 'Fonte', width: 160, sortable: true, editable: true },
    { key: 'source_url', label: 'URL da fonte', width: 240, sortable: true, editable: true },
    { key: 'financial_instrument', label: 'Instrumento financeiro', width: 190, sortable: true, editable: true },
    { key: 'sector', label: 'Setor', width: 180, sortable: true, editable: true },
    { key: 'sub_sector', label: 'Subsetor', width: 240, sortable: true, editable: true },
    { key: 'approved_amount_usd_millions', label: 'Aprovado USD mi', width: 160, sortable: true, editable: true, type: 'number' },
    { key: 'climate_finance_amount_usd_millions', label: 'Fin. climático USD mi', width: 180, sortable: true, editable: true, type: 'number' },
    { key: 'adaptation_amount_usd_millions', label: 'Adaptação USD mi', width: 170, sortable: true, editable: true, type: 'number' },
    { key: 'mitigation_amount_usd_millions', label: 'Mitigação USD mi', width: 170, sortable: true, editable: true, type: 'number' },
    { key: 'both_objectives_amount_usd_millions', label: 'Ambos USD mi', width: 160, sortable: true, editable: true, type: 'number' },
    {
      key: 'source_row_hash',
      label: 'Hash',
      width: 320,
      sortable: false,
      filterable: false,
      cellClassName: 'admin-hash-cell-td',
      render: (row) => <span className="admin-hash-cell" title={row.source_row_hash}>{row.source_row_hash}</span>,
    },
  ];

  const fundProfileColumns = [
    { key: 'funding_provider_name', label: 'Fundo', width: 260, sortable: true },
    { key: 'fund_type', label: 'Tipo de fundo', width: 180, sortable: true, editable: true },
    { key: 'fund_focus', label: 'Foco do fundo', width: 180, sortable: true, editable: true },
    { key: 'pledge', label: 'Promessa (USD mn)', width: 150, sortable: true, editable: true, type: 'number', render: (row) => formatAmount(row.pledge) },
    { key: 'deposit', label: 'Depósito (USD mn)', width: 150, sortable: true, editable: true, type: 'number', render: (row) => formatAmount(row.deposit) },
    { key: 'approval', label: 'Aprovação (USD mn)', width: 150, sortable: true, editable: true, type: 'number', render: (row) => formatAmount(row.approval) },
    { key: 'disbursement', label: 'Desembolso (USD mn)', width: 170, sortable: true, editable: true, type: 'number', render: (row) => formatAmount(row.disbursement) },
    { key: 'projects_approved', label: 'Projetos aprovados', width: 150, sortable: true, editable: true, type: 'number' },
  ];

  const userColumns = [
    { key: 'id', label: 'ID', width: 90, sortable: true, filterable: false },
    { key: 'username', label: 'Username', width: 180, sortable: true },
    { key: 'email', label: 'Email', width: 260, sortable: true },
    { key: 'role', label: 'Role', width: 140, sortable: true },
    { key: 'is_active', label: 'Status', width: 120, sortable: true, render: (row) => (row.is_active ? 'Ativo' : 'Inativo') },
  ];

  const dirtyRowIds = useMemo(() => new Set(Object.keys(editedRecords).map(Number)), [editedRecords]);
  const dirtyFundProfileIds = useMemo(() => new Set(Object.keys(editedFundProfiles).map(Number)), [editedFundProfiles]);

  const handleFundProfileCellChange = (providerId, key, value, type) => {
    setFundProfiles((current) => current.map((row) => {
      if (row.id !== providerId) return row;
      const nextValue = type === 'number' ? (value === '' ? null : Number(value)) : value;
      return { ...row, [key]: nextValue };
    }));

    setEditedFundProfiles((current) => ({
      ...current,
      [providerId]: {
        ...(current[providerId] || {}),
        [key]: type === 'number' ? (value === '' ? null : Number(value)) : value,
      },
    }));
  };

  const handleUndoFundProfileRow = (providerId) => {
    const snapshot = fundProfileSnapshots[providerId];
    if (!snapshot) return;
    setFundProfiles((current) => current.map((row) => (row.id === providerId ? { ...snapshot } : row)));
    setEditedFundProfiles((current) => {
      const next = { ...current };
      delete next[providerId];
      return next;
    });
  };

  const handleDiscardAllFundProfiles = () => {
    setFundProfiles((current) => current.map((row) => ({ ...(fundProfileSnapshots[row.id] || row) })));
    setEditedFundProfiles({});
  };

  const handleSaveAllFundProfiles = async () => {
    if (!Object.keys(editedFundProfiles).length) return;
    setSavingAllFundProfiles(true);
    setFlashMessage(null);
    try {
      const entries = Object.entries(editedFundProfiles);
      for (const [providerId, payload] of entries) {
        const updated = await updateFundProfile(Number(providerId), payload);
        setFundProfiles((current) => current.map((row) => (row.id === updated.id ? updated : row)));
        setFundProfileSnapshots((current) => ({ ...current, [updated.id]: { ...updated } }));
      }
      setEditedFundProfiles({});
      setFlashMessage({ tone: 'success', text: `${entries.length} perfis de fundos salvos com sucesso.` });
    } catch (error) {
      setFlashMessage({ tone: 'error', text: error?.response?.data?.detail || 'Falha ao salvar as alterações pendentes dos perfis de fundos.' });
    } finally {
      setSavingAllFundProfiles(false);
    }
  };

  const handleVerifyPasswordStep = async (currentPassword) => {
    setPasswordModalLoading(true);
    setPasswordModalError('');
    try {
      await verifyCurrentPassword(currentUser.id, currentPassword);
      return true;
    } catch (error) {
      setPasswordModalError(error?.response?.data?.detail || 'Não foi possível validar a senha atual.');
      return false;
    } finally {
      setPasswordModalLoading(false);
    }
  };

  const handleSaveNewPassword = async ({ currentPassword, newPassword, confirmation }) => {
    setPasswordModalLoading(true);
    setPasswordModalError('');
    try {
      await updateUserProfile(currentUser.id, {
        username: currentUser.username,
        email: currentUser.email,
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmation,
      });
      setFlashMessage({ tone: 'success', text: 'Senha atualizada com sucesso.' });
      return true;
    } catch (error) {
      setPasswordModalError(error?.response?.data?.detail || 'Não foi possível atualizar a senha.');
      return false;
    } finally {
      setPasswordModalLoading(false);
    }
  };

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    setFlashMessage(null);
    try {
      const job = await createImportJob(file);
      setFlashMessage({
        tone: 'success',
        text: `Import concluído: ${job.rows_inserted || 0} inseridas, ${job.rows_updated || 0} atualizadas, ${job.rows_duplicated || 0} duplicadas.`,
      });
      await loadImports();
      await loadFundProfiles();
      if (activeTab === 'climate_records' && canEditManagedData) {
        await loadRecords({ reset: true });
      }
    } catch (error) {
      setFlashMessage({
        tone: 'error',
        text: error?.response?.data?.detail || 'Falha ao enviar o arquivo.',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = async (event) => {
    const [file] = event.target.files || [];
    if (file) await handleUpload(file);
    event.target.value = '';
  };

  const handleRecordCellChange = (recordId, key, value, type) => {
    setRecords((current) =>
      current.map((row) => {
        if (row.id !== recordId) return row;
        const nextValue = type === 'number' ? (value === '' ? null : Number(value)) : value;
        return { ...row, [key]: nextValue };
      })
    );

    setEditedRecords((current) => ({
      ...current,
      [recordId]: {
        ...(current[recordId] || {}),
        [key]: type === 'number' ? (value === '' ? null : Number(value)) : value,
      },
    }));
  };

  const handleUndoRecordRow = (recordId) => {
    const snapshot = recordSnapshots[recordId];
    if (!snapshot) return;
    setRecords((current) =>
      current.map((row) => (row.id === recordId ? { ...snapshot } : row))
    );
    setEditedRecords((current) => {
      const next = { ...current };
      delete next[recordId];
      return next;
    });
  };

  const handleDiscardAllRecords = () => {
    setRecords((current) =>
      current.map((row) => ({ ...(recordSnapshots[row.id] || row) }))
    );
    setEditedRecords({});
  };

  const handleSaveAllRecords = async () => {
    if (!Object.keys(editedRecords).length) return;
    setSavingAllRecords(true);
    setFlashMessage(null);
    try {
      const entries = Object.entries(editedRecords);
      for (const [recordId, payload] of entries) {
        const updated = await updateAdminRecord(Number(recordId), payload);
        setRecords((current) =>
          current.map((row) => (row.id === updated.id ? updated : row))
        );
        setRecordSnapshots((current) => ({
          ...current,
          [updated.id]: { ...updated },
        }));
      }
      setEditedRecords({});
      setFlashMessage({
        tone: 'success',
        text: `${entries.length} linhas salvas com sucesso.`,
      });
    } catch (error) {
      setFlashMessage({
        tone: 'error',
        text: error?.response?.data?.detail || 'Falha ao salvar as alterações pendentes.',
      });
    } finally {
      setSavingAllRecords(false);
    }
  };

  const handleSortRecords = (key) => {
    setRecordsSort((current) => ({
      sortBy: key,
      sortOrder: current.sortBy === key && current.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleRecordFilterSuggestions = async ({
    column,
    search,
    offset = 0,
    limit = 12,
    activeFilters = {},
  }) => {
    return await getAdminRecordFilterSuggestions({
      column,
      search,
      offset,
      limit,
      activeFilters,
    });
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();
    setUserFormLoading(true);
    setUserFormError('');
    try {
      await createUser(userForm);
      setUserForm(emptyUserForm);
      setShowCreateUser(false);
      await loadUsers();
    } catch (error) {
      setUserFormError(error?.response?.data?.detail || 'Não foi possível criar o usuário.');
    } finally {
      setUserFormLoading(false);
    }
  };

  const handleDeleteUser = async (user) => {
    setDeleteModalLoading(true);
    try {
      await deleteUser(user.id);
      setDeleteModalUser(null);

      if (currentUser?.id === user.id) {
        logout();
        onCurrentUserRoleChanged?.('Seu acesso foi desativado. Faça login com outro usuário ativo para continuar.');
        return;
      }

      setFlashMessage({
        tone: 'success',
        text: `Usuário ${user.email} desativado com sucesso.`,
      });
      await loadUsers();
    } catch (error) {
      setFlashMessage({
        tone: 'error',
        text: error?.response?.data?.detail || 'Não foi possível desativar o usuário.',
      });
    } finally {
      setDeleteModalLoading(false);
    }
  };

  const handleConfirmRoleChange = async (nextRole) => {
    if (!roleModalUser) return;
    setRoleModalLoading(true);
    try {
      await updateUserRole(roleModalUser.id, nextRole);
      setRoleModalUser(null);

      if (currentUser?.id === roleModalUser.id) {
        logout();
        onCurrentUserRoleChanged?.('Sua role foi alterada. Faça login novamente para continuar.');
        return;
      }

      setFlashMessage({
        tone: 'success',
        text: `Role de ${roleModalUser.email} alterada para ${nextRole} com sucesso.`,
      });
      await loadUsers();
    } catch (error) {
      setFlashMessage({
        tone: 'error',
        text: error?.response?.data?.detail || 'Não foi possível alterar a role do usuário.',
      });
    } finally {
      setRoleModalLoading(false);
    }
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setProfileError('');
    setProfileLoading(true);
    try {
      const updatedUser = await updateUserProfile(currentUser.id, {
        username: profileForm.username,
        email: profileForm.email,
      });
      const shouldRelogin = updatedUser.email !== currentUser.email;

      if (shouldRelogin) {
        logout();
        onCurrentUserRoleChanged?.('Seu email foi alterado. Faça login novamente para continuar.');
        return;
      }

      onCurrentUserUpdated?.(updatedUser);
      setFlashMessage({ tone: 'success', text: 'Perfil atualizado com sucesso.' });
    } catch (error) {
      setProfileError(error?.response?.data?.detail || 'Não foi possível atualizar o seu perfil.');
    } finally {
      setProfileLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="p-6 md:p-8">
        <div className="admin-hero-card max-w-3xl mx-auto">
          <div className="admin-hero-badge">
            <FiShield /> Área de gestão protegida
          </div>
          <h2 className="mt-5 text-4xl font-semibold text-dark-text">Console de gestão do CFC-GS Tracker</h2>
          <p className="mt-4 text-base text-dark-text-secondary leading-7">
            Faça a autenticação para acessar a importação de planilhas, a auditoria dos imports, os perfis de fundos, os registros de financiamento climático e a gestão controlada dos usuários.
          </p>
          <button type="button" onClick={onLoginRequest} className="admin-primary-button mt-8">
            Entrar na área de gestão
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <section className="admin-hero-card">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="admin-hero-badge">
              <FiShield /> {isAdmin ? 'Gestão completa' : 'Painel do importer'}
            </div>
            <h2 className="mt-4 text-3xl md:text-4xl font-semibold text-dark-text">Operações de gestão e manutenção da base</h2>
            <p className="mt-3 max-w-4xl text-dark-text-secondary leading-7">
              Uma área pensada para trabalhar com importações, revisão da base, atualização do próprio perfil e acompanhamento dos dados de fundos no mesmo idioma visual da plataforma principal.
            </p>
          </div>
          <div className="admin-kpi-chip-grid">
            <div className="admin-kpi-chip">
              <span>Perfil</span>
              <strong>{currentUser.role}</strong>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className="admin-kpi-chip admin-kpi-chip-button text-left"
            >
              <span>Usuário</span>
              <strong>{currentUser.email}</strong>
            </button>
            <div className="admin-kpi-chip">
              <span>Imports carregados</span>
              <strong>{imports.filter((job) => job.user_email === currentUser.email).length}</strong>
            </div>
          </div>
        </div>
      </section>

      {flashMessage ? (
        <div className={`admin-feedback ${flashMessage.tone === 'success' ? 'is-success' : 'is-error'}`}>
          {flashMessage.tone === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
          <span>{flashMessage.text}</span>
        </div>
      ) : null}

      <section className="admin-tabs-bar">
        {availableTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`admin-tab-button ${activeTab === tab ? 'is-active' : ''}`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </section>

      {activeTab === 'imports' && (
        <div className="grid grid-cols-1 items-stretch gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <section className="admin-section-card flex h-full flex-col">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="admin-section-title">Upload de planilhas</h3>
                <p className="admin-section-subtitle">Arraste um arquivo `.csv` ou `.xlsx` diretamente para a área abaixo.</p>
              </div>
              <FiUploadCloud className="text-2xl text-accent-blue" />
            </div>
            <label
              className={`admin-dropzone flex-1 ${dragActive ? 'is-active' : ''} ${uploading ? 'is-disabled' : ''}`}
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setDragActive(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setDragActive(false);
                const [file] = event.dataTransfer.files || [];
                if (file) handleUpload(file);
              }}
            >
              <input type="file" className="hidden" onChange={handleFileInput} disabled={uploading} />
              {uploading ? <LoadingSpinner size="sm" text="Processando importação..." inline /> : <FiUploadCloud className="text-4xl text-accent-blue" />}
              <div className="space-y-2 text-center">
                <p className="text-lg font-semibold text-dark-text">Solte o arquivo aqui</p>
                <p className="text-sm text-dark-text-secondary">ou clique para selecionar do computador</p>
              </div>
            </label>
          </section>

          <section className="admin-section-card">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="admin-section-title">Histórico de imports</h3>
                <p className="admin-section-subtitle">{isAdmin ? 'Visão geral de auditoria com o email do usuário executor.' : 'Seus imports mais recentes.'}</p>
              </div>
              <button type="button" onClick={loadImports} className="admin-ghost-button">
                <FiRefreshCw /> Atualizar
              </button>
            </div>
            <AdminDataTable
              columns={importColumns}
              rows={imports}
              loading={importsLoading}
              emptyMessage="Nenhum import disponível ainda."
              enableInlineFilters
              height={540}
            />
          </section>
        </div>
      )}

      {activeTab === 'climate_records' && (isAdmin || isImporter) && (
        <section className="admin-section-card space-y-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h3 className="admin-section-title">Registros de Financiamento Climático</h3>
              <p className="admin-section-subtitle">Rolagem vertical paginada, rolagem horizontal livre, filtros por coluna e edição global com commit explícito.</p>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-3 xl:items-end">
              <div className="flex w-full max-w-[560px] items-center gap-3">
                <input
                  type="text"
                  value={recordsSearchInput}
                  onChange={(event) => setRecordsSearchInput(event.target.value)}
                  placeholder="Buscar por projeto, país, provedor ou fonte..."
                  className="admin-search-input flex-1"
                />
                <button type="button" onClick={() => setRecordsSearch(recordsSearchInput)} className="admin-primary-button shrink-0">
                  Buscar
                </button>
              </div>
              {canEditManagedData ? (
                <div className="flex w-full justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleDiscardAllRecords}
                    className="admin-ghost-button"
                    disabled={!dirtyRowIds.size || savingAllRecords}
                  >
                    <FiRotateCcw /> Desfazer tudo
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAllRecords}
                    className="admin-primary-button"
                    disabled={!dirtyRowIds.size || savingAllRecords}
                  >
                    <FiSave /> {savingAllRecords ? 'Salvando...' : 'Salvar tudo'}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-dark-text-secondary">
            <span>{recordsMeta.total} linhas disponíveis no backend</span>
            <span>{dirtyRowIds.size} linhas com edição pendente</span>
          </div>
          <AdminDataTable
            columns={recordColumns}
            rows={records}
            loading={recordsLoading || recordsLoadingMore}
            emptyMessage="Nenhum registro encontrado para os critérios informados."
            activeFilters={recordFilters}
            onFiltersChange={setRecordFilters}
            onRequestFilterSuggestions={handleRecordFilterSuggestions}
            enableInlineFilters
            onReachEnd={() => {
              if (!recordsLoadingMore && recordsMeta.has_more) loadRecords();
            }}
            hasMore={recordsMeta.has_more}
            onSortChange={handleSortRecords}
            sortBy={recordsSort.sortBy}
            sortOrder={recordsSort.sortOrder}
            onCellChange={canEditManagedData ? handleRecordCellChange : undefined}
            dirtyRowIds={dirtyRowIds}
            rowActionsWidth={56}
            rowActions={canEditManagedData ? ((row) => (
              <button
                type="button"
                onClick={() => handleUndoRecordRow(row.id)}
                className="admin-inline-action is-warning"
                title="Desfazer alterações desta linha"
                disabled={!dirtyRowIds.has(row.id)}
              >
                <FiRotateCcw />
              </button>
            )) : undefined}
            height={640}
          />
        </section>
      )}

      {activeTab === 'fund_profiles' && (
        <section className="admin-section-card space-y-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h3 className="admin-section-title">Perfis de Fundos</h3>
              <p className="admin-section-subtitle">Visão tabular dos fundos e seus indicadores consolidados de promessa, depósito, aprovação e desembolso.</p>
            </div>
            {canEditManagedData ? (
              <div className="flex w-full justify-end gap-3">
                <button type="button" onClick={handleDiscardAllFundProfiles} className="admin-ghost-button" disabled={!dirtyFundProfileIds.size || savingAllFundProfiles}>
                  <FiRotateCcw /> Desfazer tudo
                </button>
                <button type="button" onClick={handleSaveAllFundProfiles} className="admin-primary-button" disabled={!dirtyFundProfileIds.size || savingAllFundProfiles}>
                  <FiSave /> {savingAllFundProfiles ? 'Salvando...' : 'Salvar tudo'}
                </button>
              </div>
            ) : (
              <button type="button" onClick={loadFundProfiles} className="admin-ghost-button">
                <FiRefreshCw /> Atualizar
              </button>
            )}
          </div>
          <div className="flex items-center justify-between text-sm text-dark-text-secondary">
            <span>{fundProfiles.length} perfis de fundos carregados</span>
            <span>{dirtyFundProfileIds.size} linhas com edição pendente</span>
          </div>
          <AdminDataTable
            columns={fundProfileColumns}
            rows={fundProfiles}
            loading={fundProfilesLoading}
            emptyMessage="Nenhum perfil de fundo encontrado."
            enableInlineFilters
            onCellChange={canEditManagedData ? handleFundProfileCellChange : undefined}
            dirtyRowIds={dirtyFundProfileIds}
            rowActionsWidth={56}
            rowActions={canEditManagedData ? ((row) => (
              <button type="button" onClick={() => handleUndoFundProfileRow(row.id)} className="admin-inline-action is-warning" title="Desfazer alterações desta linha" disabled={!dirtyFundProfileIds.has(row.id)}>
                <FiRotateCcw />
              </button>
            )) : undefined}
            height={620}
          />
        </section>
      )}

      {activeTab === 'users' && isAdmin && (
        <section className="admin-section-card space-y-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="admin-section-title">Gestão de usuários</h3>
              <p className="admin-section-subtitle">Crie usuários, altere roles fixas com modal controlado e remova acessos quando necessário.</p>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowCreateUser((current) => !current)} className="admin-primary-button">
                <FiPlus /> Novo usuário
              </button>
              <button type="button" onClick={loadUsers} className="admin-ghost-button">
                <FiRefreshCw /> Atualizar
              </button>
            </div>
          </div>

          {showCreateUser && (
            <form onSubmit={handleCreateUser} className="admin-form-panel">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <input className="admin-form-input" placeholder="Username" value={userForm.username} onChange={(event) => setUserForm((current) => ({ ...current, username: event.target.value }))} required />
                <input className="admin-form-input" placeholder="Email" type="email" value={userForm.email} onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value }))} required />
                <input className="admin-form-input" placeholder="Senha" type="password" value={userForm.password} onChange={(event) => setUserForm((current) => ({ ...current, password: event.target.value }))} required />
                <select className="admin-form-input" value={userForm.role} onChange={(event) => setUserForm((current) => ({ ...current, role: event.target.value }))}>
                  <option value="importer">importer</option>
                  <option value="admin">admin</option>
                </select>
              </div>
              {userFormError ? <div className="admin-feedback is-error"><FiAlertCircle /><span>{userFormError}</span></div> : null}
              <div className="flex justify-end">
                <button type="submit" className="admin-primary-button" disabled={userFormLoading}>
                  {userFormLoading ? 'Criando...' : 'Salvar usuário'}
                </button>
              </div>
            </form>
          )}

          <AdminDataTable
            columns={userColumns}
            rows={users}
            loading={usersLoading}
            emptyMessage="Nenhum usuário cadastrado."
            enableInlineFilters
            height={560}
            rowActionsWidth={88}
            rowActions={(user) => (
              <>
                <button
                  type="button"
                  onClick={() => setRoleModalUser(user)}
                  className="admin-inline-action is-warning"
                  title="Alterar role"
                >
                  <FiShield />
                </button>
                <button type="button" onClick={() => setDeleteModalUser(user)} className="admin-inline-action is-danger" title="Desativar usuário">
                  <FiTrash2 />
                </button>
              </>
            )}
          />
        </section>
      )}

      {activeTab === 'profile' && (
        <section className="admin-section-card space-y-5">
          <div>
            <h3 className="admin-section-title">Meu Perfil</h3>
            <p className="admin-section-subtitle">Admin e importer podem alterar o próprio username, email e senha. Para mudar a senha, é necessário informar a senha atual e confirmar a nova.</p>
          </div>

          <form onSubmit={handleProfileSubmit} className="admin-form-panel space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-dark-text-secondary">Username</label>
                <input className="admin-form-input" value={profileForm.username} onChange={(event) => setProfileForm((current) => ({ ...current, username: event.target.value }))} required />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-dark-text-secondary">Email</label>
                <input className="admin-form-input" type="email" value={profileForm.email} onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))} required />
              </div>
            </div>

            {profileError ? <div className="admin-feedback is-error"><FiAlertCircle /><span>{profileError}</span></div> : null}

            <div className="flex flex-wrap justify-end gap-3">
              <button type="button" className="admin-ghost-button" onClick={() => { setPasswordModalError(''); setPasswordModalOpen(true); }}>
                Alterar senha
              </button>
              <button type="submit" className="admin-primary-button" disabled={profileLoading}>
                <FiUser /> {profileLoading ? 'Salvando...' : 'Salvar meu perfil'}
              </button>
            </div>
          </form>
        </section>
      )}

      <PasswordChangeModal
        open={passwordModalOpen}
        loading={passwordModalLoading}
        error={passwordModalError}
        onClose={() => { setPasswordModalOpen(false); setPasswordModalError(''); }}
        onVerifyCurrentPassword={handleVerifyPasswordStep}
        onSaveNewPassword={handleSaveNewPassword}
      />

      <RoleChangeModal
        open={Boolean(roleModalUser)}
        user={roleModalUser}
        loading={roleModalLoading}
        onClose={() => setRoleModalUser(null)}
        onConfirm={handleConfirmRoleChange}
      />

      <DeleteUserModal
        open={Boolean(deleteModalUser)}
        user={deleteModalUser}
        loading={deleteModalLoading}
        onClose={() => setDeleteModalUser(null)}
        onConfirm={handleDeleteUser}
      />
    </div>
  );
};

export default AdminPage;
