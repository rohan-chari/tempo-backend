# Tempo Backend

A modular Node.js backend with Express, built with industry best practices and proper separation of concerns.

## 🚀 Features

- **Modular Architecture**: Clean separation of concerns with organized folder structure
- **Security First**: Helmet, CORS, and other security middleware
- **Error Handling**: Centralized error handling with proper logging
- **API Standards**: Consistent response format and status codes
- **Testing**: Jest setup with test examples
- **Code Quality**: ESLint configuration for consistent code style
- **Environment Configuration**: Flexible environment variable management
- **Health Checks**: Built-in health monitoring endpoints
- **Graceful Shutdown**: Proper process termination handling

## 📁 Project Structure

```
src/
├── config/           # Configuration management
├── controllers/      # Business logic controllers
├── middleware/       # Custom middleware
├── routes/          # Route definitions
├── utils/           # Utility functions
├── __tests__/       # Test files
├── app.js           # Express app setup
└── server.js        # Server entry point
```

## 🛠️ Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd tempo-backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env
# Edit .env with your configuration
```

4. Set up the database:
```bash
# Create your MySQL database
mysql -u root -p -e "CREATE DATABASE tempo_db;"

# Run migrations to create tables
npm run migrate
```

5. Start the development server:
```bash
npm run dev
```

## 🚀 Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests
- `npm run lint` - Check code style
- `npm run lint:fix` - Fix code style issues

## 📡 API Endpoints

### Health Check
- `GET /api/v1/health` - Basic health status
- `GET /api/v1/health/detailed` - Detailed health information

### Authentication
- `POST /api/v1/auth/signin` - Sign in with Firebase token
- `GET /api/v1/auth/profile` - Get current user profile (requires auth)
- `PUT /api/v1/auth/profile` - Update user profile (requires auth)

### Root
- `GET /` - API welcome message

## 🔧 Configuration

The application uses environment variables for configuration. See `env.example` for available options:

### Server Configuration
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3000)
- `API_PREFIX` - API route prefix (default: /api/v1)

### Firebase Configuration
- `FIREBASE_PROJECT_ID` - Your Firebase project ID
- `FIREBASE_PRIVATE_KEY` - Firebase private key (with newlines)
- `FIREBASE_CLIENT_EMAIL` - Firebase client email
- `FIREBASE_CLIENT_ID` - Firebase client ID
- `FIREBASE_AUTH_URI` - Firebase auth URI
- `FIREBASE_TOKEN_URI` - Firebase token URI
- `FIREBASE_AUTH_PROVIDER_X509_CERT_URL` - Firebase cert URL
- `FIREBASE_CLIENT_X509_CERT_URL` - Firebase client cert URL

### Database Configuration
- `DB_HOST` - MySQL host (default: localhost)
- `DB_PORT` - MySQL port (default: 3306)
- `DB_NAME` - Database name (default: tempo_db)
- `DB_USER` - Database user (default: root)
- `DB_PASSWORD` - Database password

## 🧪 Testing

Run tests with:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## 📝 Code Style

This project uses ESLint for code quality. Run linting with:
```bash
npm run lint
```

## 🏗️ Architecture

### Separation of Concerns

- **Controllers**: Handle HTTP requests and responses
- **Services**: Business logic (to be implemented)
- **Models**: Data models (to be implemented)
- **Routes**: URL routing and middleware
- **Middleware**: Request processing and validation
- **Utils**: Reusable utility functions
- **Config**: Environment and application configuration

### Error Handling

- Centralized error handling middleware
- Consistent error response format
- Proper logging of errors
- Graceful error recovery

### Security

- Helmet for security headers
- CORS configuration
- Request validation
- Rate limiting (ready for implementation)

## 🔮 Future Enhancements

- Database integration (MongoDB/PostgreSQL)
- Authentication & Authorization
- File upload handling
- Email service integration
- Redis caching
- API documentation (Swagger)
- Docker containerization
- CI/CD pipeline

## 📄 License

MIT License - see LICENSE file for details 