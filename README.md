# Pet Activity Tracker

A full-stack web application for tracking pet activities including walks, meals, and medications with historical data viewing capabilities.

## Features

- **Activity Logging**: Record walks (duration), meals (count), and medications (count) for pets
- **Historical Summaries**: View activity summaries for any date with the `?date=YYYY-MM-DD` parameter
- **Pet Filtering**: Filter activities and summaries by specific pets
- **Walk Reminders**: Automatic prompts when pets haven't been walked by 6 PM
- **Interactive Chatbot**: Simple chatbot interface for activity queries
- **Responsive UI**: Modern, mobile-friendly interface

## Core Requirements Met

✅ **GET /summary endpoint with date parameter**: Supports `?date=YYYY-MM-DD` for historical data  
✅ **Historical summaries**: Users can view activity data for any past date  
✅ **Production readiness**: Environment variables, error handling, and logging  
✅ **API documentation**: Comprehensive endpoint documentation below  

## Project Structure

```
Pet Activity Tracker/
├── client/                 # React frontend (Vite)
│   ├── src/
│   │   ├── App.jsx        # Main application component
│   │   └── App.css        # Styles
│   ├── package.json       # Frontend dependencies
│   └── env.example        # Environment variables template
├── server/                # Express.js backend
│   ├── index.js           # Main server file
│   ├── package.json       # Backend dependencies
│   └── env.example        # Environment variables template
└── README.md              # This file
```

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Backend Setup
```bash
cd server
npm install
npm run dev
```

### Frontend Setup
```bash
cd client
npm install
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:4000

## Environment Configuration

### Backend (.env)
```bash
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env)
```bash
VITE_API_BASE=http://localhost:4000/api
```

## API Documentation

### Base URL
`http://localhost:4000/api`

### Endpoints

#### Health Check
```
GET /health
```
Returns server status.

#### Create Activity
```
POST /activities
Content-Type: application/json

{
  "petName": "Rex",
  "type": "walk|meal|medication",
  "amount": 30,
  "dateTime": "2024-01-15T10:30:00Z" // optional, defaults to now
}
```

#### List Activities
```
GET /activities?petName=Rex&today=true
```
- `petName` (optional): Filter by pet name
- `today` (optional): Filter to today's activities only

#### Get Summary
```
GET /summary?date=2024-01-15&petName=Rex
```
- `date` (optional): Date in YYYY-MM-DD format, defaults to today
- `petName` (optional): Filter by pet name

**Response:**
```json
{
  "date": "2024-01-15",
  "totalWalkMinutes": 45,
  "meals": 2,
  "meds": 1
}
```

#### Today's Summary (Legacy)
```
GET /summary/today?petName=Rex
```
Backward compatibility endpoint for today's summary.

#### Walk Reminder Check
```
GET /needs-walk?petName=Rex
```
Returns whether a pet needs a walk reminder (after 6 PM with no walks).

#### Chatbot
```
POST /chat
Content-Type: application/json

{
  "message": "How much did Rex walk today?",
  "petName": "Rex" // optional
}
```

## Development Workflow

### Git Best Practices
This project demonstrates proper version control:

1. **Incremental commits**: Each feature/change is committed separately
2. **Descriptive messages**: Clear commit messages explaining changes
3. **Feature branches**: Use branches for new features
4. **Pull requests**: Review code before merging

### Testing
```bash
# Backend tests
cd server && npm test

# Frontend linting
cd client && npm run lint
```

### Production Deployment

1. Set environment variables for production
2. Build the frontend: `cd client && npm run build`
3. Start the server: `cd server && npm start`

## Error Handling

The application includes comprehensive error handling:

- **Server-side**: Structured error responses with appropriate HTTP status codes
- **Client-side**: Try-catch blocks with user-friendly error messages
- **Validation**: Input validation for all API endpoints
- **Logging**: Request logging and error tracking

## Future Enhancements

- Database persistence (MongoDB/PostgreSQL)
- User authentication and multi-user support
- Activity analytics and trends
- Push notifications for reminders
- Mobile app version

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with proper commits
4. Add tests if applicable
5. Submit a pull request

## License

ISC License
