# TaxBot Vietnam - Replit.md

## Overview

TaxBot Vietnam is a comprehensive AI-powered tax calculation and advisory platform designed specifically for Vietnamese businesses and individuals. The application provides automated tax calculations, compliance checking, and professional tax advisory services through AI integration, all while maintaining strict adherence to Vietnamese tax law requirements.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with custom configuration
- **Styling**: Tailwind CSS with custom Vietnamese flag theme colors
- **Component Library**: Radix UI primitives with custom shadcn/ui components
- **State Management**: React Query (TanStack Query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Internationalization**: Custom i18n implementation supporting Vietnamese and English

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: JWT-based authentication for both admin and customer accounts
- **API Design**: RESTful API with TypeScript interfaces
- **Email Service**: Nodemailer with Gmail SMTP integration
- **AI Integration**: OpenAI API for tax advisory services

## Key Components

### Database Layer
- **Primary Database**: PostgreSQL via Neon serverless
- **Schema Management**: Drizzle ORM with migrations in `./migrations`
- **Backup Storage**: JSON-based storage system for data redundancy
- **Tables**: Users, service packages, tax calculations, contact inquiries, customer registrations, documents

### Authentication & Security
- **Multi-tier Authentication**: Separate admin and customer authentication systems
- **Password Security**: bcrypt hashing for password storage
- **Rate Limiting**: Comprehensive rate limiting with IP-based blocking
- **Anti-spam Protection**: Pattern-based spam detection and prevention
- **Security Headers**: CSP, CORS, and other security middleware

### AI Tax Advisory System
- **OpenAI Integration**: GPT-based tax advisory with Vietnamese tax law context
- **Tax Calculations**: Automated calculations for personal income tax, corporate tax, and VAT
- **Compliance Checking**: Real-time validation against Vietnamese tax regulations
- **Legal Reference**: Built-in Vietnamese tax law database (2025 updates)

### Email & Communication
- **Email Service**: Gmail SMTP with fallback simulation mode
- **Password Reset**: Secure token-based password reset for both admin and customers
- **Notifications**: Customer confirmation and admin notification emails
- **Zapier Integration**: Automated data forwarding to Google Sheets

### Progressive Web App (PWA)
- **Service Worker**: Comprehensive offline support with caching strategies
- **Manifest**: Full PWA manifest for mobile app installation
- **Offline Functionality**: Offline page and connection monitoring
- **Mobile Optimization**: Responsive design with foldable device support

## Data Flow

### Customer Registration Flow
1. Customer fills registration form with validation
2. Vietnamese phone number validation
3. Data stored in PostgreSQL database
4. Backup stored in JSON storage
5. Zapier webhook triggered for Google Sheets integration
6. Confirmation email sent to customer
7. Admin notification email sent

### Tax Calculation Flow
1. User inputs tax data through calculator interface
2. Client-side validation and calculation
3. AI analysis request to OpenAI API
4. Vietnamese tax law compliance checking
5. Results stored in database
6. Formatted response with tax advice and tips

### Authentication Flow
1. User submits credentials
2. Server validates against database
3. JWT token generated and returned
4. Token stored in localStorage
5. Subsequent requests include Authorization header
6. Server validates token on protected routes

## External Dependencies

### Third-party Services
- **OpenAI API**: AI tax advisory and question answering
- **Neon Database**: PostgreSQL serverless hosting
- **Gmail SMTP**: Email delivery service
- **Zapier Webhooks**: Automated data integration
- **Google Sheets**: Customer data logging

### Development Tools
- **Vite**: Build tool and development server
- **Drizzle Kit**: Database migration tool
- **TypeScript**: Static type checking
- **ESLint**: Code linting and formatting

### NPM Packages
- **React Query**: Server state management
- **Zod**: Runtime type validation
- **Bcrypt**: Password hashing
- **Nodemailer**: Email sending
- **Web Push**: Push notifications (implemented)
- **CORS**: Cross-origin resource sharing

## Deployment Strategy

### Production Build
- **Static Assets**: Built to `dist/public` directory
- **Server**: Express.js server with custom static file serving
- **Environment**: Node.js runtime with environment variables
- **Database**: Neon PostgreSQL with connection pooling

### Environment Configuration
- **Database**: `DATABASE_URL` for PostgreSQL connection
- **Email**: `EMAIL_USER` and `EMAIL_PASS` for Gmail SMTP
- **AI**: `OPENAI_API_KEY` for tax advisory features
- **Auth**: `JWT_SECRET` for token signing
- **Webhooks**: `ZAPIER_WEBHOOK_URL` for integration

### Security Considerations
- **HTTPS**: Required for production deployment
- **CSP Headers**: Content Security Policy implementation
- **Rate Limiting**: IP-based request throttling
- **Input Validation**: Comprehensive server-side validation
- **SQL Injection Prevention**: Parameterized queries via Drizzle ORM

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- July 06, 2025. Initial setup