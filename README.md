# NEU Library Visitor Management System

A full-stack web application for managing NEU Library visitor statistics with secure Google OAuth authentication, role-based access control, and an admin dashboard for analytics.

## Features

- **Secure Google OAuth Login**: Only authorized NEU staff can access the system
- **Role-Based Access Control**: Users can switch between user and admin roles
- **User Dashboard**: Welcome page for regular users
- **Admin Dashboard**: Comprehensive visitor statistics with filtering capabilities
- **Statistics Tracking**: Daily, weekly, and custom date range visitor counts
- **Advanced Filtering**: Filter by reason for visit, college, and employee type
- **JWT Authentication**: Secure token-based authentication with HTTP-only cookies
- **Real-time Data**: Live visitor logs with detailed information

## Technology Stack

**Frontend:**
- React 19 with TypeScript
- Tailwind CSS 4 for styling
- Wouter for routing
- tRPC for type-safe API calls
- Shadcn/ui components

**Backend:**
- Node.js with Express
- tRPC for RPC framework
- MySQL/TiDB database
- Drizzle ORM for database management
- JWT for authentication
- Google OAuth 2.0 integration

**Testing:**
- Vitest for unit tests
- Comprehensive test coverage for auth and stats endpoints

## Project Structure

```
neu-library-app/
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   │   ├── Home.tsx
│   │   │   ├── UserDashboard.tsx
│   │   │   └── AdminDashboard.tsx
│   │   ├── components/    # Reusable UI components
│   │   ├── lib/          # tRPC client setup
│   │   └── App.tsx       # Main app with routing
│   └── public/           # Static assets
├── server/               # Express backend
│   ├── routers.ts       # tRPC procedure definitions
│   ├── db.ts            # Database queries
│   ├── _core/           # Core infrastructure
│   │   ├── context.ts   # tRPC context
│   │   ├── oauth.ts     # OAuth integration
│   │   └── index.ts     # Server entry point
│   └── *.test.ts        # Test files
├── drizzle/             # Database schema and migrations
│   ├── schema.ts        # Table definitions
│   └── *.sql            # Migration files
├── seed-db.mjs          # Database seeding script
└── package.json         # Dependencies
```

## Database Schema

### Users Table
- `id`: Primary key
- `openId`: Manus OAuth identifier (unique)
- `googleId`: Google OAuth identifier (unique)
- `email`: User email (unique, required)
- `name`: User full name
- `role`: User roles (user, admin)
- `currentRole`: Currently active role
- `loginMethod`: Authentication method
- `createdAt`, `updatedAt`, `lastSignedIn`: Timestamps

### VisitorLogs Table
- `id`: Primary key
- `date`: Visit date and time
- `reason`: Reason for visit (Study, Research, etc.)
- `college`: College/department
- `employeeType`: Type (teacher, staff, non-employee)
- `createdAt`: Log creation timestamp

## Setup Instructions

### Prerequisites

- Node.js 22.13.0 or higher
- pnpm package manager
- MySQL/TiDB database
- Google OAuth credentials

### Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# Database
DATABASE_URL=mysql://user:password@host:port/database

# JWT
JWT_SECRET=your-jwt-secret-key

# OAuth (Manus)
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im

# Owner Info
OWNER_OPEN_ID=your-open-id
OWNER_NAME=Your Name

# Analytics (optional)
VITE_ANALYTICS_ENDPOINT=your-analytics-endpoint
VITE_ANALYTICS_WEBSITE_ID=your-website-id

# App Configuration
VITE_APP_TITLE=NEU Library
VITE_APP_LOGO=https://your-logo-url.png

# Forge API (Manus built-in services)
BUILT_IN_FORGE_API_URL=https://forge.manus.im
BUILT_IN_FORGE_API_KEY=your-forge-api-key
VITE_FRONTEND_FORGE_API_URL=https://forge.manus.im
VITE_FRONTEND_FORGE_API_KEY=your-frontend-forge-api-key
```

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/henrylaurente/neu-library-app.git
   cd neu-library-app
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up database**
   ```bash
   # Generate and apply migrations
   pnpm drizzle-kit generate
   pnpm drizzle-kit migrate
   ```

4. **Seed sample data (optional)**
   ```bash
   node seed-db.mjs
   ```

5. **Start development server**
   ```bash
   pnpm dev
   ```

   The application will be available at `http://localhost:3000`

## API Endpoints

All endpoints are protected with JWT authentication via HTTP-only cookies.

### Authentication

- **POST `/api/trpc/auth.me`**: Get current user info
- **POST `/api/trpc/auth.logout`**: Logout user
- **POST `/api/trpc/auth.switchRole`**: Switch between user and admin roles
  - Input: `{ role: "user" | "admin" }`

### Statistics (Admin Only)

- **POST `/api/trpc/stats.get`**: Get filtered visitor statistics
  - Input: `{ startDate?, endDate?, reason?, college?, employeeType? }`
  - Returns: `{ logs, dailyCount, weeklyCount, totalCount }`

- **POST `/api/trpc/stats.daily`**: Get daily visitor count
  - Input: `{ date }`

- **POST `/api/trpc/stats.weekly`**: Get weekly visitor count
  - Input: `{ date }`

### Visitor Logs

- **POST `/api/trpc/visitors.log`**: Create visitor log entry
  - Input: `{ date, reason, college, employeeType }`

## Security Features

- **Email Restriction**: Only staff can access the system
- **JWT Tokens**: Secure token-based authentication
- **HTTP-Only Cookies**: Tokens stored securely, not accessible via JavaScript
- **Role-Based Access Control**: Admin-only endpoints protected with role checks
- **Input Validation**: All inputs validated with Zod schemas
- **CORS Protection**: Proper CORS configuration for security

## Testing

Run the test suite:

```bash
pnpm test
```

Tests include:
- Authentication and role switching
- Statistics endpoints with various filters
- Admin access control
- Input validation

## Building for Production

```bash
pnpm build
pnpm start
```

The application will be built and optimized for production deployment.

## Deployment

The application is configured to deploy on Manus hosting platform. To deploy:

1. Create a checkpoint via the Manus UI
2. Click the "Publish" button in the Management UI
3. The application will be deployed to your Manus project URL

## Email Restriction

The application enforces strict email validation. Only the following email can access the system:


Any login attempt with a different email will be rejected.

## Role Switching

Users with admin privileges can seamlessly switch between user and admin roles without re-authentication:

1. Click "Switch to Admin" button on the user dashboard
2. Admin dashboard will load with statistics and filters
3. Click "Switch to User" to return to the user dashboard

## Visitor Statistics

The admin dashboard provides comprehensive visitor analytics:

- **Daily Stats**: Number of visitors today
- **Weekly Stats**: Number of visitors this week
- **Custom Date Range**: Filter by specific date range
- **Advanced Filters**:
  - Reason for visit (Study, Research, Borrowing Books, etc.)
  - College/Department
  - Employee type (Teacher, Staff, Non-employee)

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Ensure database server is running
- Check network connectivity

### OAuth Login Not Working
- Verify Google OAuth credentials are configured
- Check that redirect URLs are correctly set in Google Console
- Ensure email restriction is properly enforced

### Statistics Not Showing
- Verify user has admin role
- Check that visitor logs exist in the database
- Run `node seed-db.mjs` to populate sample data

## Contributing

This is a closed project for NEU Library. For issues or feature requests, please contact the development team.

## Live Application

The application is deployed and available at:
- **Production**: https://neulibapp-2hvv8ns4.manus.space
- **GitHub Repository**: https://github.com/henrylaurente/neu-library-app


