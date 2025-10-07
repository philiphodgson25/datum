# Development Environment Audit - DA Statement Project

**Date**: October 6, 2025
**Project**: DA Statement (Design & Access Statements Generator)
**Location**: `/Users/philip/Library/CloudStorage/GoogleDrive-phil@latentmade.com/My Drive/Clients/DA Statement`
**Repository**: https://github.com/philiphodgson25/datum.git

---

## Table of Contents

1. [System Environment](#1-system-environment)
2. [Tech Stack & Versions](#2-tech-stack--versions)
3. [Project Structure](#3-project-structure)
4. [Dependencies & Packages](#4-dependencies--packages)
5. [Configuration Files](#5-configuration-files)
6. [Running Services](#6-running-services)
7. [Development Tools](#7-development-tools)
8. [Issues & Recommendations](#8-issues--recommendations)

---

## 1. System Environment

### Operating System
- **OS**: macOS 15.6.1 (Sequoia)
- **Build**: 24G90
- **Kernel**: Darwin 24.6.0
- **Architecture**: ARM64 (Apple Silicon - M2)
- **Hostname**: Philips-MacBook-Air-2.local

### Shell Configuration
- **Default Shell**: `/bin/zsh` (Zsh 5.9)
- **Available Shells**:
  - Zsh 5.9 (arm64-apple-darwin24.0)
  - Bash 3.2.57 (arm64-apple-darwin24)

### Environment Variables
```bash
# Key Variables
LANG=en_GB.UTF-8
TERM=xterm-256color
TERM_PROGRAM=Apple_Terminal
HOME=/Users/philip
USER=philip

# Node Version Manager
NVM_DIR=$HOME/.nvm

# API Keys
ANTHROPIC_API_KEY=sk-ant-api03-*** (configured in ~/.zshrc)
```

⚠️ **SECURITY WARNING**: API key is stored in plain text in `~/.zshrc`. Consider using a secure credential manager.

### Shell Configuration Files
**~/.zshrc** (3 lines):
```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
export ANTHROPIC_API_KEY=sk-ant-api03-*** [REDACTED]
```

---

## 2. Tech Stack & Versions

### Programming Languages

#### Node.js
- **Version**: v22.17.0
- **Installed via**: NVM (Node Version Manager)
- **Location**: `/Users/philip/.nvm/versions/node/v22.17.0/bin/node`

#### Python
- **Version**: 3.13.7
- **Location**: `/Library/Frameworks/Python.framework/Versions/3.13/bin/python3`
- **pip Version**: 25.2

#### Ruby
- **Version**: 2.6.10p210 (2022-04-12)
- **Location**: `/usr/bin/ruby` (system default)
- **gem Version**: 3.0.3.1

### Package Managers

| Package Manager | Version | Location |
|----------------|---------|----------|
| **npm** | 11.6.1 | `/Users/philip/.nvm/versions/node/v22.17.0/bin/npm` |
| **pnpm** | 10.17.1 | `/Users/philip/.nvm/versions/node/v22.17.0/bin/pnpm` |
| **yarn** | 1.22.22 | `/Users/philip/.nvm/versions/node/v22.17.0/bin/yarn` (via Corepack) |
| **pip3** | 25.2 | `/Library/Frameworks/Python.framework/Versions/3.13/bin/pip3` |
| **Homebrew** | 4.5.10 | `/opt/homebrew/bin/brew` |

### Version Control
- **Git**: 2.39.5 (Apple Git-154)
- **Git User**: Phil H
- **Git Email**: 218595681+philiphodgson25@users.noreply.github.com

### Databases
- **PostgreSQL**: Not installed locally (using Supabase cloud)
- **Redis**: Not installed
- **MongoDB**: Not installed

### Web Servers
- **nginx**: Not installed
- **Apache**: Not installed

### Containerization
- **Docker**: Not installed
- **Docker Compose**: Not installed

---

## 3. Project Structure

### Overview
This is a **Next.js 14 application** using the App Router pattern, built for generating Design & Access Statements for England-only planning applications.

### Directory Tree
```
DA Statement/
├── .git/                    # Git repository
├── .next/                   # Next.js build output (3.7MB)
├── node_modules/            # Dependencies (~170MB)
├── app/                     # Next.js App Router pages
│   ├── api/                 # API routes
│   │   └── das/             # Design & Access Statement API
│   ├── auth/                # Authentication routes
│   │   ├── callback/        # OAuth callback
│   │   ├── sign-in/         # Sign-in page
│   │   └── sign-out/        # Sign-out handler
│   ├── new/                 # New statement creation
│   ├── runs/                # Statement runs/history
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Homepage
├── db/                      # Database files
│   └── migrations/          # Drizzle ORM migrations
├── integrations/            # Third-party API integrations
│   ├── historic-england.ts  # Historic England API
│   ├── os-places.ts         # Ordnance Survey Places API
│   ├── planit.ts            # PlanIt API
│   └── planning-data.ts     # Planning Data API
├── lib/                     # Shared library code
│   ├── auth.ts              # Authentication logic
│   ├── config.ts            # App configuration
│   ├── db.ts                # Database connection
│   ├── env.ts               # Environment variables
│   ├── llm.ts               # LLM integration
│   ├── schema.ts            # Database schema (Drizzle)
│   ├── supabase.client.ts   # Supabase client-side
│   ├── supabase.server.ts   # Supabase server-side
│   └── supabase.ts          # Supabase config
├── python/                  # Python scripts (empty)
├── scripts/                 # Build/utility scripts
│   └── seed.ts              # Database seeding script
├── workers/                 # Background workers (empty)
├── .eslintrc.cjs            # ESLint configuration
├── .gitignore               # Git ignore rules
├── .prettierrc              # Prettier configuration
├── drizzle.config.ts        # Drizzle ORM config
├── middleware.ts            # Next.js middleware
├── next.config.mjs          # Next.js configuration
├── next-env.d.ts            # Next.js TypeScript definitions
├── package.json             # Dependencies
├── pnpm-lock.yaml           # pnpm lock file
├── README.md                # Project documentation
├── tsconfig.json            # TypeScript configuration
└── vitest.config.ts         # Vitest test configuration
```

### Project Type
- **Framework**: Next.js 14.2.6 (App Router)
- **Language**: TypeScript 5.6.2
- **Runtime**: Node.js >=18.18.0 (using v22.17.0)
- **Package Manager**: pnpm 10.17.1

---

## 4. Dependencies & Packages

### Global npm Packages
```
@anthropic-ai/claude-code@2.0.8
@squoosh/cli@0.7.1
corepack@0.33.0
npm@11.6.1
vercel@47.1.4
```

### Global Python Packages (13 installed)
```
certifi==2025.8.3
geopandas==1.1.1
numpy==2.3.3
packaging==25.0
pandas==2.3.3
pip==25.2
pyogrio==0.11.1
pyproj==3.7.2
python-dateutil==2.9.0.post0
pytz==2025.2
shapely==2.1.2
six==1.17.0
tzdata==2025.2
```

### Homebrew Packages (37 installed)
Sample packages:
```
aom, brotli, fontconfig, freetype, gettext, giflib, glib, highway,
imagemagick, imath, jasper, jpeg-turbo, jpeg-xl, libavif, libde265,
libdeflate, libheif, liblqr, libomp, libpng...
```

### Project Dependencies (package.json)

#### Production Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `@supabase/supabase-js` | ^2.47.10 | Supabase client |
| `@supabase/ssr` | ^0.5.0 | Supabase SSR utilities |
| `date-fns` | ^3.6.0 | Date manipulation |
| `drizzle-orm` | ^0.35.3 | TypeScript ORM |
| `next` | ^14.2.6 | React framework |
| `pg` | ^8.12.0 | PostgreSQL client |
| `postgres` | ^3.4.4 | PostgreSQL driver |
| `react` | ^18.3.1 | UI library |
| `react-dom` | ^18.3.1 | React DOM renderer |
| `undici` | ^6.19.8 | HTTP client |
| `uuid` | ^9.0.1 | UUID generation |
| `zod` | ^3.23.8 | Schema validation |

#### Development Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `@types/node` | ^22.7.4 | Node.js types |
| `@types/react` | 19.1.16 | React types |
| `@types/uuid` | ^9.0.7 | UUID types |
| `drizzle-kit` | ^0.23.2 | Drizzle CLI tools |
| `eslint` | ^8.57.0 | Linting |
| `eslint-config-next` | ^14.2.6 | Next.js ESLint config |
| `eslint-config-prettier` | ^9.1.0 | Prettier integration |
| `prettier` | ^3.3.3 | Code formatting |
| `tsx` | ^4.19.0 | TypeScript executor |
| `typescript` | ^5.6.2 | TypeScript compiler |
| `vitest` | ^2.1.1 | Testing framework |

### npm Scripts
```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "db:push": "drizzle-kit push",
  "db:studio": "drizzle-kit studio",
  "seed": "tsx scripts/seed.ts",
  "test": "vitest"
}
```

---

## 5. Configuration Files

### TypeScript Configuration (tsconfig.json)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "jsx": "preserve",
    "incremental": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "baseUrl": ".",
    "allowJs": true,
    "isolatedModules": true,
    "plugins": [{"name": "next"}]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", "**/*.cjs", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "drizzle.config.ts"]
}
```

### Next.js Configuration (next.config.mjs)
```javascript
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
    serverActions: {
      bodySizeLimit: '2mb'
    }
  }
};
```

**Features enabled**:
- ✅ React Strict Mode
- ✅ Typed Routes (experimental)
- ✅ Server Actions (2MB body size limit)

### Drizzle ORM Configuration (drizzle.config.ts)
```typescript
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './lib/schema.ts',
  out: './db/migrations',
  dialect: 'postgresql',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || ''
  },
  strict: true,
  verbose: true
});
```

**Database**: PostgreSQL (via Supabase)
**Schema Location**: `lib/schema.ts`
**Migrations**: `db/migrations/`

### ESLint Configuration (.eslintrc.cjs)
```javascript
module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2023,
    sourceType: 'module'
  },
  env: {
    node: true,
    es2022: true,
    browser: true
  },
  extends: ['next/core-web-vitals', 'eslint:recommended', 'prettier'],
  rules: {
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }]
  }
};
```

### Prettier Configuration (.prettierrc)
```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "tabWidth": 2,
  "printWidth": 100
}
```

### Git Configuration
**User Config** (`~/.gitconfig`):
```ini
[user]
  email = 218595681+philiphodgson25@users.noreply.github.com
  name = Phil H
```

**Repository**:
- Remote: `origin` → https://github.com/philiphodgson25/datum.git
- Current Branch: `main`
- Git Status: Clean (no SSH config found)

### Environment Variables
**Required (from README.md)**:
```bash
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
DATABASE_URL=
```

⚠️ **Note**: No `.env` or `.env.local` files found in project directory. Environment variables must be configured before running the application.

---

## 6. Running Services

### Active Ports
| Port | Process | Description |
|------|---------|-------------|
| **3000** | node (PID 12329) | Development server (likely another Next.js app) |
| 5000 | ControlCe | Apple Control Center |
| 7000 | ControlCe | Apple Control Center |
| 7679 | Google | Google Drive |
| 17600 | Dropbox | Dropbox |
| 17603 | Dropbox | Dropbox |
| 50170 | rapportd | macOS rapportd |

⚠️ **Note**: Port 3000 is already in use by another Node.js process. You'll need to either:
1. Stop the existing process
2. Configure this project to use port 3030
3. Check if it's the same project running

### Running Node Processes
```
PID 12329: node .../latent-made/node_modules/.bin/next dev
  Location: /Users/philip/Library/CloudStorage/GoogleDrive-phil@latentmade.com/My Drive/Website/latent-made
  Status: Running Next.js dev server on port 3000
```

### Database Status
- **PostgreSQL**: Not running locally (using Supabase cloud)
- **Redis**: Not installed
- **MongoDB**: Not installed

### Docker Status
- **Docker**: Not installed
- **Docker Compose**: Not installed

---

## 7. Development Tools

### Version Control
- **Git**: 2.39.5 (Apple Git-154)
- **GitHub CLI**: Not installed
- **Repository**: https://github.com/philiphodgson25/datum.git

### Code Editors (Available)
- **Cursor**: Installed (`.app` found in processes)
- **Claude Desktop**: Installed (processes found)
- **vim**: `/usr/bin/vim` (system default)
- **nano**: `/usr/bin/nano` (system default)
- **VSCode**: Not found in PATH

### Terminal
- **Terminal**: Apple Terminal (version 455.1)
- **Session**: xterm-256color

### Build Tools
- **Next.js**: 14.2.6 (production builds)
- **Vite**: Not used in this project
- **webpack**: Bundled with Next.js

### Testing Tools
- **Vitest**: 2.1.1 (configured but minimal setup)
- **Jest**: Not installed

### Database Tools
- **Drizzle Kit**: 0.23.2 (migrations and schema management)
- **Drizzle Studio**: Available via `pnpm db:studio`

### Deployment Tools
- **Vercel CLI**: 47.1.4 (global install)
- **Platform**: Vercel (configured for deployment)

### API Clients
- **Anthropic Claude**: Claude Code CLI 2.0.8 (global)
- **Undici**: 6.19.8 (HTTP client in project)

### Other Tools
- **@squoosh/cli**: 0.7.1 (image optimization)
- **tsx**: 4.19.0 (TypeScript executor)

---

## 8. Issues & Recommendations

### 🔴 Critical Issues

#### 1. Missing Environment Variables
**Issue**: No `.env.local` or `.env` file found in project directory.

**Impact**: Application will not start without required environment variables:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `DATABASE_URL`

**Recommendation**:
```bash
# Create .env.local file
cp .env.example .env.local  # (if exists)
# OR create manually with required variables
```

#### 2. Port Conflict (Port 3000)
**Issue**: Port 3000 is already in use by another Next.js application.

**Impact**: Cannot run `pnpm dev` without port conflict.

**Recommendation**:
```bash
# Option 1: Stop existing process
kill 12329

# Option 2: Use different port
pnpm dev -- -p 3001

# Option 3: Configure port in package.json
"dev": "next dev -p 3001"
```

#### 3. API Key Exposure in Shell Config
**Issue**: `ANTHROPIC_API_KEY` stored in plain text in `~/.zshrc`.

**Impact**: Security risk if shell config is shared or committed to version control.

**Recommendation**:
```bash
# Remove from ~/.zshrc
# Store in secure credential manager or .env file (gitignored)
# Use environment-specific key management
```

### ⚠️ Warnings

#### 1. Empty Directories
**Issue**: `python/`, `workers/`, and `db/migrations/` contain only `.gitkeep` files.

**Impact**: Incomplete implementation or unused features.

**Recommendation**: Remove unused directories or document their intended purpose.

#### 2. No Docker Setup
**Issue**: No Docker or containerization setup found.

**Impact**: Inconsistent development environments across machines.

**Recommendation**: Consider adding Docker setup for:
- Consistent PostgreSQL version (if running locally)
- Reproducible development environment
- Easier onboarding

#### 3. Minimal Test Coverage
**Issue**: Vitest is configured but only basic setup exists.

**Impact**: No automated testing in place.

**Recommendation**: Add tests for:
- API routes (`app/api/das/`)
- Integration modules (`integrations/`)
- Utility functions (`lib/`)

#### 4. Large Build Output
**Issue**: `.next/` directory is committed to git (visible in working directory).

**Impact**: Bloats repository size, causes merge conflicts.

**Recommendation**: Verify `.next/` is in `.gitignore` (it should be).

### ✅ Strengths

1. **Modern Stack**: Next.js 14 App Router, TypeScript, Drizzle ORM
2. **Good Tooling**: ESLint, Prettier, Vitest configured
3. **Type Safety**: Full TypeScript setup with strict mode
4. **Code Quality**: Consistent formatting and linting rules
5. **Cloud-Native**: Supabase integration for auth and database
6. **Clean Structure**: Well-organized Next.js project layout
7. **Version Control**: Git setup with remote repository

---

## Appendix: Quick Reference

### Common Commands
```bash
# Development
pnpm install          # Install dependencies
pnpm dev              # Start dev server (port 3000)
pnpm build            # Build for production
pnpm start            # Start production server

# Database
pnpm db:push          # Push schema to database
pnpm db:studio        # Open Drizzle Studio

# Code Quality
pnpm lint             # Run ESLint
pnpm test             # Run tests

# Other
pnpm seed             # Seed database
vercel                # Deploy to Vercel
```

### Important Paths
```bash
# Project Root
/Users/philip/Library/CloudStorage/GoogleDrive-phil@latentmade.com/My Drive/Clients/DA Statement

# Node.js
/Users/philip/.nvm/versions/node/v22.17.0

# Python
/Library/Frameworks/Python.framework/Versions/3.13

# Homebrew
/opt/homebrew

# Shell Config
~/.zshrc
```

### External Services
- **Repository**: https://github.com/philiphodgson25/datum.git
- **Database**: Supabase (cloud-hosted PostgreSQL)
- **Authentication**: Supabase Auth (email magic links)
- **Deployment**: Vercel

---

**Audit Completed**: October 6, 2025
**Next Steps**:
1. Configure environment variables (`.env.local`)
2. Resolve port 3000 conflict
3. Move API key to secure storage
4. Run `pnpm install` to verify dependencies
5. Test database connection with `pnpm db:studio`
6. Start development server with `pnpm dev -p 3001`

---

*This document provides a comprehensive snapshot of your development environment. Refer to it when setting up new machines, onboarding team members, or troubleshooting issues.*
