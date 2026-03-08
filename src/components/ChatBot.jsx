import { useState, useRef, useEffect } from 'react'
import useChatStore from '../store/chatStore'
import './ChatBot.css'

export default function ChatBot() {
  const messages = useChatStore((s) => s.messages)
  const loading = useChatStore((s) => s.loading)
  const sendMessage = useChatStore((s) => s.sendMessage)
  const initialize = useChatStore((s) => s.initialize)

  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => { initialize() }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  function handleSend() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    sendMessage(text)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <span className="chatbot-avatar">🦁</span>
        <div>
          <h2 className="chatbot-title">Peter Lynch Investment Advisor</h2>
          <p className="chatbot-subtitle">Ask me anything about Lynch&apos;s investing principles</p>
        </div>
      </div>

      <div className="chatbot-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message-row ${msg.role}`}>
            <div className={`message-bubble ${msg.role}`}>
              {msg.text.split('\n').map((line, j) => (
                <span key={j}>
                  {line}
                  {j < msg.text.split('\n').length - 1 && <br />}
                </span>
              ))}
            </div>
          </div>
        ))}

        {loading && (
          <div className="message-row bot">
            <div className="message-bubble bot loading">Thinking…</div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="chatbot-input-row">
        <textarea
          className="chatbot-input"
          placeholder="Ask about PEG ratio, tenbaggers, when to sell..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          disabled={loading}
        />
        <button
          className="chatbot-send-btn"
          onClick={handleSend}
          disabled={!input.trim() || loading}
        >
          {loading ? '…' : 'Send'}
        </button>
      </div>
    </div>
  )
}
