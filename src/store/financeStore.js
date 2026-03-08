import { create } from 'zustand'
import client from '../api/client'

const RETRY_INTERVAL_MS = 5000

const useFinanceStore = create((set, get) => ({
  ratios: [],
  recommendations: { long: [], short: [] },
  loading: false,
  ready: false,   // true once backend fin data is loaded
  error: null,

  // Poll /finance/status until ready, then run fetchFn
  _waitThenFetch: async (fetchFn) => {
    const check = async () => {
      try {
        const { data } = await client.get('/finance/status')
        if (data.ready) {
          set({ ready: true })
          await fetchFn()
        } else {
          setTimeout(check, RETRY_INTERVAL_MS)
        }
      } catch {
        setTimeout(check, RETRY_INTERVAL_MS)
      }
    }
    await check()
  },

  fetchRatios: async (symbols = null) => {
    set({ loading: true, error: null })
    try {
      const params = symbols ? { symbols: symbols.join(',') } : {}
      const { data } = await client.get('/finance/ratios', { params })
      set({ ratios: data.ratios, loading: false, ready: true })
    } catch (err) {
      if (err.response?.status === 503) {
        // data still loading — poll until ready
        get()._waitThenFetch(() => get().fetchRatios(symbols))
      } else {
        set({ error: err.response?.data?.detail ?? err.message, loading: false })
      }
    }
  },

  fetchRecommendations: async () => {
    set({ loading: true, error: null })
    try {
      const { data } = await client.get('/finance/recommendations')
      set({ recommendations: data, loading: false, ready: true })
    } catch (err) {
      if (err.response?.status === 503) {
        get()._waitThenFetch(() => get().fetchRecommendations())
      } else {
        set({ error: err.response?.data?.detail ?? err.message, loading: false })
      }
    }
  },
}))

export default useFinanceStore
