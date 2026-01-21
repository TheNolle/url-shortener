# S - URL Shortener

A modern, enterprise-grade URL shortener built with Next.js 16, featuring advanced security, analytics, and deployment automation.

## Overview

S is a production-ready URL shortening service with multi-tier security scanning, detailed analytics, A/B testing capabilities, and comprehensive health monitoring. Built for developers who need full control and reliability.

## Features

### Core Functionality

- Custom short links with automatic code generation
- Password-protected URLs
- Link expiration for non-authenticated users
- QR code generation for every link
- OpenGraph metadata scraping and preview
- Social media bot detection for preview redirects

### Security Layer

- Google Safe Browsing integration
- VirusTotal scanning (70+ engines)
- URLert AI-powered detection
- IP and domain banning system
- Automated threat flagging
- Community reporting system

### Analytics & Tracking

- Real-time click tracking
- Geographic distribution (country, city)
- Device and browser analytics
- UTM campaign parameter tracking
- Referrer source analysis
- Historical data visualization

### Advanced Features

- A/B testing with link rotation (random, weighted, sequential)
- UTM campaign builder
- Automated link health monitoring
- API key system with rate limiting
- Admin dashboard with full system control
- Automated background tasks with node-cron

### Performance

- Multi-layer caching (Redis + in-memory)
- PostgreSQL with Prisma ORM
- Optimized database queries with indexes
- Docker containerization
- Production-ready deployment

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **ORM**: Prisma 7
- **Authentication**: Clerk
- **UI**: Radix UI + Tailwind CSS 4
- **Validation**: Zod
- **Deployment**: Docker + Docker Compose

## Quick Start

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- Clerk account for authentication

### Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

Configure the following required variables:
```env
# Clerk (required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
CLERK_SECRET_KEY=your_secret
CLERK_WEBHOOK_SECRET=your_webhook_secret

# Database (Docker handles this)
POSTGRES_USER=s_agent
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=s

# Domain
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_SHORT_DOMAIN=yourdomain.com

# Security APIs (optional but recommended)
GOOGLE_SAFE_BROWSING_API_KEY=your_key
VIRUSTOTAL_API_KEY=your_key
URLERT_API_KEY=your_key

# Admin
ADMIN_USER_IDS=your_clerk_user_id
```

### Installation

Using Docker (Recommended)
```bash
# Start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# The app will be available at http://localhost:3000
```

Manual Installation
```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpx prisma generate

# Run database migrations
pnpx prisma migrate deploy

# Start development server
pnpm run dev
```

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── (main)/            # Main app layout
│   ├── admin/             # Admin dashboard
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/                # UI primitives (Radix)
│   └── admin/             # Admin-specific components
├── lib/                   # Core libraries
│   ├── analytics.ts       # Click tracking & stats
│   ├── api-keys.ts        # API key management
│   ├── cache.ts           # Redis caching
│   ├── cron.ts            # Background jobs
│   ├── health-monitor.ts  # Link health checks
│   ├── rotation.ts        # A/B testing logic
│   ├── shortener.ts       # URL shortening core
│   └── utm-builder.ts     # UTM parameter builder
├── prisma/                # Database schema & migrations
├── scripts/               # Utility scripts
├── Dockerfile             # Production container
├── docker-compose.yml     # Multi-container setup
└── Makefile               # Development shortcuts
```

## Database Schema

Core Models
- **Url**: Short links with metadata
- **UserUrl**: User-link relationships
- **Analytics**: Click statistics
- **ClickEvent**: Individual click records
- **RotationLink**: A/B testing destinations
- **HealthCheck**: Link health history

Security Models
- **Report**: Community reports
- **UrlScan**: Security scan results
- **BannedIp**: IP blocklist
- **BannedDomain**: Domain blocklist

System Models
- **ApiKey**: API authentication
- **LinkMetadata**: OpenGraph data
- **RateLimit**: Rate limiting tokens

## API Reference

### Authentication

All API requests require either session authentication or an API key header:
```
X-API-Key: your_api_key_here
```

### Endpoints

#### POST /api/shorten

Create a shortened URL.
```
{
  "url": "https://example.com",
  "customCode": "optional",
  "password": "optional",
  "expiresInDays": 30
}
```

#### POST /api/rotation/create

Create an A/B testing link.
```
{
  "type": "WEIGHTED",
  "destinations": [
    { "url": "https://variant-a.com", "weight": 70, "label": "Version A" },
    { "url": "https://variant-b.com", "weight": 30, "label": "Version B" }
  ]
}
```

#### GET /api/analytics/:code

Retrieve analytics for a short link.

### Docker Commands

Using Makefile
```bash
make build      # Build containers
make up         # Start services
make down       # Stop services
make logs       # View logs
make restart    # Restart all services
make clean      # Remove all data
make migrate    # Run database migrations
make dev        # Start development environment
```

Using Docker Compose
```bash
# Production
docker-compose up -d --build
docker-compose logs -f
docker-compose down

# Development
docker-compose -f docker-compose.dev.yml up -d
```

## Cron Jobs

Automated background tasks run via node-cron:
- Health checks: Every 6 hours
- Click event cleanup: Daily at 2 AM (keeps 90 days)
- Expired URL cleanup: Weekly on Sundays at 3 AM

Configure in `lib/cron.ts`.

## Admin Features

Access the admin panel at `/admin` (requires ADMIN_USER_IDS).
- System statistics dashboard
- URL management (ban, delete, flag)
- Report queue review
- IP and domain ban management
- System-wide health monitoring

Security Best Practices
- Rotate API keys regularly
- Enable all three security scanning services
- Review flagged URLs promptly
- Monitor admin audit logs
- Use strong PostgreSQL credentials
- Enable HTTPS in production
- Restrict admin access by user ID

Performance Optimization
- Redis caching reduces database load by 90%
- Database indexes on frequently queried fields
- Prisma connection pooling
- Docker multi-stage builds for smaller images
- Standalone Next.js output for faster cold starts

## Deployment

Production Checklist
1. Update environment variables with production values
1. Set secure PostgreSQL password
1. Configure custom domain in NEXT_PUBLIC_SHORT_DOMAIN
1. Enable HTTPS (use reverse proxy like Nginx)
1. Set up database backups
1. Configure external Redis for high availability
1. Enable monitoring and error tracking

### VPS Deployment

```bash
# Clone repository
git clone https://github.com/thenolle/url-shortener.git
cd url-shortener

# Configure environment
cp .env.example .env
nano .env

# Start services
docker-compose up -d --build

# View logs
docker-compose logs -f
```

### Updating

```bash
git pull
docker-compose up -d --build
docker exec -it s-app npx prisma migrate deploy
```

### Monitoring

Health monitoring includes:
- HTTP status code tracking
- Response time measurement
- Uptime percentage calculation
- Auto-flagging after 3 consecutive failures
- Manual re-check capability
- Historical health data (last 30 checks)

## Contributing

This is a production-ready template. Customize as needed for your use case.  
Feel free to submit issues or pull requests for improvements or bug fixes.  
Please follow the established code style and include tests for new features.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgements

- Built with Next.js, Prisma, and Tailwind CSS
- Inspired by best practices in URL shortening and web security
- Thanks to the open-source community for libraries and tools used in this project
- Special thanks to Clerk for providing authentication services

## Support

For issues or questions, refer to the inline documentation in the codebase.
Contact me via GitHub or email for further assistance.

> Happy shortening! 🚀