require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Environment configuration
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

const app = express();

// CORS configuration
app.use(cors({
	origin: CORS_ORIGIN,
	credentials: true
}));

app.use(express.json());

// Error handling middleware
app.use((err, req, res, next) => {
	console.error('Error:', err);
	res.status(500).json({ 
		error: NODE_ENV === 'production' ? 'Internal server error' : err.message 
	});
});

// Request logging middleware
app.use((req, res, next) => {
	console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
	next();
});

// In-memory data
const activities = [];

// Helpers
const isToday = (date) => {
	const d = new Date(date);
	const now = new Date();
	return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
};

// Routes
app.get('/api/health', (_req, res) => {
	res.json({ ok: true });
});

// Create activity
app.post('/api/activities', (req, res) => {
	const { petName, type, amount, dateTime } = req.body || {};
	if (!petName || !type || amount === undefined) {
		return res.status(400).json({ error: 'petName, type, and amount are required' });
	}
	if (!['walk', 'meal', 'medication'].includes(type)) {
		return res.status(400).json({ error: 'type must be walk | meal | medication' });
	}
	const entry = {
		id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
		petName: String(petName).trim(),
		type,
		amount: Number(amount),
		dateTime: dateTime ? new Date(dateTime).toISOString() : new Date().toISOString(),
	};
	activities.push(entry);
	res.status(201).json(entry);
});

// List activities (optional filters)
app.get('/api/activities', (req, res) => {
	const { petName, today } = req.query;
	let result = activities.slice();
	if (petName) {
		result = result.filter((a) => a.petName.toLowerCase() === String(petName).toLowerCase());
	}
	if (today === 'true') {
		result = result.filter((a) => isToday(a.dateTime));
	}
	res.json(result);
});

// Summary for a specific date (defaults to today)
app.get('/api/summary', (req, res) => {
	const { petName, date } = req.query;
	
	// Parse date parameter or default to today
	let targetDate;
	if (date) {
		targetDate = new Date(date);
		if (isNaN(targetDate.getTime())) {
			return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
		}
	} else {
		targetDate = new Date();
	}
	
	// Filter activities for the target date
	let items = activities.filter((a) => {
		const activityDate = new Date(a.dateTime);
		return activityDate.getFullYear() === targetDate.getFullYear() && 
			   activityDate.getMonth() === targetDate.getMonth() && 
			   activityDate.getDate() === targetDate.getDate();
	});
	
	if (petName) {
		items = items.filter((a) => a.petName.toLowerCase() === String(petName).toLowerCase());
	}
	
	const totalWalkMinutes = items.filter((a) => a.type === 'walk').reduce((sum, a) => sum + a.amount, 0);
	const meals = items.filter((a) => a.type === 'meal').length;
	const meds = items.filter((a) => a.type === 'medication').length;
	
	res.json({ 
		date: targetDate.toISOString().split('T')[0],
		totalWalkMinutes, 
		meals, 
		meds 
	});
});

// Today's summary (for backward compatibility)
app.get('/api/summary/today', (req, res) => {
	const { petName } = req.query;
	let items = activities.filter((a) => isToday(a.dateTime));
	if (petName) {
		items = items.filter((a) => a.petName.toLowerCase() === String(petName).toLowerCase());
	}
	const totalWalkMinutes = items.filter((a) => a.type === 'walk').reduce((sum, a) => sum + a.amount, 0);
	const meals = items.filter((a) => a.type === 'meal').length;
	const meds = items.filter((a) => a.type === 'medication').length;
	res.json({ totalWalkMinutes, meals, meds });
});



// No-walk prompt check by 18:00 local time
app.get('/api/needs-walk', (req, res) => {
	const { petName } = req.query;
	const now = new Date();
	const cutoff = new Date(now);
	cutoff.setHours(18, 0, 0, 0);

	const todayItems = activities.filter((a) => isToday(a.dateTime) && (!petName || a.petName.toLowerCase() === String(petName).toLowerCase()));
	const walkMinutes = todayItems.filter((a) => a.type === 'walk').reduce((s, a) => s + a.amount, 0);
	const shouldPrompt = now >= cutoff && walkMinutes === 0;
	res.json({ shouldPrompt, walkMinutes });
});

app.listen(PORT, () => {
	console.log(`Server listening on http://localhost:${PORT}`);
	console.log(`Environment: ${NODE_ENV}`);
	console.log(`CORS Origin: ${CORS_ORIGIN}`);
});


