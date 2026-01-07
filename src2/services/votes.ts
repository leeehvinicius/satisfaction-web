import axios from 'axios';
import { Vote, VoteAnalytics } from '../types/vote';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.vvrefeicoes.com.br';

const votesService = {
  getAll: async (): Promise<Vote[]> => {
    try {
      const response = await axios.get(`${API_URL}/votes`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Falha ao buscar votos');
      }
      throw error;
    }
  },

  getAnalytics: async (): Promise<VoteAnalytics> => {
    try {
      const response = await axios.get(`${API_URL}/votes/analytics`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Falha ao buscar análises');
      }
      throw error;
    }
  },
};

export default votesService; 