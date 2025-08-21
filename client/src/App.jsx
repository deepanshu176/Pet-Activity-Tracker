import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE = 'http://localhost:4000/api'

function useForm(initial) {
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState({})
  const onChange = (e) => {
    const { name, value } = e.target
    setValues((v) => ({ ...v, [name]: value }))
  }
  return { values, setValues, errors, setErrors, onChange }
}

function ActivityForm({ onSubmitSuccess }) {
  const { values, setValues, errors, setErrors, onChange } = useForm({
    petName: '',
    type: 'walk',
    amount: '',
    dateTime: new Date().toISOString().slice(0, 16),
  })

  useEffect(() => {
    setValues((v) => ({ ...v, dateTime: new Date().toISOString().slice(0, 16) }))
  }, [setValues])

  const validate = () => {
    const e = {}
    if (!values.petName.trim()) e.petName = 'Pet name is required'
    if (!values.amount || Number(values.amount) <= 0) e.amount = 'Enter a positive number'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const eMap = validate()
    setErrors(eMap)
    if (Object.keys(eMap).length) return
    const payload = {
      petName: values.petName.trim(),
      type: values.type,
      amount: Number(values.amount),
      dateTime: values.dateTime ? new Date(values.dateTime).toISOString() : undefined,
    }
    const res = await fetch(`${API_BASE}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      alert(err.error || 'Failed to log activity')
      return
    }
    setValues((v) => ({ ...v, amount: '' }))
    onSubmitSuccess?.()
  }

  return (
    <div className="card">
      <div className="title">Log Activity</div>
      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="petName">Pet name</label>
        <input name="petName" id="petName" placeholder="Rex" value={values.petName} onChange={onChange} />
        {errors.petName && <div className="error">{errors.petName}</div>}

        <div className="row" style={{ marginTop: 12 }}>
          <div>
            <label htmlFor="type">Activity</label>
            <select name="type" id="type" value={values.type} onChange={onChange}>
              <option value="walk">Walk (minutes)</option>
              <option value="meal">Meal (count)</option>
              <option value="medication">Medication (count)</option>
            </select>
          </div>
          <div>
            <label htmlFor="amount">Duration/Qty</label>
            <input name="amount" id="amount" type="number" inputMode="numeric" min="1" value={values.amount} onChange={onChange} />
            {errors.amount && <div className="error">{errors.amount}</div>}
          </div>
        </div>

        <label htmlFor="dateTime" style={{ marginTop: 12 }}>Date/Time</label>
        <input name="dateTime" id="dateTime" type="datetime-local" value={values.dateTime} onChange={onChange} />

        <button type="submit" style={{ marginTop: 12 }}>Save</button>
      </form>
    </div>
  )
}

function Summary({ filterPet }) {
  const [summary, setSummary] = useState({ totalWalkMinutes: 0, meals: 0, meds: 0 })
  const [needsWalk, setNeedsWalk] = useState(false)

  const load = async () => {
    const qs = filterPet ? `?petName=${encodeURIComponent(filterPet)}` : ''
    const res = await fetch(`${API_BASE}/summary/today${qs}`)
    const data = await res.json()
    setSummary(data)
    const res2 = await fetch(`${API_BASE}/needs-walk${qs}`)
    const data2 = await res2.json()
    setNeedsWalk(Boolean(data2.shouldPrompt))
  }

  useEffect(() => { load() }, [filterPet])

  const walkProgress = useMemo(() => {
    const goal = 30
    const pct = Math.min(100, Math.round((summary.totalWalkMinutes / goal) * 100))
    return pct
  }, [summary.totalWalkMinutes])

  return (
    <div className="card">
      <div className="title">Today's Summary{filterPet ? ` · ${filterPet}` : ''}</div>
      <div className="subtitle">Walk: {summary.totalWalkMinutes} min | Meals: {summary.meals} | Meds: {summary.meds}</div>
      <div className="bar" style={{ '--progress': `${walkProgress}%` }}>
        <span></span>
      </div>
      {needsWalk && (
        <div className="error" style={{ marginTop: 8 }}>
          {filterPet ? `${filterPet} still needs exercise today!` : 'Your pet still needs exercise today!'}
        </div>
      )}
    </div>
  )
}

function Chatbot() {
  const [petName, setPetName] = useState('')
  const [input, setInput] = useState('')
  const [history, setHistory] = useState([])

  const send = async (e) => {
    e.preventDefault()
    if (!input.trim()) return
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input.trim(), petName: petName || undefined }),
    })
    const data = await res.json()
    setHistory((h) => [...h, { role: 'user', message: input.trim() }, { role: 'assistant', message: data.reply }])
    setInput('')
  }

  return (
    <div className="card">
      <div className="title">Chatbot</div>
      <label htmlFor="chatPet">Pet (optional)</label>
      <input id="chatPet" placeholder="Rex" value={petName} onChange={(e) => setPetName(e.target.value)} />
      <div className="chat" style={{ marginTop: 10 }}>
        {history.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            {m.message}
          </div>
        ))}
      </div>
      <form onSubmit={send} style={{ marginTop: 10 }}>
        <input placeholder="Ask about today's activities..." value={input} onChange={(e) => setInput(e.target.value)} />
        <button style={{ marginTop: 8 }}>Send</button>
      </form>
    </div>
  )
}

function App() {
  const [petFilter, setPetFilter] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>🐾 Pet Activity Tracker</div>
      </div>
      <ActivityForm onSubmitSuccess={() => setReloadKey((k) => k + 1)} />
      <label htmlFor="filter" style={{ marginBottom: 6 }}>Filter by pet</label>
      <input id="filter" placeholder="Rex" value={petFilter} onChange={(e) => setPetFilter(e.target.value)} />
      <Summary key={reloadKey} filterPet={petFilter || undefined} />
      <Chatbot />
    </div>
  )
}

export default App
