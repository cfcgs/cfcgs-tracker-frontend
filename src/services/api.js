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


export const askChatbot = async (question) => {
  const url = `${API_BASE_URL}/chatbot/query`;
  const response = await axios.post(url, { question });
  return response.data.answer;
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

// --- [CORRIGIDO] Função do Sankey ---
export const getSankeyDiagramData = async (filters = {}) => {
  try {
    const params = {
        limit: filters.limit || 5,
        offset: filters.offset || 0,
        view: filters.view || 'project_country_year',
        objective: filters.objective || 'all',
        // [CORREÇÃO] Passa os arrays para o serializador
        year: filters.years || [], // Backend espera 'year' como alias
        country_id: filters.country_ids || [], // Backend espera 'country_id'
        project_id: filters.project_ids || [],   // Backend espera 'project_id'
    };

    // [CORREÇÃO] Usa o paramsSerializer para formatar os arrays corretamente
    const response = await axios.get(`${API_BASE_URL}/commitments/sankey_data`, { 
        params,
        paramsSerializer: params => paramsSerializer(params) // <-- CHAVE DA CORREÇÃO
    });

    return response.data || { total_projects: 0, data: [] };
  } catch (error) {
    console.error("Error fetching Sankey data:", error);
    return { total_projects: 0, data: [], error: error.message };
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

export const loadPaginatedProjects = async (search, loadedOptions, { page }) => {
  try {
    const limit = 20;
    const offset = page * limit;

    const params = {
      search: search || "",
      limit: limit,
      offset: offset,
    };

    const response = await axios.get(
      `${API_BASE_URL}/projects/commitments/paginated`,
      { params }
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