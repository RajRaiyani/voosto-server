# Voosto Server

A modern Node.js backend server built with Express, TypeScript, and PostgreSQL. This server provides RESTful APIs with JWT authentication, real-time communication via Socket.io, file uploads, and email services.

## 📋 Prerequisites

- Node.js 22+ (or 24+ for production)
- PostgreSQL 18+
- npm
- Dbmate (for database migrations)

## 🛠️ Manual Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd voosto-server
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # make sure to change the values in the .env file to your own
   ```

4. **Run migrations**

   ```bash
   npx dbmate up
   ```

5. **Start the server**

   ```bash
   npm run dev
   # or
   npm run dev:watch
   ```

## 🐳 Docker Deployment

### Using Docker Compose

1. **Start With Docker Compose**

   ```bash
   # start with docker compose
   docker-compose up -d

   # or

   # start with command line
   docker run -p 3007:3007 --env-file .env voosto-server
   # in this case you need to set up the database manually
   ```

## 🔌 API Endpoints

### Health Check

- `GET /` - Server status and information
- `GET /ping` - Simple health check

### User Management

- `POST /users/register` - Register a new user
- `POST /users/verify-registration` - Verify user registration (OTP)
- `POST /users/login` - User login

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 📊 Database

### Migrations

The project uses [dbmate](https://github.com/amacneil/dbmate) for database migrations.

- **Run migrations**: `dbmate up`
- **Rollback last migration**: `dbmate down`
- **Create new migration**: `dbmate new migration_name`
- **View migration status**: `dbmate status`

### Connection

The database connection is managed through a connection pool. Use the `withDatabase` utility wrapper for database operations in controllers.

## 📝 Logging

Logging is handled by Winston with configurable levels:

- **Console Log Level**: Set via `CONSOLE_LOG_LEVEL` (default: `debug`)
- **File Log Level**: Set via `FILE_LOG_LEVEL` (default: `error`)

Log levels (in order of precedence):

- `block` (-1) - Disable logs
- `error` (0)
- `warn` (1)
- `info` (2)
- `http` (3)
- `verbose` (4)
- `debug` (5)
- `silly` (6)

## 🔒 Security

- JWT tokens for authentication
- Password hashing with bcryptjs
- Input validation with Zod
- SQL injection prevention via parameterized queries
- CORS configuration
- Environment variable validation

## 📦 Dependencies

### Core

- `express` - Web framework
- `pg` - PostgreSQL client
- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing
- `zod` - Schema validation

### Utilities

- `socket.io` - WebSocket support
- `multer` - File uploads
- `nodemailer` - Email service
- `winston` - Logging
- `morgan` - HTTP request logger

## 📄 License

ISC

## 👤 Author

**R.P. Raiyani**

- Website: [rajraiyani.com](https://rajraiyani.com)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Note**: Make sure to keep your `.env` file secure and never commit it to version control. The `.env.example` file serves as a template for required environment variables.
