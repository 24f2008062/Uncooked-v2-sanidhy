# Contributing to Opportia (Uncooked V2)

Thank you for contributing to **Opportia**! This guide details how to set up your local development environment, adhere to security practices, and submit high-quality contributions.

---

## 🛠️ Prerequisites

Before you begin, ensure your workstation has:
- **Node.js**: `v20.x` or `v22.x` (LTS recommended). Check with `node -v`.
- **npm**: `v10+` (bundled with Node).
- **PostgreSQL**: Local instance or access to a Supabase project.
- **Git**: For version control.

---

## 🚀 Quickstart Setup

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/Uncooked-unfused/Uncooked-v2.git
cd Uncooked-v2
npm install
```

> [!NOTE]
> `npm install` runs a `postinstall` hook that automatically generates the Prisma Client (`prisma generate`).

---

### 2. Configure Environment Variables

Create your local `.env.local` file by copying the template:

```bash
cp .env.example .env.local
```

Open `.env.local` and configure the following key sections:

#### A. Security Secrets (Required)
Generate two separate high-entropy random keys (must be >= 32 chars and distinct from one another):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Paste one as `NEXTAUTH_SECRET` and the other as `TICKET_HMAC_SECRET`.

#### B. Database Connection
- **Local Postgres**:
  ```env
  DATABASE_URL=postgresql://postgres:postgres@localhost:5432/opportia_db?schema=public
  DIRECT_URL=postgresql://postgres:postgres@localhost:5432/opportia_db?schema=public
  DATABASE_SSL_REJECT_UNAUTHORIZED=true
  ```
- **Supabase Cloud / Pooler**:
  ```env
  DATABASE_URL="postgresql://postgres.<project-ref>:<password>@<pooler-host>:6543/postgres?pgbouncer=true"
  DIRECT_URL="postgresql://postgres.<project-ref>:<password>@<pooler-host>:5432/postgres"
  DATABASE_SSL_REJECT_UNAUTHORIZED="false"
  ```

> [!CAUTION]
> **Never set `NODE_TLS_REJECT_UNAUTHORIZED="0"`.**
> Disabling TLS verification globally introduces serious security vulnerabilities and causes the `/api/health` production gate to fail closed (HTTP 503). If connecting to a remote database without custom certificate authorities installed locally, set `DATABASE_SSL_REJECT_UNAUTHORIZED="false"` which configures PostgreSQL pool SSL specifically, leaving the global Node process secure.

#### C. Supabase Authentication (V2)
From your Supabase Dashboard (**Project Settings > API**):
```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

#### D. Upstash Redis (Optional for local, required in production)
Rate limiting automatically falls back to an in-memory store in local development if Upstash credentials are omitted.

---

### 3. Verify Environment Safety

Before running the server, verify your environment configuration:

```bash
npm run check:env
```

This verifies:
- No sensitive `.env` files are tracked in git.
- `NODE_TLS_REJECT_UNAUTHORIZED=0` is NOT active.
- Secrets meet minimal entropy requirements (>= 32 chars, not identical, no placeholders).

---

### 4. Database Setup & Sync

Ensure the Prisma schema is synchronized with your database:

```bash
# Push schema migrations to the database
npx prisma db push

# Optional: Seed initial database data
npm run build # (auto-generates Prisma client)
```

---

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

---

## 🧪 Quality & Testing Gates

All contributions must pass the project's quality gates before submitting a Pull Request:

| Command | Purpose |
| :--- | :--- |
| `npm run check:env` | Verifies no secrets or environment files are exposed to git or insecure |
| `npm test` | Runs the test suite (passwords, rate limits, HMAC validation, auth invariants) |
| `npm run lint` | Checks code formatting and syntax against ESLint rules |
| `npm run build` | Verifies Prisma generation and Next.js production build |
| `npm run verify:routes` | Confirms all critical pages and API routes exist in production output |
| `npm run ci:local` | **Recommended**: Executes all 6 CI/CD gates locally with timing benchmarks |

### Run the Full CI/CD Suite Locally
Any local developer or lab device can execute the exact cloud CI pipeline offline:
```bash
npm run ci:local
```

---

## 🔒 Security & Privacy Guidelines

1. **Fail-Closed Architecture**: Any authorization failure, invalid session, or missing permission must fail safely and deny access by default.
2. **India DPDP Act 2025 Compliance**:
   - Every user has statutory rights to data erasure, consent revocation, and nominee designation.
   - User erasure requests must trigger both local anonymization and Supabase Auth deletion (`src/server/services/erasure.js`).
3. **No Secret Fallbacks**: Do NOT commit fallback secrets or default passwords in source code. All secrets must come strictly through environment variables.
4. **Next.js 16 (Turbopack)**: Follow Next.js 16 conventions (see [AGENTS.md](./AGENTS.md)). Be aware of modern routing and middleware deprecations.

---

## 🌿 Contribution Workflow

1. Create a descriptive feature branch:
   ```bash
   git checkout -b feat/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```
2. Write clean, modular code and add tests in `tests/` where applicable.
3. Run verification checks:
   ```bash
   npm run check:env && npm test && npm run lint
   ```
4. Commit with conventional commit messages:
   ```bash
   git commit -m "feat(events): add capacity alert notification"
   ```
5. Push to your branch and open a Pull Request against `main`.
