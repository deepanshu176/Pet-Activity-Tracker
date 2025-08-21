const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// In-memory data
const activities = [];
const chatHistory = [];

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

// Today's summary
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

// Simple chatbot with contextual memory (naive echo with context summary)
app.post('/api/chat', (req, res) => {
	const { message, petName } = req.body || {};
	if (!message) return res.status(400).json({ error: 'message is required' });
	const userTurn = { role: 'user', message, timestamp: new Date().toISOString(), petName: petName || null };
	chatHistory.push(userTurn);

	// Build a lightweight context summary of today's stats for the pet
	let context = '';
	if (petName) {
		const todayItems = activities.filter((a) => isToday(a.dateTime) && a.petName.toLowerCase() === petName.toLowerCase());
		const totalWalkMinutes = todayItems.filter((a) => a.type === 'walk').reduce((s, a) => s + a.amount, 0);
		const meals = todayItems.filter((a) => a.type === 'meal').length;
		const meds = todayItems.filter((a) => a.type === 'medication').length;
		context = `Today for ${petName}: walk ${totalWalkMinutes} min, meals ${meals}, meds ${meds}.`;
	}

	const responseText = context
		? `${context} You said: "${message}"`
		: `You said: "${message}"`;
	const assistantTurn = { role: 'assistant', message: responseText, timestamp: new Date().toISOString(), petName: petName || null };
	chatHistory.push(assistantTurn);
	res.json({ reply: responseText, history: chatHistory.slice(-10) });
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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
	console.log(`Server listening on http://localhost:${PORT}`);
});


