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
      <div className="title">📝 Log Activity</div>
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="petName">Pet Name</label>
          <input name="petName" id="petName" placeholder="Enter your pet's name..." value={values.petName} onChange={onChange} />
          {errors.petName && <div className="error">{errors.petName}</div>}
        </div>

        <div className="row">
          <div className="form-group">
            <label htmlFor="type">Activity Type</label>
            <select name="type" id="type" value={values.type} onChange={onChange}>
              <option value="walk">🚶 Walk (minutes)</option>
              <option value="meal">🍽️ Meal (count)</option>
              <option value="medication">💊 Medication (count)</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="amount">Duration/Quantity</label>
            <input name="amount" id="amount" type="number" inputMode="numeric" min="1" placeholder="30" value={values.amount} onChange={onChange} />
            {errors.amount && <div className="error">{errors.amount}</div>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="dateTime">Date & Time</label>
          <input name="dateTime" id="dateTime" type="datetime-local" value={values.dateTime} onChange={onChange} />
        </div>

        <button type="submit">✨ Save Activity</button>
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
        📊 Activity Summary{filterPet ? ` · ${filterPet}` : ''}
        <div className="date-picker">
          <label htmlFor="summaryDate">📅 Select Date:</label>
          <input 
            id="summaryDate"
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>
      
      <div className="summary-stats">
        <div className="stat-item">
          <div className="stat-icon">🚶</div>
          <div className="stat-value">{summary.totalWalkMinutes}</div>
          <div className="stat-label">Walk Minutes</div>
        </div>
        <div className="stat-item">
          <div className="stat-icon">🍽️</div>
          <div className="stat-value">{summary.meals}</div>
          <div className="stat-label">Meals</div>
        </div>
        <div className="stat-item">
          <div className="stat-icon">💊</div>
          <div className="stat-value">{summary.meds}</div>
          <div className="stat-label">Medications</div>
        </div>
      </div>

      <div className="progress-container">
        <div className="progress-label">
          <span>Daily Walk Goal Progress</span>
          <span>{walkProgress}%</span>
        </div>
        <div className="bar" style={{ '--progress': `${walkProgress}%` }}>
          <span></span>
        </div>
      </div>

      {needsWalk && (
        <div className="error">
          ⚠️ {filterPet ? `${filterPet} still needs exercise today!` : 'Your pet still needs exercise today!'}
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
      <div className="app-header">
        <h1 className="app-title">Pet Activity Tracker</h1>
      </div>
      
      <ActivityForm onSubmitSuccess={() => setReloadKey((k) => k + 1)} />
      
      <div className="filter-container">
        <div className="form-group">
          <label htmlFor="filter">🔍 Filter by Pet</label>
          <input 
            id="filter" 
            placeholder="Enter pet name to filter activities..." 
            value={petFilter} 
            onChange={(e) => setPetFilter(e.target.value)} 
          />
        </div>
      </div>
      
      <Summary key={reloadKey} filterPet={petFilter || undefined} />
    </div>
  )
}

export default App
