import axios from 'axios';
import { paramsSerializer } from '../utils/paramsSerializer';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// GETs para dados de filtro - CORRETO
export const getFundTypes = async () => {
  const response = await axios.get(`${API_BASE_URL}/fund_types/`);
  return response.data.fund_types || [];
};

export const getFundFocuses = async () => {
  const response = await axios.get(`${API_BASE_URL}/fund_focuses/`);
  return response.data.fund_focuses || [];
};

export const getCountries = async () => {
  const response = await axios.get(`${API_BASE_URL}/countries/`);
  return response.data.countries || [];
};

// POSTs para dados principais com filtros
export const getFundsData = async (filters = {}) => {
    const url = `${API_BASE_URL}/funds/`;
    const payload = {
        fund_types: filters.selectedTypes || [],
        fund_focuses: filters.selectedFocuses || []
    };
    const response = await axios.post(url, payload);
    return response.data.funds || [];
};

export const getFundStatusData = async (filters = {}) => {
    const url = `${API_BASE_URL}/funds/status`;
    const payload = {
        funds: filters.selectedFunds || [],
        fund_types: filters.selectedTypes || [],
        fund_focuses: filters.selectedFocuses || []
    };
    const response = await axios.post(url, payload);
    return response.data;
};

export const getCommitmentsData = async (filters = {}) => {
    const url = `${API_BASE_URL}/commitments/?limit=${filters.limit || 10000}&offset=${filters.offset || 0}`;
    const payload = {
        years: filters.selectedYears || [],
        countries: filters.selectedCountries || []
    };
    const response = await axios.post(url, payload);
    return response.data.commitments || [];
};

export const getRecipientCountries = async () => {
  const response = await axios.get(`${API_BASE_URL}/countries/recipients`);
  return response.data.countries || [];
};

export const getTotalsByObjective = async (filters = {}) => {
  const url = `${API_BASE_URL}/commitments/totals_by_objective`;
  const payload = {
    years: filters.selectedYears || [],
    // O backend espera IDs, não nomes.
    recipient_countries: filters.selectedCountryIds || [] 
  };
  const response = await axios.post(url, payload);
  return response.data.totals || [];
};

export const getCommitmentTimeSeries = async (filters = {}) => {
    const url = `${API_BASE_URL}/commitments/time_series`;
    const payload = {
        years: filters.selectedYears || [],
        countries: filters.selectedCountryIds || [] 
    };
    const response = await axios.post(url, payload);
    return response.data.series || [];
};

export const getAvailableYears = async () => {
  const response = await axios.get(`${API_BASE_URL}/commitments/years`);
  return response.data || [];
};

export const getHeatmapFilterOptions = async (filters = {}) => {
  const params = {};
  if (filters.years?.length) {
    params.year = filters.years;
  }
  if (filters.countryIds?.length) {
    params.country_id = filters.countryIds;
  }
  if (filters.projectIds?.length) {
    params.project_id = filters.projectIds;
  }
  if (filters.objective && filters.objective !== "all") {
    params.objective = filters.objective;
  }
  const response = await axios.get(`${API_BASE_URL}/commitments/heatmap_filters`, {
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
  const url = `${API_BASE_URL}/chatbot/query`;
  const payload = {
    question,
    session_id: sessionId,
    page,
    page_size: pageSize,
    confirm_pagination: confirmPagination,
  };
  if (disambiguationChoice) {
    payload.disambiguation_choice = disambiguationChoice;
  }
  const response = await axios.post(url, payload);
  return response.data;
};


export const getCommitmentProjects = async () => {
    try {
        // (Assumindo que você criará este endpoint no backend)
        const response = await axios.get(`${API_BASE_URL}/projects/commitments`);
        return response.data.projects || [];
    } catch (error) {
        console.error("Error fetching commitment projects:", error);
        return [];
    }
};

// --- Função do Heatmap ---
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

    const response = await axios.get(`${API_BASE_URL}/commitments/heatmap_data`, {
        params,
        paramsSerializer: params => paramsSerializer(params)
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
    };
  } catch (error) {
    console.error("Error fetching heatmap data:", error);
    return { rows: [], columns: [], row_totals: [], column_totals: [], cells: [], error: error.message };
  }
};

export const getHeatmapCellProjects = async ({
  year,
  countryId,
  objective = 'all',
  limit = 30,
  offset = 0,
} = {}) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/commitments/heatmap_projects`, {
      params: {
        year,
        country_id: countryId,
        objective,
        limit,
        offset,
      },
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

    const response = await axios.get(`${API_BASE_URL}/commitments/heatmap_kpis`, {
      params,
      paramsSerializer: params => paramsSerializer(params),
    });

    return response.data || {
      total_projects: 0,
      total_countries: 0,
      total_amount: 0,
      total_adaptation: 0,
      total_mitigation: 0,
      total_overlap: 0,
    };
  } catch (error) {
    console.error("Error fetching heatmap KPIs:", error);
    return {
      total_projects: 0,
      total_countries: 0,
      total_amount: 0,
      total_adaptation: 0,
      total_mitigation: 0,
      total_overlap: 0,
      error: error.message,
    };
  }
};

// --- Função de KPIs (do seu DashboardPage novo) ---
export const getKpisData = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/commitments/kpis`);
        return response.data || { total_projects: 0, total_funded_countries: 0 };
    } catch (error) {
        console.error("Error fetching KPIs:", error);
        return { total_projects: 0, total_funded_countries: 0 };
    }
};

export const loadPaginatedProjects = async (search, loadedOptions, { page, filters } = {}) => {
  try {
    const limit = 20;
    const offset = page * limit;

    const params = {
      search: search || "",
      limit: limit,
      offset: offset,
    };
    if (filters?.years?.length) {
      params.year = filters.years;
    }
    if (filters?.countryIds?.length) {
      params.country_id = filters.countryIds;
    }
    if (filters?.objective && filters.objective !== "all") {
      params.objective = filters.objective;
    }

    const response = await axios.get(
      `${API_BASE_URL}/projects/commitments/paginated`,
      { params, paramsSerializer }
    );

    const data = response.data;

    // Formata os dados para o react-select ({ value, label })
    const options = data.projects.map(project => ({
      value: project.id,
      label: project.name,
    }));

    return {
      options: options,
      hasMore: data.has_more,
      additional: {
        page: page + 1,
      },
    };
  } catch (error) {
    console.error("Erro ao carregar projetos paginados:", error);
    return {
      options: [],
      hasMore: false,
    };
  }
};
