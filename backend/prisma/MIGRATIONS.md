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

## 4. Disaster Recovery & Snapshot Backups
Automated database snapshot and restore procedures are bundled directly in the codebase:
- **Create Snapshot**:
  ```bash
  npm run db:backup
  ```
  Exports full relational data into timestamped JSON files (`backend/backups/db-snapshot-*.json`), computes SHA256 integrity checksums, and prunes files older than 14 days.
- **Dry-Run Snapshot Verification**:
  ```bash
  npm run db:restore:dry
  ```
  Validates backup structure and SHA256 checksum integrity without modifying the live database.
- **Full Database Restoration**:
  ```bash
  npm run db:restore
  ```
  Restores relational records using `upsert` in strict dependency order (Users -> Posts -> Comments).

## 5. Cloud Point-in-Time Recovery (PITR)
For cloud-level disaster recovery on Neon PostgreSQL:
1. Neon automatically maintains continuous WAL (Write-Ahead Logging) enabling sub-second Point-in-Time Recovery.
2. In the Neon Console or via Neon CLI:
   ```bash
   neon branches create --from-timestamp "2026-10-24T12:00:00Z" --name recovery-branch
   ```
3. Update `DATABASE_URL` in production secrets to point to the newly verified recovery branch.

