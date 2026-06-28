import axios from 'axios';
import { paramsSerializer } from '../utils/paramsSerializer';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const ACCESS_TOKEN_KEY = 'cfcgs_tracker_access_token';
const REFRESH_TOKEN_KEY = 'cfcgs_tracker_refresh_token';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

const authClient = axios.create({
  baseURL: API_BASE_URL,
});

let refreshPromise = null;

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error?.response?.status;
    const requestUrl = originalRequest?.url || '';
    const isAuthRequest =
      requestUrl.includes('/auth/token') || requestUrl.includes('/auth/refresh_token');

    if (
      status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isAuthRequest
    ) {
      throw error;
    }

    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) {
      logout();
      throw error;
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const tokens = await refreshPromise;
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${tokens.access_token}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      logout();
      throw refreshError;
    }
  }
);

export const saveAuthTokens = ({ access_token, refresh_token }) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
};

export const clearAuthTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const getStoredAuthToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);

export const getStoredRefreshToken = () =>
  localStorage.getItem(REFRESH_TOKEN_KEY);

export const login = async ({ username, password }) => {
  const form = new URLSearchParams();
  form.append('username', username);
  form.append('password', password);

  const response = await authClient.post('/auth/token', form, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  saveAuthTokens(response.data);
  return response.data;
};

export const logout = () => {
  clearAuthTokens();
};

export const getCurrentUser = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};

export const refreshAccessToken = async () => {
  const refreshToken = getStoredRefreshToken();
  const response = await authClient.post('/auth/refresh_token', {
    refresh_token: refreshToken,
  });
  saveAuthTokens(response.data);
  return response.data;
};

export const getFundTypes = async () => {
  const response = await apiClient.get('/fund_types/');
  return response.data.fund_types || [];
};

export const getFundFocuses = async () => {
  const response = await apiClient.get('/fund_focuses/');
  return response.data.fund_focuses || [];
};

export const getFundingProvidersData = async (filters = {}) => {
  const response = await apiClient.post('/funding_providers/', {
    fund_types: filters.selectedTypes || [],
    fund_focuses: filters.selectedFocuses || [],
  });
  return {
    fundingProviders: response.data.funding_providers || [],
    sources: response.data.sources || [],
  };
};

export const getFundingProviderSummaryData = async (filters = {}) => {
  const response = await apiClient.post('/funding_providers/summary', {
    funding_providers: filters.selectedFundingProviders || filters.selectedFunds || [],
    fund_types: filters.selectedTypes || [],
    fund_focuses: filters.selectedFocuses || [],
  });
  return {
    summary: {
      total_pledge: response.data.total_pledge || 0,
      total_deposit: response.data.total_deposit || 0,
      total_approval: response.data.total_approval || 0,
    },
    sources: response.data.sources || [],
  };
};

export const getCommitmentsData = async (filters = {}) => {
  const response = await apiClient.post(
    `/records/search?limit=${filters.limit || 10000}&offset=${filters.offset || 0}`,
    {
      years: filters.selectedYears || [],
      countries: filters.selectedCountries || [],
    }
  );
  return response.data.records || [];
};

export const getBeneficiaryCountries = async () => {
  const response = await apiClient.get('/beneficiary_countries/');
  return response.data.countries || [];
};

export const getTotalsByObjective = async (filters = {}) => {
  const response = await apiClient.get('/records/aggregations/by-objective', {
    params: {
      year: filters.selectedYears || [],
      country_id: filters.selectedCountryIds || [],
    },
    paramsSerializer,
  });
  return {
    totals: response.data.totals || [],
    sources: response.data.sources || [],
  };
};

export const getCommitmentTimeSeries = async (filters = {}) => {
  const response = await apiClient.get('/records/aggregations/by-year', {
    params: {
      year: filters.selectedYears || [],
      country_id: filters.selectedCountryIds || [],
    },
    paramsSerializer,
  });
  return {
    series: response.data.series || [],
    sources: response.data.sources || [],
  };
};

export const getAvailableYears = async () => {
  const response = await apiClient.get('/records/years');
  return response.data || [];
};

export const getRecordsOverview = async (filters = {}) => {
  const params = {
    view: filters.view || 'country_year',
    objective: filters.objective || 'all',
    year: filters.years || [],
    country_id: filters.country_ids || [],
    project_id: filters.project_ids || [],
    row_offset: filters.row_offset ?? 0,
    row_limit: filters.row_limit ?? 20,
    column_offset: filters.column_offset ?? 0,
    column_limit: filters.column_limit ?? 12,
  };

  const response = await apiClient.get('/records/overview', {
    params,
    paramsSerializer,
  });

  return response.data || {
    years: [],
    countries: [],
    projects: [],
    objectives: [],
    summary: {
      total_projects: 0,
      total_countries: 0,
      total_amount: 0,
      total_mitigation: 0,
      total_adaptation: 0,
      total_overlap: 0,
      sources: [],
    },
    grid: {
      view: params.view,
      rows: [],
      columns: [],
      row_totals: [],
      column_totals: [],
      cells: [],
      grand_total: 0,
      grand_total_projects: 0,
      row_count: 0,
      column_count: 0,
      row_offset: params.row_offset,
      column_offset: params.column_offset,
      row_limit: params.row_limit,
      column_limit: params.column_limit,
      sources: [],
    },
  };
};

export const getHeatmapFilterOptions = async (filters = {}) => {
  const params = {};
  if (filters.years?.length) params.year = filters.years;
  if (filters.countryIds?.length) params.country_id = filters.countryIds;
  if (filters.projectIds?.length) params.project_id = filters.projectIds;
  if (filters.objective && filters.objective !== 'all') params.objective = filters.objective;

  const response = await apiClient.get('/records/filter-options', {
    params,
    paramsSerializer,
  });
  return response.data || { years: [], countries: [], projects: [], objectives: [] };
};

export const askChatbot = async ({
  question,
  sessionId = 'default',
  page = 1,
  pageSize = 10,
  confirmPagination = false,
  disambiguationChoice = null,
}) => {
  const payload = {
    question,
    session_id: sessionId,
    page,
    page_size: pageSize,
    confirm_pagination: confirmPagination,
  };
  if (disambiguationChoice) payload.disambiguation_choice = disambiguationChoice;
  const response = await apiClient.post('/chatbot/query', payload);
  return response.data;
};

export const getCommitmentProjects = async () => {
  try {
    const response = await apiClient.get('/projects/records/paginated', {
      params: { limit: 1000, offset: 0 },
    });
    return response.data.projects || [];
  } catch (error) {
    console.error('Error fetching commitment projects:', error);
    return [];
  }
};

export const getHeatmapData = async (filters = {}) => {
  try {
    const params = {
      view: filters.view || 'country_year',
      objective: filters.objective || 'all',
      year: filters.years || [],
      country_id: filters.country_ids || [],
      project_id: filters.project_ids || [],
      row_offset: filters.row_offset ?? 0,
      row_limit: filters.row_limit ?? 30,
      column_offset: filters.column_offset ?? 0,
      column_limit: filters.column_limit ?? 30,
    };

    const response = await apiClient.get('/records/aggregations/by-country-and-year', {
      params,
      paramsSerializer,
    });

    return response.data || {
      view: params.view,
      rows: [],
      columns: [],
      row_totals: [],
      column_totals: [],
      cells: [],
      grand_total: 0,
      grand_total_projects: 0,
      sources: [],
    };
  } catch (error) {
    console.error('Error fetching heatmap data:', error);
    return { rows: [], columns: [], row_totals: [], column_totals: [], cells: [], error: error.message };
  }
};

export const getHeatmapCellProjects = async ({
  year,
  countryId,
  projectIds = [],
  objective = 'all',
  limit = 30,
  offset = 0,
} = {}) => {
  try {
    const response = await apiClient.get('/records/projects/by-country-and-year', {
      params: {
        year,
        country_id: countryId,
        project_id: projectIds,
        objective,
        limit,
        offset,
      },
      paramsSerializer,
    });
    return response.data || { total: 0, has_more: false, projects: [] };
  } catch (error) {
    console.error('Error fetching heatmap projects:', error);
    return { total: 0, has_more: false, projects: [] };
  }
};

export const getHeatmapKpis = async (filters = {}) => {
  try {
    const params = {
      objective: filters.objective || 'all',
      year: filters.years || [],
      country_id: filters.country_ids || [],
      project_id: filters.project_ids || [],
    };

    const response = await apiClient.get('/records/summary', {
      params,
      paramsSerializer,
    });

    return response.data || {
      total_projects: 0,
      total_countries: 0,
      total_amount: 0,
      total_adaptation: 0,
      total_mitigation: 0,
      total_overlap: 0,
      sources: [],
    };
  } catch (error) {
    console.error('Error fetching heatmap KPIs:', error);
    return {
      total_projects: 0,
      total_countries: 0,
      total_amount: 0,
      total_adaptation: 0,
      total_mitigation: 0,
      total_overlap: 0,
      sources: [],
      error: error.message,
    };
  }
};

export const getKpisData = async () => {
  try {
    const response = await apiClient.get('/records/summary');
    return response.data || {
      total_projects: 0,
      total_funded_countries: 0,
      total_countries: 0,
      total_amount: 0,
      total_adaptation: 0,
      total_mitigation: 0,
      total_overlap: 0,
    };
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    return { total_projects: 0, total_funded_countries: 0 };
  }
};

export const loadPaginatedProjects = async (search, loadedOptions, { page, filters } = {}) => {
  try {
    const limit = 20;
    const offset = page * limit;

    const params = {
      search: search || '',
      limit,
      offset,
    };
    if (filters?.years?.length) params.year = filters.years;
    if (filters?.countryIds?.length) params.country_id = filters.countryIds;
    if (filters?.objective && filters.objective !== 'all') params.objective = filters.objective;

    const response = await apiClient.get('/projects/records/paginated', {
      params,
      paramsSerializer,
    });

    return {
      options: response.data.projects.map((project) => ({ value: project.id, label: project.name })),
      hasMore: response.data.has_more,
      additional: { page: page + 1 },
    };
  } catch (error) {
    console.error('Erro ao carregar projetos paginados:', error);
    return { options: [], hasMore: false };
  }
};

export const createImportJob = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post('/imports/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getImportJobs = async ({ limit = 50, offset = 0 } = {}) => {
  const response = await apiClient.get('/imports/', { params: { limit, offset } });
  return response.data.import_jobs || [];
};

export const getImportJob = async (importJobId) => {
  const response = await apiClient.get(`/imports/${importJobId}`);
  return response.data;
};

export const getAdminRecords = async ({
  limit = 100,
  offset = 0,
  search = '',
  sortBy = 'year',
  sortOrder = 'desc',
  filters = {},
} = {}) => {
  const response = await apiClient.get('/records/admin/grid', {
    params: {
      limit,
      offset,
      search: search || undefined,
      sort_by: sortBy,
      sort_order: sortOrder,
      year: filters.year || [],
      project_title: filters.project_title || [],
      beneficiary_country: filters.beneficiary_country || [],
      funding_provider: filters.funding_provider || [],
      source: filters.source || [],
      source_url: filters.source_url || [],
      financial_instrument: filters.financial_instrument || [],
      sector: filters.sector || [],
      sub_sector: filters.sub_sector || [],
    },
    paramsSerializer,
  });
  return response.data;
};

export const getAdminRecordFilterOptions = async ({ search = '' } = {}) => {
  const response = await apiClient.get('/records/admin/filter-options', {
    params: {
      search: search || undefined,
    },
  });
  return response.data || {};
};

export const getAdminRecordFilterSuggestions = async ({
  column,
  search = '',
  offset = 0,
  limit = 12,
  activeFilters = {},
} = {}) => {
  const response = await apiClient.get('/records/admin/filter-suggestions', {
    params: {
      column,
      search: search || undefined,
      offset,
      limit,
      year: activeFilters.year || [],
      project_title: activeFilters.project_title || [],
      beneficiary_country: activeFilters.beneficiary_country || [],
      funding_provider: activeFilters.funding_provider || [],
      source: activeFilters.source || [],
      source_url: activeFilters.source_url || [],
      financial_instrument: activeFilters.financial_instrument || [],
      sector: activeFilters.sector || [],
      sub_sector: activeFilters.sub_sector || [],
    },
    paramsSerializer,
  });
  return response.data || { column, values: [], offset, limit, has_more: false };
};

export const updateAdminRecord = async (recordId, payload) => {
  const response = await apiClient.patch(`/records/${recordId}`, payload);
  return response.data;
};

export const getUsers = async ({ limit = 100, offset = 0 } = {}) => {
  const response = await apiClient.get('/users/', { params: { limit, offset } });
  return response.data.users || [];
};

export const createUser = async (payload) => {
  const response = await apiClient.post('/users/', payload);
  return response.data;
};

export const deleteUser = async (userId) => {
  const response = await apiClient.delete(`/users/${userId}`);
  return response.data;
};

export const updateUserRole = async (userId, role) => {
  const response = await apiClient.patch(`/users/${userId}/role`, { role });
  return response.data;
};


export const updateUserProfile = async (userId, payload) => {
  const response = await apiClient.put(`/users/${userId}`, payload);
  return response.data;
};

export const getFundProfiles = async () => {
  const response = await apiClient.post('/funding_providers/', {
    fund_types: [],
    fund_focuses: [],
  });
  return response.data.funding_providers || [];
};


export const verifyCurrentPassword = async (userId, currentPassword) => {
  await apiClient.post(`/users/${userId}/verify-password`, { current_password: currentPassword });
  return true;
};

export const updateFundProfile = async (fundingProviderId, payload) => {
  const response = await apiClient.patch(`/funding_providers/${fundingProviderId}/profile`, payload);
  return response.data;
};
