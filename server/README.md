# Pet Activity Tracker (Server)

Express server with in-memory arrays for activities.

## Run

```bash
npm install
npm run dev
```

API base: `http://localhost:4000/api`

Endpoints:
- POST `/api/activities`
- GET `/api/activities?petName=&today=true`
- GET `/api/summary/today?petName=`
- GET `/api/needs-walk?petName=`
