import { useEffect } from 'react'
import useFinanceStore from '../store/financeStore'
import './Recommendations.css'

export default function Recommendations() {
  const recommendations = useFinanceStore((s) => s.recommendations)
  const loading = useFinanceStore((s) => s.loading)
  const error = useFinanceStore((s) => s.error)
  const fetchRecommendations = useFinanceStore((s) => s.fetchRecommendations)

  useEffect(() => { fetchRecommendations() }, [])

  const { long, short } = recommendations

  return (
    <div className="rec-container">
      <div className="rec-header">
        <h2 className="rec-title">K-Means Cluster — Long / Short Recommendations</h2>
        <button className="rec-reload-btn" onClick={fetchRecommendations} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      <p className="rec-subtitle">
        Based on K-Means clustering (4 clusters) of normalized financial metrics across all Dow Jones stocks.
      </p>

      {error && <p className="rec-error">⚠️ {error}</p>}

      {loading && !long.length && !short.length ? (
        <p className="rec-loading">Running K-Means clustering in the background — checking every 5 s…</p>
      ) : (
        <div className="rec-columns">
          <div className="rec-panel long">
            <h3 className="rec-panel-title">
              <span className="rec-badge long-badge">LONG</span>
              {long.length} stocks
            </h3>
            <ul className="rec-list">
              {long.map((sym) => (
                <li key={sym} className="rec-item long-item">{sym}</li>
              ))}
              {long.length === 0 && <li className="rec-empty">No long recommendations</li>}
            </ul>
          </div>

          <div className="rec-panel short">
            <h3 className="rec-panel-title">
              <span className="rec-badge short-badge">SHORT</span>
              {short.length} stocks
            </h3>
            <ul className="rec-list">
              {short.map((sym) => (
                <li key={sym} className="rec-item short-item">{sym}</li>
              ))}
              {short.length === 0 && <li className="rec-empty">No short recommendations</li>}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
