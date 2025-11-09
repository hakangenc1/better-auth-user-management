# User Management Application

A modern user management application built with React Router v7, Better Auth, and shadcn/ui components. This application provides administrators with a secure dashboard to manage user accounts through CRUD operations.

## Features

- 🔐 Secure authentication with Better Auth
- 👥 User management dashboard (Create, Read, Update, Delete)
- 🎨 Beautiful UI with shadcn/ui components
- 🚀 Server-side rendering with React Router v7
- ⚡️ Hot Module Replacement (HMR)
- 🔒 TypeScript by default
- 🎉 TailwindCSS for styling
- 💾 SQLite database for data persistence
- 🛡️ Rate limiting and security features
- 🔑 Password hashing with bcrypt
- 🚦 Account lockout protection
- 📊 Security event logging

## Tech Stack

- **Frontend**: React 19, React Router v7
- **Authentication**: Better Auth with admin plugin
- **UI Components**: shadcn/ui (Radix UI + Tailwind CSS)
- **Database**: SQLite with better-sqlite3
- **Styling**: Tailwind CSS
- **Form Handling**: React Hook Form + Zod validation

## Getting Started from Scratch

Follow these steps to set up the project locally on a new machine:

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd better-auth-user-management
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including React Router, Better Auth, shadcn/ui components, and database dependencies.

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
# Copy the example environment file
cp .env.example .env
```

Or manually create `.env` with the following content:

```env
# Better Auth Configuration
BETTER_AUTH_SECRET=your-secret-key-here-change-in-production
BETTER_AUTH_URL=http://localhost:5173

# Database Configuration
DATABASE_URL=./data/auth.db

# API Configuration
VITE_API_URL=http://localhost:5173
```

**Important**: Change `BETTER_AUTH_SECRET` to a secure random string in production.

### 4. Initialize the Database (Optional)

You have two options to set up your admin account:

#### Option A: First-Time Setup UI (Recommended)

Simply start the development server and the application will guide you through creating your first admin account:

```bash
npm run db:init    # Initialize database schema
npm run dev        # Start the server
```

When you visit `http://localhost:5173`, you'll be automatically redirected to a setup page where you can create your first admin account through a user-friendly interface.

#### Option B: Command-Line Setup

Run the database setup script to create the SQLite database and seed it with example users:

```bash
npm run db:seed
```

This command will:
1. Create the `data` directory if it doesn't exist
2. Initialize the SQLite database at `./data/auth.db`
3. Create all required tables (user, session, account, verification)
4. Create two example users:
   - Admin user: `admin@example.com` / `admin123`
   - Regular user: `user@example.com` / `user12345`
5. Set the admin role for the admin user

**Alternative**: Run steps individually:

```bash
npm run db:init    # Initialize database schema only
npm run seed       # Create example users only
```

### 5. Start the Development Server

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

### 6. Access the Application

Open your browser and navigate to `http://localhost:5173`.

**First-Time Setup**: If no users exist in the database, you'll be redirected to `/setup` where you can create your first admin account.

**Existing Installation**: If users already exist, you'll see the login page. Use your credentials to sign in.

**Example credentials** (if you used Option B - Command-Line Setup):
- Admin: `admin@example.com` / `admin123`
- User: `user@example.com` / `user12345`

## Project Structure

```
├── app/
│   ├── components/          # React components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── auth/           # Authentication components
│   │   └── users/          # User management components
│   ├── contexts/           # React Context providers
│   ├── lib/                # Utility functions and configurations
│   │   ├── auth.server.ts  # Better Auth server configuration
│   │   ├── auth.client.ts  # Better Auth client configuration
│   │   └── utils.ts        # Helper functions
│   └── routes/             # React Router v7 routes
├── data/                   # SQLite database (created on setup)
├── scripts/                # Database setup scripts
│   ├── init-db.ts         # Database schema initialization
│   ├── seed.ts            # Seed example users
│   └── update-admin-role.ts # Update user roles
├── .env                    # Environment variables (create this)
├── .env.example           # Environment variables template
└── package.json           # Project dependencies and scripts

```

## Available Scripts

- `npm run dev` - Start development server with HMR
- `npm run build` - Create production build
- `npm run start` - Start production server
- `npm run typecheck` - Run TypeScript type checking
- `npm run db:init` - Initialize database schema
- `npm run db:seed` - Full database setup (init + seed + admin role)
- `npm run db:reset` - Delete all users and reset to first-time setup
- `npm run seed` - Seed example users only

## Troubleshooting

### Reset to First-Time Setup

If you want to start fresh and go through the first-time setup again:

```bash
npm run db:reset
```

This will delete all users from the database. When you restart the dev server and visit the app, you'll be redirected to the setup page to create a new first admin user.

### Database Issues

If you encounter database errors:

1. Reset all users:
   ```bash
   npm run db:reset
   ```

2. Or delete the entire database and reinitialize:
   ```bash
   rm -rf data/
   npm run db:init
   ```

### Port Already in Use

If port 5173 is already in use, React Router will automatically try the next available port (5174, 5175, etc.). Check the terminal output to see which port is being used.

### Module Not Found Errors in IDE

If you see TypeScript errors like "Cannot find module '~/components/ui/alert'":
1. The dev server should still work fine - these are IDE cache issues
2. Try restarting your TypeScript server in your IDE
3. The application will run correctly despite these warnings

### Authentication Errors

Make sure:
- The `.env` file exists with correct values
- The database has been initialized with `npm run db:seed`
- The admin user has the correct role set

## Development Workflow

1. Make code changes in the `app/` directory
2. The dev server will automatically reload with HMR
3. Test your changes at `http://localhost:5173`
4. Run type checking with `npm run typecheck`
5. Build for production with `npm run build`

## Testing First-Time Setup

To test the first-time setup flow:

1. **Reset the database**:
   ```bash
   npm run db:reset
   ```

2. **Start the dev server** (if not already running):
   ```bash
   npm run dev
   ```

3. **Visit the application** in your browser - you'll be automatically redirected to `/setup`

4. **Create your first admin user** through the setup form

5. **Login** with your new credentials

This is useful for:
- Testing the onboarding experience
- Demonstrating the app to others
- Starting fresh during development

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### Docker Deployment

To build and run using Docker:

```bash
docker build -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

---

Built with ❤️ using React Router.
