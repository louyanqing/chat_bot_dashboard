import { useState } from 'react'
import ChatBot from './components/ChatBot'
import FinancialDashboard from './components/FinancialDashboard'
import Recommendations from './components/Recommendations'
import './App.css'

const TABS = [
  { id: 'chat',    label: '💬 Chat' },
  { id: 'ratios',  label: '📊 Financial Ratios' },
  { id: 'recs',    label: '📈 Recommendations' },
]

function App() {
  const [activeTab, setActiveTab] = useState('chat')

  return (
    <div className="app-layout">
      <h1 className="app-heading">Peter Lynch Investment Dashboard</h1>

      <nav className="app-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="app-content">
        {activeTab === 'chat'   && <ChatBot />}
        {activeTab === 'ratios' && <FinancialDashboard />}
        {activeTab === 'recs'   && <Recommendations />}
      </div>
    </div>
  )
}

export default App
