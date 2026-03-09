import { useEffect, useRef, useState } from 'react'
import useFinanceStore, { DOW30 } from '../store/financeStore'
import './FinancialDashboard.css'

const COLUMNS = [
  { key: 'symbol',         label: 'Symbol',       format: (v) => v },
  { key: 'currentPrice',   label: 'Price ($)',     format: (v) => v?.toFixed(2) ?? '—' },
  { key: 'returnOnEquity', label: 'ROE',           format: pct },
  { key: 'returnOnAssets', label: 'ROA',           format: pct },
  { key: 'debtToEquity',   label: 'D/E',           format: (v) => v?.toFixed(2) ?? '—' },
  { key: 'currentRatio',   label: 'Current Ratio', format: (v) => v?.toFixed(2) ?? '—' },
  { key: 'profitMargins',  label: 'Profit Margin', format: pct },
  { key: 'earningsGrowth', label: 'EPS Growth',    format: pct },
  { key: 'revenueGrowth',  label: 'Rev Growth',    format: pct },
]

function pct(v) {
  return v == null ? '—' : `${(v * 100).toFixed(1)}%`
}

export default function FinancialDashboard() {
  const ratios          = useFinanceStore((s) => s.ratios)
  const loading         = useFinanceStore((s) => s.loading)
  const error           = useFinanceStore((s) => s.error)
  const selectedSymbols = useFinanceStore((s) => s.selectedSymbols)
  const fetchRatios     = useFinanceStore((s) => s.fetchRatios)
  const addSymbol       = useFinanceStore((s) => s.addSymbol)
  const removeSymbol    = useFinanceStore((s) => s.removeSymbol)
  const resetSymbols    = useFinanceStore((s) => s.resetSymbols)

  const [sortKey, setSortKey]             = useState('symbol')
  const [sortAsc, setSortAsc]             = useState(true)
  const [addInput, setAddInput]           = useState('')
  const [dropdownOpen, setDropdownOpen]   = useState(false)
  const [toRemove, setToRemove]           = useState(new Set())
  const dropdownRef                       = useRef(null)

  useEffect(() => { fetchRatios() }, [])

  // close dropdown on outside click
  useEffect(() => {
    function onOutsideClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
        setToRemove(new Set())
      }
    }
    document.addEventListener('mousedown', onOutsideClick)
    return () => document.removeEventListener('mousedown', onOutsideClick)
  }, [])

  function toggleCheck(sym) {
    setToRemove((prev) => {
      const next = new Set(prev)
      next.has(sym) ? next.delete(sym) : next.add(sym)
      return next
    })
  }

  function handleRemoveSelected() {
    toRemove.forEach((sym) => removeSymbol(sym))
    setToRemove(new Set())
    setDropdownOpen(false)
  }

  function handleAdd() {
    const sym = addInput.trim().toUpperCase()
    if (!sym) return
    addSymbol(sym)
    setAddInput('')
  }

  function handleSort(key) {
    if (key === sortKey) setSortAsc((a) => !a)
    else { setSortKey(key); setSortAsc(true) }
  }

  const sorted = [...ratios].sort((a, b) => {
    const av = a[sortKey] ?? (sortKey === 'symbol' ? '' : -Infinity)
    const bv = b[sortKey] ?? (sortKey === 'symbol' ? '' : -Infinity)
    if (av < bv) return sortAsc ? -1 : 1
    if (av > bv) return sortAsc ? 1 : -1
    return 0
  })

  const isDow30 =
    selectedSymbols.length === DOW30.length &&
    DOW30.every((s) => selectedSymbols.includes(s))

  return (
    <div className="fin-dashboard">
      {/* ── Header ── */}
      <div className="fin-header">
        <h2 className="fin-title">Key Financial Ratios</h2>
        <button className="fin-reload-btn" onClick={fetchRatios} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {/* ── Portfolio controls ── */}
      <div className="fin-selector">
        <div className="fin-selector-top">
          <span className="fin-selector-label">
            Portfolio — {selectedSymbols.length} stock{selectedSymbols.length !== 1 ? 's' : ''}
          </span>
          {!isDow30 && (
            <button className="fin-reset-btn" onClick={resetSymbols}>
              Reset to DOW 30
            </button>
          )}
        </div>

        {/* add + remove controls */}
        <div className="fin-controls-row">
          {/* add */}
          <div className="fin-add-row">
            <input
              className="fin-add-input"
              placeholder="Add ticker, e.g. TSLA"
              value={addInput}
              onChange={(e) => setAddInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              maxLength={10}
            />
            <button className="fin-add-btn" onClick={handleAdd} disabled={!addInput.trim()}>
              Add
            </button>
          </div>

          {/* remove dropdown */}
          <div className="fin-dropdown-wrapper" ref={dropdownRef}>
            <button
              className="fin-dropdown-trigger"
              onClick={() => { setDropdownOpen((o) => !o); setToRemove(new Set()) }}
              disabled={selectedSymbols.length === 0}
            >
              Remove stocks {dropdownOpen ? '▲' : '▾'}
            </button>

            {dropdownOpen && (
              <div className="fin-dropdown-panel">
                <div className="fin-dropdown-list">
                  {selectedSymbols.map((sym) => (
                    <label key={sym} className="fin-dropdown-item">
                      <input
                        type="checkbox"
                        checked={toRemove.has(sym)}
                        onChange={() => toggleCheck(sym)}
                      />
                      <span className="fin-dropdown-sym">{sym}</span>
                    </label>
                  ))}
                </div>
                <div className="fin-dropdown-footer">
                  <button
                    className="fin-remove-btn"
                    onClick={handleRemoveSelected}
                    disabled={toRemove.size === 0}
                  >
                    Remove selected ({toRemove.size})
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && <p className="fin-error">⚠️ {error}</p>}

      {/* ── Table ── */}
      {loading && !ratios.length ? (
        <p className="fin-loading">
          Fetching financial data from Yahoo Finance in the background — checking every 5 s…
        </p>
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
                    <td
                      key={col.key}
                      className={`fin-td ${col.key === 'symbol' ? 'symbol-cell' : ''}`}
                    >
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
