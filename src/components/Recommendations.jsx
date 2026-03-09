import { useEffect } from 'react'
import {
  ResponsiveContainer, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import useFinanceStore from '../store/financeStore'
import './Recommendations.css'

const SIGNAL_COLOR = { long: '#48c78e', short: '#ff6b6b', neutral: '#7070a0' }
const SIGNAL_LABEL = { long: 'Long',    short: 'Short',   neutral: 'Neutral'  }

// Custom dot: circle + ticker label for long/short, smaller dot for neutral
function ClusterDot(props) {
  const { cx, cy, payload } = props
  const color = SIGNAL_COLOR[payload.signal]
  const highlight = payload.signal !== 'neutral'
  return (
    <g>
      <circle cx={cx} cy={cy} r={highlight ? 7 : 5} fill={color} opacity={0.85} stroke="#1e1e2e" strokeWidth={1} />
      {highlight && (
        <text x={cx} y={cy - 11} textAnchor="middle" fill={color} fontSize={10} fontFamily="monospace" fontWeight="700">
          {payload.symbol}
        </text>
      )}
    </g>
  )
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="rec-tooltip">
      <span className="rec-tooltip-sym">{p.symbol}</span>
      <span className="rec-tooltip-signal" style={{ color: SIGNAL_COLOR[p.signal] }}>
        {SIGNAL_LABEL[p.signal]}
      </span>
      <span className="rec-tooltip-cluster">Cluster {p.cluster}</span>
    </div>
  )
}

// Split points by signal for separate <Scatter> series
function groupBySignal(points) {
  const groups = { long: [], short: [], neutral: [] }
  for (const p of points) groups[p.signal]?.push(p)
  return groups
}

export default function Recommendations() {
  const recommendations = useFinanceStore((s) => s.recommendations)
  const clusterPoints   = useFinanceStore((s) => s.clusterPoints)
  const loading         = useFinanceStore((s) => s.loading)
  const error           = useFinanceStore((s) => s.error)
  const fetchRecommendations = useFinanceStore((s) => s.fetchRecommendations)
  const fetchClusters        = useFinanceStore((s) => s.fetchClusters)

  useEffect(() => {
    fetchRecommendations()
    fetchClusters()
  }, [])

  function handleRefresh() {
    fetchRecommendations()
    fetchClusters()
  }

  const { long, short } = recommendations
  const groups = groupBySignal(clusterPoints)
  const hasChart = clusterPoints.length > 0

  return (
    <div className="rec-container">
      {/* ── Header ── */}
      <div className="rec-header">
        <h2 className="rec-title">K-Means Cluster — Long / Short Recommendations</h2>
        <button className="rec-reload-btn" onClick={handleRefresh} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      <p className="rec-subtitle">
        K-Means (4 clusters) on normalized financial metrics. Scatter axes are PCA principal components
        — PC1 captures value factors, PC2 captures quality/growth factors.
      </p>

      {error && <p className="rec-error">⚠️ {error}</p>}

      {loading && !hasChart ? (
        <p className="rec-loading">Running K-Means clustering in the background — checking every 5 s…</p>
      ) : (
        <>
          {/* ── Scatter plot ── */}
          {hasChart && (
            <div className="rec-chart-wrapper">
              <h3 className="rec-chart-title">Value–Quality Cluster Map</h3>
              <ResponsiveContainer width="100%" height={380}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 10, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2e2e45" />
                  <XAxis
                    dataKey="x"
                    type="number"
                    name="PC1 (Value)"
                    tick={{ fill: '#9090b0', fontSize: 11 }}
                    label={{ value: 'PC1 — Value Factor', position: 'insideBottom', offset: -2, fill: '#9090b0', fontSize: 11 }}
                  />
                  <YAxis
                    dataKey="y"
                    type="number"
                    name="PC2 (Quality)"
                    tick={{ fill: '#9090b0', fontSize: 11 }}
                    label={{ value: 'PC2 — Quality / Growth', angle: -90, position: 'insideLeft', offset: 10, fill: '#9090b0', fontSize: 11 }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                  <Legend
                    formatter={(value) => <span style={{ color: SIGNAL_COLOR[value], fontSize: '0.85rem' }}>{SIGNAL_LABEL[value]}</span>}
                  />
                  {['neutral', 'short', 'long'].map((sig) => (
                    <Scatter
                      key={sig}
                      name={sig}
                      data={groups[sig]}
                      shape={<ClusterDot />}
                      fill={SIGNAL_COLOR[sig]}
                    />
                  ))}
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ── Long / Short lists ── */}
          <div className="rec-columns">
            <div className="rec-panel long">
              <h3 className="rec-panel-title">
                <span className="rec-badge long-badge">LONG</span>
                {long.length} stocks
              </h3>
              <ul className="rec-list">
                {long.map((sym) => <li key={sym} className="rec-item long-item">{sym}</li>)}
                {long.length === 0 && <li className="rec-empty">No long recommendations</li>}
              </ul>
            </div>

            <div className="rec-panel short">
              <h3 className="rec-panel-title">
                <span className="rec-badge short-badge">SHORT</span>
                {short.length} stocks
              </h3>
              <ul className="rec-list">
                {short.map((sym) => <li key={sym} className="rec-item short-item">{sym}</li>)}
                {short.length === 0 && <li className="rec-empty">No short recommendations</li>}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
