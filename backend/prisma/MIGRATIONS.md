# Database Schema Stability & Migration Protocol

## 1. Single Source of Truth
All PostgreSQL database structures are strictly governed by [`backend/prisma/schema.prisma`](file:///c:/Users/dasra/Desktop/Code%20and%20Coffee/backend/prisma/schema.prisma). Ad-hoc manual changes, runtime table alterations, and unversioned DDL execution are strictly prohibited.

## 2. Integrity & Constraint Standards
- **Compound Uniqueness**: Multi-column relationships (e.g., `Like` and `Dislike` tables) must maintain compound unique constraints (`@@unique([userId, postId])`) so concurrent mutations can never produce duplicate reaction rows.
- **Cascading Deletes**: Relational foreign keys explicitly define `onDelete: Cascade` to eliminate orphaned rows when parent models (Users or Posts) are removed.
- **Predictable Indexing**: Any column queried in `WHERE`, `ORDER BY`, or `JOIN` conditions (`slug`, `isPublished`, `category`, `createdAt`, `email`) must feature an explicit index (`@@index`).
- **Defensive Nullability**: All nullable columns (`avatar`, `bannerImage`, `bio`, `mongoDocId`) are explicitly declared with `?`. All required fields specify valid defaults (`@default(...)`).

## 3. Deployment & Migration Workflow
1. **Local Development**:
   ```bash
   npx prisma migrate dev --name <descriptive_migration_name>
   ```
   Generates a versioned, reviewed SQL migration file inside `prisma/migrations/`.
2. **Production Deployment**:
   ```bash
   npx prisma migrate deploy
   ```
   Applies pending versioned migrations in strict order without database reset or downtime.
3. **Client Generation**:
   ```bash
   npx prisma generate
   ```
   Updates type-safe Prisma client bindings with zero runtime overhead.
