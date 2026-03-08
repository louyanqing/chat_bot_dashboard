import { create } from 'zustand'
import client from '../api/client'

const useFinanceStore = create((set) => ({
  ratios: [],
  recommendations: { long: [], short: [] },
  loading: false,
  error: null,

  fetchRatios: async (symbols = null) => {
    set({ loading: true, error: null })
    try {
      const params = symbols ? { symbols: symbols.join(',') } : {}
      const { data } = await client.get('/finance/ratios', { params })
      set({ ratios: data.ratios, loading: false })
    } catch (err) {
      set({ error: err.response?.data?.detail ?? err.message, loading: false })
    }
  },

  fetchRecommendations: async () => {
    set({ loading: true, error: null })
    try {
      const { data } = await client.get('/finance/recommendations')
      set({ recommendations: data, loading: false })
    } catch (err) {
      set({ error: err.response?.data?.detail ?? err.message, loading: false })
    }
  },
}))

export default useFinanceStore
