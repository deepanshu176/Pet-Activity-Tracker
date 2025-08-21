# Pet Activity Tracker (Server)

Express server with in-memory arrays for activities and chat history.

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
- POST `/api/chat`
- GET `/api/needs-walk?petName=`
