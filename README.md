# ☕ Code & Coffee — Modern Developer Blog Platform (v1)

> An enterprise-grade, high-performance developer publication and blog platform architected with **Next.js (App Router)**, **Node.js/Express (API v1)**, **Neon Serverless PostgreSQL (Prisma)**, **Upstash Redis**, **MongoDB Atlas**, **BullMQ**, and **Nodemailer (Google SMTP)**.

---

## 🌟 Architecture & Core Features

### 1. Two Dedicated Panels
- **Viewer / User Panel**:
  - Browse articles on the landing page in responsive glassmorphic cards.
  - Read full rich Markdown publications with syntax-highlighted code blocks, blockquotes, tables, and callouts.
  - **Live Active Readers Beacon**: Real-time reader presence telemetry powered by Redis sliding-window heartbeats.
  - **Interactive Reactions**: Instant optimistic Like & Dislike buttons.
  - **Developer Discussions**: Commenting system with author roles and moderation.
  - Personal profile dashboard with liked publications and discussion activity.
- **Administrator Control Panel (`/admin`)**:
  - Restrictive Role-Based Access Control (RBAC) ensuring only verified Administrators can create, edit, or delete publications.
  - **Split-Screen Markdown Editor**: Live side-by-side formatted preview, formatting toolbar, word count, and reading time estimator.
  - **Banner & Inline Photo Attachment**: Direct file upload to local static storage or external image URLs.
  - **User Governance Center**: Real-time moderation tools to suspend/ban malicious accounts, promote/demote users to Administrator, and delete accounts.
  - **Live Telemetry & Analytics**: Overview of total publications, active readers, total reactions, and top-viewed articles.

### 2. Multi-Database & Queue Architecture
- **Neon PostgreSQL + Prisma ORM**: Primary relational store for users, roles (`USER`, `ADMIN`), blog posts, likes, dislikes, comments, and security OTP records.
- **Upstash Redis**: Sub-millisecond distributed sliding window heartbeats for live active reader counts (`blog:reader:{blogId}:{readerId}` with 25s auto-expiry TTL), caching, and rate limiting.
- **MongoDB Atlas**: Document store for blog revision histories, drafts, and audit logs.
- **BullMQ**: Background job queue for asynchronous email delivery and metrics processing.
- **Nodemailer + Google SMTP**: Cryptographic 6-digit OTP email dispatch for forgot password and email verification (with fallback developer console output).
- **OAuth2**: Google OAuth & GitHub OAuth integration alongside standard bcrypt salted password authentication.

### 3. Industry-Standard Product Pages & SEO
- Full modern footer with:
  - **About Us** (`/about`): Architecture philosophy, team, and stack breakdown.
  - **Contact Us** (`/contact`): Interactive inquiry form, physical office addresses (San Francisco HQ & Bengaluru Tech Hub), and responsible security disclosure channel.
  - **Privacy Policy** (`/privacy-policy`): GDPR & CCPA compliance, telemetry disclosures.
  - **Terms of Service** (`/terms-of-service`): Content ownership and community guidelines.
  - **Cookie Policy** (`/cookie-policy`): Local storage and session breakdown.
  - **Disclaimer** (`/disclaimer`): Technical representations and warranty notices.
- **SEO Optimization**: OpenGraph metadata, JSON-LD Schema markup, dynamic `sitemap.xml`, and `robots.txt`.

---

## 🚀 Quick Start Guide

### 1. Seeded Credentials for Testing
| Account Role | Email Address | Password |
|---|---|---|
| **Administrator** | `admin@codeandcoffee.dev` | `AdminPassword123!` |
| **Reader / User** | `alex.dev@gmail.com` | `UserPassword123!` |

*(You can also use the **"Fill Admin"** or **"Fill Reader"** one-click buttons on `/auth/login`!)*

### 2. Running Locally

#### Backend (Port 5000)
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run prisma:seed   # Seeds initial admin, demo users, and rich articles
npm run dev           # Starts API server on http://localhost:5000
```

#### Frontend (Port 3000)
```bash
cd frontend
npm install
npm run dev           # Starts Next.js on http://localhost:3000
```

---

## 📡 API Versioning (`/api/v1`)

| Endpoint | Method | Access | Description |
|---|---|---|---|
| `/api/v1/health` | GET | Public | API health check and version metadata |
| `/api/v1/auth/register` | POST | Public | User registration with bcrypt hashing |
| `/api/v1/auth/login` | POST | Public | JWT access and refresh token generation |
| `/api/v1/auth/forgot-password` | POST | Public | Dispatches 6-digit OTP via Google SMTP |
| `/api/v1/auth/reset-password` | POST | Public | Verifies OTP and resets account password |
| `/api/v1/blogs` | GET | Public | Paginated blog listing with category and search |
| `/api/v1/blogs/:slug` | GET | Public | Full article with author, likes, and active readers |
| `/api/v1/blogs` | POST | **ADMIN** | Author and publish new article in Markdown |
| `/api/v1/blogs/:id` | PUT | **ADMIN** | Update article content, banner, or visibility |
| `/api/v1/blogs/:id` | DELETE | **ADMIN** | Permanently remove article |
| `/api/v1/blogs/:id/like` | POST | Auth | Toggle like reaction |
| `/api/v1/blogs/:id/dislike` | POST | Auth | Toggle dislike reaction |
| `/api/v1/readers/heartbeat` | POST | Public | Redis heartbeat ping for active reader counter |
| `/api/v1/users` | GET | **ADMIN** | Audit and manage all platform users |
| `/api/v1/users/:id/ban` | PATCH | **ADMIN** | Suspend or reactivate user account |
| `/api/v1/users/:id/role` | PATCH | **ADMIN** | Elevate to ADMIN or demote to USER |
| `/api/v1/upload/image` | POST | **ADMIN** | Upload banner photo or inline markdown image |

---

## 🌿 Git Branch
This repository is initialized on branch `v1`:
```bash
git checkout v1
```
