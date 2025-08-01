import axios from 'axios';

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
    const url = `${API_BASE_URL}/commitments/?limit=100000000`;
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
