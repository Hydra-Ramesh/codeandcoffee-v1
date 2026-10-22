import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Code & Coffee database...');

  // Create or update Admin
  const adminPassword = await bcrypt.hash('AdminPassword123!', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@codeandcoffee.dev' },
    update: {},
    create: {
      name: 'Elena Rostova',
      email: 'admin@codeandcoffee.dev',
      passwordHash: adminPassword,
      role: 'ADMIN',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      bio: 'Staff Distributed Systems Engineer & Founder of Code & Coffee. Writing deeply about high-throughput architectures and caffeine.',
    },
  });

  // Create demo readers
  const userPassword = await bcrypt.hash('UserPassword123!', 10);
  const reader1 = await prisma.user.upsert({
    where: { email: 'alex.dev@gmail.com' },
    update: {},
    create: {
      name: 'Alex Rivera',
      email: 'alex.dev@gmail.com',
      passwordHash: userPassword,
      role: 'USER',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
      bio: 'Fullstack enthusiast, TypeScript wizard and open-source contributor.',
    },
  });

  const reader2 = await prisma.user.upsert({
    where: { email: 'sarah.codes@outlook.com' },
    update: {},
    create: {
      name: 'Sarah Chen',
      email: 'sarah.codes@outlook.com',
      passwordHash: userPassword,
      role: 'USER',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
      bio: 'Cloud Architect building reliable serverless systems on AWS & GCP.',
    },
  });

  // Seed sample blogs with rich Markdown
  const sampleBlogs = [
    {
      title: 'Architecting for 10M Requests/sec: Lessons from Distributed Caching with Upstash & Redis',
      slug: 'architecting-for-10m-requests-redis-caching',
      excerpt: 'Explore how combining multi-tier caching, Redis sliding window counters, and read-replicas delivers sub-millisecond latencies under massive load spikes.',
      category: 'System Design',
      tags: ['Redis', 'Architecture', 'Scale', 'Performance'],
      bannerImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
      views: 1420,
      readingTime: 6,
      content: `
# Architecting for 10M Requests/sec: Lessons from Distributed Caching

When building high-traffic consumer backends or real-time telemetry dashboards, databases like PostgreSQL can quickly become your primary bottleneck under sudden spikes. In this article, we break down how to design an enterprise-grade multi-tier caching layer using **Redis** and **Upstash**.

---

### The Architecture Overview

A resilient distributed architecture separates hot read paths from durable storage:

\`\`\`
[ Client App ]
       │
       ▼
 [ Cloudflare CDN / Edge ]
       │
       ▼
 [ Express / Next.js Gateway ] ──(Sliding Window Check)──► [ Upstash Redis Cluster ]
       │                                                                │
   (Cache Miss)                                                   (Sub-ms Hit)
       ▼                                                                │
 [ Neon PostgreSQL Primary ] ◄──────────────────────────────────────────┘
\`\`\`

### 1. Sliding Window Rate Limiting & Heartbeats

Instead of naive fixed windows that suffer from 2x traffic spikes at window boundaries, a sorted set (\`ZSET\`) or atomic \`SETEX\` creates predictable rate limits:

\`\`\`typescript
async function recordActiveReader(blogId: string, readerId: string): Promise<number> {
  const key = \`blog:reader:\${blogId}:\${readerId}\`;
  // Set key with 25s TTL
  await redis.setex(key, 25, "active");
  const activeKeys = await redis.keys(\`blog:reader:\${blogId}:*\`);
  return activeKeys.length;
}
\`\`\`

### 2. Cache-Aside Pattern with Probabilistic Early Expiration

To prevent the dreaded **thundering herd problem** (cache stampede) when a hot post expires, we implement probabilistic early re-computation:

\`\`\`typescript
function shouldRefreshCache(item: CachedItem, beta = 1.0): boolean {
  const timeToExpiry = item.expiry - Date.now();
  const delta = item.computeTime;
  return -beta * delta * Math.log(Math.random()) >= timeToExpiry;
}
\`\`\`

### Key Takeaways
- Always tier your caching: L1 (in-process memory) + L2 (Redis / Upstash).
- Use atomic counters for active telemetry to eliminate locking.
- Combine write-through or cache-aside with asynchronous BullMQ workers.
      `,
    },
    {
      title: 'Building Modern Full-Stack Next.js 15 Applications with Server Actions & Neon Postgres',
      slug: 'building-modern-fullstack-nextjs-neon-postgres',
      excerpt: 'A deep dive into serverless Postgres connection pooling, optimistic UI updates, and securing API boundaries with role-based JWT guards.',
      category: 'Web Engineering',
      tags: ['Next.js', 'PostgreSQL', 'Prisma', 'TypeScript'],
      bannerImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
      views: 980,
      readingTime: 5,
      content: `
# Building Modern Full-Stack Next.js Applications with Neon Postgres

The modern web development landscape has converged around combining rich React interfaces with hyper-scalable serverless backends. In this guide, we examine the integration between **Next.js**, **Express v1 APIs**, and **Neon Serverless Postgres**.

### Why Neon Postgres?
Neon separates storage from compute, allowing instant branching, autoscaling to zero when idle, and connection pooling for thousands of concurrent serverless lambdas.

### Prisma Schema Setup
Here is our core database schema:

\`\`\`prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Post {
  id          String   @id @default(cuid())
  title       String
  slug        String   @unique
  content     String
  readingTime Int      @default(3)
  views       Int      @default(0)
  createdAt   DateTime @default(now())
}
\`\`\`

### Real-Time Optimistic UI for Likes & Dislikes
Notice how user reactions update instantly in the UI before server round-trips complete:

\`\`\`tsx
const handleLikeToggle = async () => {
  // Optimistic update
  setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
  setIsLiked(!isLiked);
  
  await api.post(\`/blogs/\${blog.id}/like\`);
};
\`\`\`

### Summary
With connection pooling and optimized database indexing, your application stays blazing fast under heavy production traffic!
      `,
    },
    {
      title: 'Zero-Trust API Security: Helmet, Strict CORS, and Cryptographic OTP Workflows in Node.js',
      slug: 'zero-trust-api-security-otp-workflows',
      excerpt: 'Securing modern REST APIs against brute force, CSRF, and injection attacks with Google SMTP and cryptographic random token distribution.',
      category: 'Security & DevOps',
      tags: ['Security', 'OAuth2', 'JWT', 'Nodemailer'],
      bannerImage: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80',
      views: 1850,
      readingTime: 4,
      content: `
# Zero-Trust API Security: Defensive Node.js Architecture

Security is not an afterthought—it must be baked into every layer of your application pipeline from day one. Let's inspect the defensive measures protecting the Code & Coffee platform.

---

### 1. Cryptographically Secure OTP Generation
Never use \`Math.random()\` for one-time passwords or security tokens! Always rely on the OS-entropy \`crypto.randomInt\`:

\`\`\`typescript
import crypto from 'crypto';

export function generateSecureOtp(digits = 6): string {
  return crypto.randomInt(100000, 999999).toString();
}
\`\`\`

### 2. Multi-Tiered Rate Limiting
Separate limits for read requests and authentication attempts prevent credential stuffing:
- **Global API**: 300 requests / 15 minutes per IP
- **Auth & Password Reset**: 20 requests / 10 minutes per IP
- **Reader Heartbeats**: Dedicated lightweight bucket

### 3. Role-Based Access Control (RBAC)
Our middleware strictly separates public viewers from administrators:

\`\`\`typescript
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  next();
}
\`\`\`
      `,
    },
  ];

  for (const blogData of sampleBlogs) {
    const post = await prisma.post.upsert({
      where: { slug: blogData.slug },
      update: {},
      create: {
        ...blogData,
        authorId: admin.id,
      },
    });

    // Add some sample comments
    await prisma.comment.createMany({
      data: [
        {
          content: 'Fascinating article! The breakdown on Redis sliding window telemetry was crystal clear.',
          postId: post.id,
          authorId: reader1.id,
        },
        {
          content: 'We implemented this multi-tier architecture at our startup and cut database costs by 65%. Kudos!',
          postId: post.id,
          authorId: reader2.id,
        },
      ],
      skipDuplicates: true,
    });

    // Add some sample likes
    await prisma.like.upsert({
      where: { userId_postId: { userId: reader1.id, postId: post.id } },
      update: {},
      create: { userId: reader1.id, postId: post.id },
    });
    await prisma.like.upsert({
      where: { userId_postId: { userId: reader2.id, postId: post.id } },
      update: {},
      create: { userId: reader2.id, postId: post.id },
    });
  }

  console.log('✅ Database successfully seeded with Admin, Readers, Blogs, and Comments!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
