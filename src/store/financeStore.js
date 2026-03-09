import { create } from 'zustand'
import client from '../api/client'

export const DOW30 = [
  'AAPL', 'AMGN', 'AXP',  'BA',   'CAT',  'CRM',  'CSCO', 'CVX',
  'DIS',  'DOW',  'GS',   'HD',   'HON',  'IBM',  'JNJ',  'JPM',
  'KO',   'MCD',  'MMM',  'MRK',  'MSFT', 'NKE',  'NVDA', 'PG',
  'SHW',  'TRV',  'UNH',  'V',    'VZ',   'WMT',
]

const RETRY_INTERVAL_MS = 5000

const useFinanceStore = create((set, get) => ({
  ratios: [],
  recommendations: { long: [], short: [] },
  clusterPoints: [],
  selectedSymbols: [...DOW30],
  loading: false,
  ready: false,
  error: null,

  // ── symbol management ──────────────────────────────────────────────

  addSymbol: (symbol) => {
    const sym = symbol.trim().toUpperCase()
    if (!sym) return
    const { selectedSymbols, fetchRatios } = get()
    if (selectedSymbols.includes(sym)) return
    set({ selectedSymbols: [...selectedSymbols, sym] })
    fetchRatios()
  },

  removeSymbol: (symbol) => {
    const { selectedSymbols, fetchRatios } = get()
    set({ selectedSymbols: selectedSymbols.filter((s) => s !== symbol) })
    fetchRatios()
  },

  resetSymbols: () => {
    set({ selectedSymbols: [...DOW30] })
    get().fetchRatios()
  },

  // ── data fetching ──────────────────────────────────────────────────

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

  fetchRatios: async () => {
    const { selectedSymbols } = get()
    set({ loading: true, error: null })
    try {
      const params = { symbols: selectedSymbols.join(',') }
      const { data } = await client.get('/finance/ratios', { params })
      set({ ratios: data.ratios, loading: false, ready: true })
    } catch (err) {
      if (err.response?.status === 503) {
        get()._waitThenFetch(() => get().fetchRatios())
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

  fetchClusters: async () => {
    set({ loading: true, error: null })
    try {
      const { data } = await client.get('/finance/clusters')
      set({ clusterPoints: data.points, loading: false, ready: true })
    } catch (err) {
      if (err.response?.status === 503) {
        get()._waitThenFetch(() => get().fetchClusters())
      } else {
        set({ error: err.response?.data?.detail ?? err.message, loading: false })
      }
    }
  },
}))

export default useFinanceStore
