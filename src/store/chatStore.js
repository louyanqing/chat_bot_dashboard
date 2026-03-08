import { create } from 'zustand'
import client from '../api/client'

const useChatStore = create((set, get) => ({
  messages: [],
  loading: false,
  error: null,

  initialize: async () => {
    try {
      const { data } = await client.get('/')
      set({ messages: [{ role: 'bot', text: data.message }] })
    } catch {
      set({
        messages: [{ role: 'bot', text: 'Could not connect to the backend. Is the server running?' }],
        error: 'Backend unreachable',
      })
    }
  },

  sendMessage: async (text) => {
    const { messages } = get()
    const userMsg = { role: 'user', text }
    const history = messages.map((m) => ({ role: m.role, content: m.text }))

    set({ messages: [...messages, userMsg], loading: true, error: null })

    try {
      const { data } = await client.post('/chat', { message: text, history })
      set((s) => ({
        messages: [...s.messages, { role: 'bot', text: data.answer }],
        loading: false,
      }))
    } catch (err) {
      const detail = err.response?.data?.detail ?? err.message
      set((s) => ({
        messages: [...s.messages, { role: 'bot', text: `⚠️ ${detail}` }],
        loading: false,
        error: detail,
      }))
    }
  },

  clearMessages: () => {
    get().initialize()
  },
}))

export default useChatStore
