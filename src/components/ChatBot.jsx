import { useState, useRef, useEffect } from 'react'
import './ChatBot.css'

const PETER_LYNCH_KB = [
  {
    keywords: ['peg', 'peg ratio'],
    answer:
      'The PEG ratio (Price/Earnings to Growth) is Peter Lynch\'s favorite metric. A PEG below 1.0 suggests the stock may be undervalued relative to its growth rate. Lynch said: "The P/E ratio of any company that\'s fairly priced will equal its growth rate." Always compare PEG to industry peers.',
  },
  {
    keywords: ['pe', 'p/e', 'price to earnings', 'price earnings'],
    answer:
      'Lynch viewed P/E in context of growth. A high P/E alone doesn\'t make a stock expensive if earnings are growing fast. He preferred to use the PEG ratio — dividing P/E by the earnings growth rate — to find stocks that are cheap relative to their growth.',
  },
  {
    keywords: ['invest in what you know', 'know what you own', 'what you know'],
    answer:
      '"Invest in what you know" is Lynch\'s most famous principle. Everyday observations — noticing a crowded restaurant, a popular product, a booming local business — can give amateur investors an edge over Wall Street before the pros catch on. The key is then doing the homework to confirm the investment thesis.',
  },
  {
    keywords: ['tenbagger', 'ten bagger', '10x'],
    answer:
      'A "tenbagger" is a stock that grows to 10× its purchase price — a term Lynch coined from baseball. He found tenbaggers by looking for small, underfollowed companies with strong growth, simple business models, and low debt. Patience is essential: most tenbaggers take years to fully develop.',
  },
  {
    keywords: ['category', 'categories', 'slow grower', 'stalwart', 'fast grower', 'cyclical', 'turnaround', 'asset play'],
    answer:
      'Lynch classified stocks into six categories:\n\n1. Slow Growers — large, mature companies; bought for dividends.\n2. Stalwarts — large companies growing 10–12%; good for safety.\n3. Fast Growers — small, aggressive companies growing 20–25%; best tenbagger candidates.\n4. Cyclicals — revenues rise and fall with the economy (autos, airlines).\n5. Turnarounds — troubled companies with recovery potential.\n6. Asset Plays — companies sitting on overlooked assets.\n\nKnowing the category determines what to look for and when to sell.',
  },
  {
    keywords: ['fast grower', 'growth stock', 'growth company'],
    answer:
      'Fast growers are Lynch\'s favorite category. Look for companies growing earnings 20–25% per year in an expanding market. Key checks: strong balance sheet, low debt, a replicable business model (e.g., a chain that can expand), and a PEG below 1. Beware of "weed fast growers" — rapid growth in a saturated market.',
  },
  {
    keywords: ['debt', 'balance sheet', 'leverage'],
    answer:
      'Lynch always checked the balance sheet. He avoided companies with heavy debt, especially in cyclical industries. A cash-rich company with little debt can survive downturns and fund its own growth. The cash-to-debt ratio and debt-to-equity ratio are key metrics to review before buying.',
  },
  {
    keywords: ['sell', 'when to sell', 'exit'],
    answer:
      'Lynch recommended selling when: (1) the original story has changed, (2) the stock is priced beyond its growth (PEG > 2), (3) a better opportunity exists, or (4) for cyclicals, when inventories rise and margins peak. He warned against selling simply because a stock has risen — tenbaggers require holding through volatility.',
  },
  {
    keywords: ['dividend', 'income', 'yield'],
    answer:
      'Lynch was cautious about companies that prioritize dividends over reinvesting in growth. He preferred "fast growers" that retain earnings to expand. However, for slow growers and stalwarts, a consistent and growing dividend is a sign of financial health and management confidence.',
  },
  {
    keywords: ['research', 'homework', 'due diligence', 'analyze'],
    answer:
      'Lynch stressed doing your own research before investing. Visit the company, use its products, talk to employees or customers. Then check: earnings growth rate, PEG ratio, debt load, cash position, insider ownership, and institutional coverage. Low analyst coverage often signals a hidden opportunity.',
  },
  {
    keywords: ['insider', 'insider buying', 'management'],
    answer:
      'Insider buying is a bullish signal Lynch paid attention to. When executives buy shares in the open market with their own money — not options — it shows confidence in the company\'s future. Insider selling is less meaningful since people sell for many personal reasons.',
  },
  {
    keywords: ['market', 'market timing', 'predict', 'crash', 'recession'],
    answer:
      'Lynch famously said: "Far more money has been lost by investors preparing for corrections, or trying to anticipate corrections, than has been lost in corrections themselves." He did not believe in market timing. Instead, he focused on individual company fundamentals and stayed invested for the long term.',
  },
  {
    keywords: ['cash', 'cash flow', 'free cash flow'],
    answer:
      'Lynch liked companies generating strong free cash flow. He looked at cash per share relative to the stock price — a company with significant net cash effectively trades at a discount. Free cash flow also funds growth without diluting shareholders or increasing debt.',
  },
  {
    keywords: ['institutional', 'wall street', 'analyst'],
    answer:
      'Lynch believed low institutional ownership and analyst coverage was often a positive sign — it meant Wall Street had not yet discovered the stock. When 60–80% of a company\'s shares are held by institutions and all analysts rate it a "buy," Lynch viewed it as a warning of limited upside.',
  },
  {
    keywords: ['inventory', 'inventories'],
    answer:
      'Rising inventories relative to sales is a red flag Lynch always checked. It often means demand is slowing before it shows up in earnings. For retailers and manufacturers especially, inventory growth significantly outpacing revenue growth signals trouble ahead.',
  },
  {
    keywords: ['peter lynch', 'who is', 'about', 'philosophy', 'strategy', 'approach'],
    answer:
      'Peter Lynch managed the Magellan Fund at Fidelity from 1977 to 1990, averaging a 29.2% annual return — one of the best track records in history. His philosophy: do your homework, invest in simple businesses you understand, use the PEG ratio to value growth, classify stocks by type, and hold long enough to let winners compound. His books "One Up on Wall Street" and "Beating the Street" are essential reading.',
  },
]

const DEFAULT_ANSWER =
  'That\'s a great question for a Peter Lynch follower! Lynch\'s core advice: invest in what you know, do your homework on financials (especially the PEG ratio), classify the stock by type, and hold long enough for the story to play out. Could you rephrase your question with a keyword like "PEG", "tenbagger", "sell", "debt", or "categories"?'

function getAnswer(question) {
  const q = question.toLowerCase()
  for (const entry of PETER_LYNCH_KB) {
    if (entry.keywords.some((kw) => q.includes(kw))) {
      return entry.answer
    }
  }
  return DEFAULT_ANSWER
}

export default function ChatBot() {
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: 'Hi! I\'m a Peter Lynch investment advisor. Ask me about his strategies — PEG ratio, tenbaggers, stock categories, when to sell, and more.',
    },
  ])
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSend() {
    const text = input.trim()
    if (!text) return

    const userMsg = { role: 'user', text }
    const botMsg = { role: 'bot', text: getAnswer(text) }

    setMessages((prev) => [...prev, userMsg, botMsg])
    setInput('')
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
        />
        <button className="chatbot-send-btn" onClick={handleSend} disabled={!input.trim()}>
          Send
        </button>
      </div>
    </div>
  )
}
