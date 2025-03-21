# {{YOUR_PROJECT_NAME}}

A modern web application template built with Next.js, Firebase, and PostgreSQL.

## Features

- Next.js 13+ App Router
- Firebase Authentication
- PostgreSQL Database
- Redis Caching
- Comprehensive Testing Setup
- TypeScript
- TailwindCSS
- Material Design Components
- Progressive Web App Support

## Technology Stack

- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: Node.js/TypeScript
- **Auth**: Firebase Authentication
- **Data**: PostgreSQL, Redis (caching)
- **Deployment**: fly.io

## Installation

```bash
# Clone this repository
git clone https://github.com/yourusername/{{YOUR_PROJECT_NAME}}.git

# Navigate to the project directory
cd {{YOUR_PROJECT_NAME}}

# Install dependencies
npm install

# Set up environment variables (create a .env file based on .env.example)

# Run the development server
npm run dev
```

## Configuration

1. Create a Firebase project and enable Authentication
2. Set up a PostgreSQL database
3. Configure Redis (optional)
4. Update environment variables in your .env file

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Project Structure

```
{{YOUR_PROJECT_NAME}}/
├── app/                    # Next.js 13+ App Router
│   ├── api/                # API routes
│   │   ├── auth/           # Authentication endpoints
│   │   │   └── session/    # Session management endpoints
│   │   └── health/         # Health check endpoint
│   ├── globals.css         # Global styles with Tailwind imports
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── components/             # Reusable components
│   ├── auth/               # Authentication components
│   │   ├── SignInButton.tsx # Sign-in/sign-out button
│   │   └── UserProfile.tsx  # User profile display
│   ├── ui/                 # Base UI components
├── lib/                    # Utility functions and configurations
│   ├── firebase.ts         # Firebase Web SDK configuration
│   ├── firebase-admin.ts   # Firebase Admin SDK configuration
│   └── session.ts          # Session management utilities
├── middleware.ts           # Authentication middleware
├── tests/                  # Centralized test directory
│   ├── unit/               # Unit tests
│   │   ├── components/     # Component tests
│   │   └── api/            # API tests
│   ├── integration/        # Integration tests
│   ├── e2e/                # E2E tests with Playwright
│   ├── firebase/           # Firebase tests
│   │   ├── security-rules.test.ts # Firestore security rules tests
│   │   └── task-rules.test.ts # Task collection rules tests
│   ├── mocks/              # Test mocks
│   ├── utils/              # Test utilities
│   └── config/             # Test configuration
│       ├── jest.config.js  # Jest configuration
│       └── setup/          # Test setup files
├── docs/                   # Project documentation
│   └── testing/            # Testing documentation
├── firebase.json           # Firebase configuration
├── firestore.rules         # Firestore security rules
├── firestore.indexes.json  # Firestore indexes configuration
├── jest.config.js          # Jest configuration wrapper
└── next.config.js          # Next.js configuration
```

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Create a `.env.local` file with the required environment variables (see below)
4. Run the development server with `npm run dev`

## Environment Variables

Required in `.env.local`:

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin SDK
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Database
DATABASE_URL=

# Redis (optional)
REDIS_URL=
```

## Available Commands

```bash
# Development
npm run dev       # Start development server
npm run build     # Build for production
npm run start     # Start production server

# Testing
npm test          # Run Jest tests
npm test -- --watch   # Run tests in watch mode
npm test -- --coverage # Run tests with coverage

# Linting & Formatting
npm run lint      # Check ESLint issues
npm run lint:fix  # Fix ESLint issues
npm run format    # Format with Prettier

# Firebase
npm run firebase:emulators         # Start Firebase emulators
npm run firebase:emulators:export  # Export emulator data to ./firebase-emulator-data
npm run firebase:emulators:import  # Import data from ./firebase-emulator-data
npm run firebase:deploy:rules      # Deploy Firestore security rules

# Firebase Testing
npm run test:rules                 # Run security rules tests
npm run test:rules:with-emulator   # Run security rules tests with emulator
npm run test:task-rules            # Run task collection rules tests
npm run test:task-rules:with-emulator # Run task rules tests with emulator
npm run test:all-rules             # Run all Firebase rules tests
npm run test:all-rules:with-emulator # Run all Firebase rules tests with emulator
```

## Authentication

This project uses Firebase Authentication. The authentication flow is handled by the `SignInButton` component, which:

1. Initiates authentication using Firebase
2. Creates a session using the `/api/auth/session` endpoint
3. Redirects to the dashboard on successful sign-in

## Firebase Security Rules

This project uses Firebase Firestore for real-time database capabilities alongside the primary PostgreSQL database. The Firestore security rules are defined in `firestore.rules` and follow secure patterns:

### User Collection Rules
- Authenticated users can read any user profile
- Users can create and update their own profiles
- Admin users can update or delete any user profile
- Regular users cannot delete profiles

### Public Collection Rules
- Anyone can read public documents
- Only admin users can write to public documents

### Tasks Collection Rules  
- Users can read, update, and delete only their own tasks
- Admin users can read, update, and delete any task
- Users can only create tasks for themselves

### Firebase Security Rules Testing

The project includes comprehensive tests for Firebase security rules:

1. **User Collection Rules Tests**: Validates permissions for user profiles
2. **Public Collection Rules Tests**: Ensures public data is readable but write-protected
3. **Task Collection Rules Tests**: Verifies task ownership and access control
4. **Default Deny Tests**: Confirms default-deny policy works for undefined collections

To run the tests with Firebase emulators:

```bash
# Start Firebase emulators and run all security rules tests
npm run test:all-rules:with-emulator

# Run specific test suites with emulator
npm run test:rules:with-emulator    # Only user/public collection rules
npm run test:task-rules:with-emulator # Only task collection rules
```

## Testing
The project includes comprehensive testing with Jest for unit tests and Playwright for end-to-end tests.

For detailed testing information, see [the testing guide](docs/testing/main.md) and the implementation documentation:
- [Main testing documentation](tests/README-main.md)
- [E2E testing documentation](tests/e2e/README-e2e.md)

## Tech Stack Details

- **Framework**: Next.js 13+ with App Router
- **Authentication**: Firebase Auth
- **Database**: PostgreSQL 
- **Real-time Database**: Firebase Firestore
- **Caching**: Redis (optional)
- **UI**: React with Tailwind CSS
- **Testing**: Jest with React Testing Library
- **Type Checking**: TypeScript
- **Linting**: ESLint
- **Formatting**: Prettier