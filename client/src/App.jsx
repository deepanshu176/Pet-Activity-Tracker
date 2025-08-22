import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api'

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
    
    try {
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
        const err = await res.json().catch(() => ({ error: 'Network error' }))
        alert(err.error || 'Failed to log activity')
        return
      }
      setValues((v) => ({ ...v, amount: '' }))
      onSubmitSuccess?.()
    } catch (error) {
      console.error('Error submitting activity:', error)
      alert('Failed to log activity. Please try again.')
    }
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
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  const load = async () => {
    try {
      const params = new URLSearchParams()
      if (filterPet) params.append('petName', filterPet)
      if (selectedDate) params.append('date', selectedDate)
      
      const qs = params.toString() ? `?${params.toString()}` : ''
      const res = await fetch(`${API_BASE}/summary${qs}`)
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      const data = await res.json()
      setSummary(data)
      
      // Only check needs-walk for today
      if (selectedDate === new Date().toISOString().split('T')[0]) {
        const res2 = await fetch(`${API_BASE}/needs-walk${filterPet ? `?petName=${encodeURIComponent(filterPet)}` : ''}`)
        if (res2.ok) {
          const data2 = await res2.json()
          setNeedsWalk(Boolean(data2.shouldPrompt))
        }
      } else {
        setNeedsWalk(false)
      }
    } catch (error) {
      console.error('Error loading summary:', error)
      setSummary({ totalWalkMinutes: 0, meals: 0, meds: 0 })
    }
  }

  useEffect(() => { load() }, [filterPet, selectedDate])

  const walkProgress = useMemo(() => {
    const goal = 30
    const pct = Math.min(100, Math.round((summary.totalWalkMinutes / goal) * 100))
    return pct
  }, [summary.totalWalkMinutes])

  return (
    <div className="card">
      <div className="title">
        Summary{filterPet ? ` · ${filterPet}` : ''}
        <div style={{ fontSize: 14, fontWeight: 400, marginTop: 4 }}>
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ fontSize: 12, padding: 4 }}
          />
        </div>
      </div>
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
    </div>
  )
}

export default App
