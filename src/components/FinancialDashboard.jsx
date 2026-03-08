import { useEffect, useState } from 'react'
import useFinanceStore from '../store/financeStore'
import './FinancialDashboard.css'

const COLUMNS = [
  { key: 'symbol',          label: 'Symbol',          format: (v) => v },
  { key: 'currentPrice',    label: 'Price ($)',        format: (v) => v?.toFixed(2) ?? '—' },
  { key: 'returnOnEquity',  label: 'ROE',             format: pct },
  { key: 'returnOnAssets',  label: 'ROA',             format: pct },
  { key: 'debtToEquity',    label: 'D/E',             format: (v) => v?.toFixed(2) ?? '—' },
  { key: 'currentRatio',    label: 'Current Ratio',   format: (v) => v?.toFixed(2) ?? '—' },
  { key: 'profitMargins',   label: 'Profit Margin',   format: pct },
  { key: 'earningsGrowth',  label: 'EPS Growth',      format: pct },
  { key: 'revenueGrowth',   label: 'Rev Growth',      format: pct },
]

function pct(v) {
  return v == null ? '—' : `${(v * 100).toFixed(1)}%`
}

export default function FinancialDashboard() {
  const ratios = useFinanceStore((s) => s.ratios)
  const loading = useFinanceStore((s) => s.loading)
  const error = useFinanceStore((s) => s.error)
  const fetchRatios = useFinanceStore((s) => s.fetchRatios)

  const [sortKey, setSortKey] = useState('symbol')
  const [sortAsc, setSortAsc] = useState(true)

  useEffect(() => { fetchRatios() }, [])

  function handleSort(key) {
    if (key === sortKey) {
      setSortAsc((a) => !a)
    } else {
      setSortKey(key)
      setSortAsc(true)
    }
  }

  const sorted = [...ratios].sort((a, b) => {
    const av = a[sortKey] ?? (sortKey === 'symbol' ? '' : -Infinity)
    const bv = b[sortKey] ?? (sortKey === 'symbol' ? '' : -Infinity)
    if (av < bv) return sortAsc ? -1 : 1
    if (av > bv) return sortAsc ? 1 : -1
    return 0
  })

  return (
    <div className="fin-dashboard">
      <div className="fin-header">
        <h2 className="fin-title">Dow Jones — Key Financial Ratios</h2>
        <button className="fin-reload-btn" onClick={() => fetchRatios()} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {error && <p className="fin-error">⚠️ {error}</p>}

      {loading && !ratios.length ? (
        <p className="fin-loading">Fetching financial data… this may take a moment.</p>
      ) : (
        <div className="fin-table-wrapper">
          <table className="fin-table">
            <thead>
              <tr>
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className={`fin-th ${sortKey === col.key ? 'active' : ''}`}
                    onClick={() => handleSort(col.key)}
                  >
                    {col.label}
                    <span className="sort-arrow">
                      {sortKey === col.key ? (sortAsc ? ' ▲' : ' ▼') : ' ⇅'}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => (
                <tr key={row.symbol} className="fin-tr">
                  {COLUMNS.map((col) => (
                    <td key={col.key} className={`fin-td ${col.key === 'symbol' ? 'symbol-cell' : ''}`}>
                      {col.format(row[col.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
