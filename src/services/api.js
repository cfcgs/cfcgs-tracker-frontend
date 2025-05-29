import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export const getFundTypes = async () => {
  const response = await axios.get(`${API_BASE_URL}/fund_types/`);
  return response.data.fund_types;
};

export const getFundFocuses = async () => {
  const response = await axios.get(`${API_BASE_URL}/fund_focuses/`);
  return response.data.fund_focuses;
};

export const getFundsData = async (filters=null) => {
    const limit=40;
    const offset=0;
    const url = `${API_BASE_URL}/funds/?limit=${limit}&offset=${offset}`;

    let payload = {}
    if (filters){
        payload = {
            fund_types: filters.selectedTypes,
            fund_focuses: filters.selectedFocuses
        }
    }

    try {   
        const response = await axios.post(url, payload);
        return response.data.funds;
    } catch (error) {
        throw error;
    }
};

export const getFundStatusData = async (filters) => {
  const url = `${API_BASE_URL}/funds/status`; 
  try {
    const response = await axios.post(url, filters);
    return response.data;
  } catch (error) {
    throw error;
  }
};