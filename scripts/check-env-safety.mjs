import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🛡️  Running environment & secret safety verification...\n');

let failed = false;

// 1. Check git-tracked files for leaked environment files
try {
  const tracked = execSync('git ls-files ".env*" "*.env" "*.env.*"', { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  const leaked = tracked.filter((f) => f.trim() !== '.env.example');
  if (leaked.length > 0) {
    console.error('❌ CRITICAL: Sensitive environment file(s) tracked in git:');
    leaked.forEach((f) => console.error(`   - ${f}`));
    console.error('   Run: git rm --cached <file> and commit the removal immediately.\n');
    failed = true;
  } else {
    console.log('✅ Git tracking: No sensitive .env files are tracked in git.');
  }
} catch (e) {
  console.warn('⚠️  Could not run git ls-files check:', e.message);
}

// 2. Check .env.local file safety if present
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const raw = fs.readFileSync(envLocalPath, 'utf8').replace(/\r/g, '');
  const lines = raw.split('\n');
  const seenKeys = new Map();
  const parsed = {};

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) {
      console.error(`❌ Syntax error at .env.local line ${idx + 1}: missing "=" assignment: "${trimmed}"`);
      failed = true;
      return;
    }

    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');

    if (seenKeys.has(key)) {
      console.warn(`⚠️  Warning: Duplicate key "${key}" detected in .env.local (lines ${seenKeys.get(key)} and ${idx + 1}).`);
    } else {
      seenKeys.set(key, idx + 1);
    }
    parsed[key] = val;
  });

  // Check dangerous TLS bypass
  if (parsed.NODE_TLS_REJECT_UNAUTHORIZED === '0') {
    console.error('❌ CRITICAL SECURITY VULNERABILITY: NODE_TLS_REJECT_UNAUTHORIZED=0 is set in .env.local!');
    console.error('   This disables TLS validation process-wide and causes /api/health to fail closed.');
    console.error('   Remove this variable and configure DATABASE_SSL_REJECT_UNAUTHORIZED="false" instead if needed.\n');
    failed = true;
  } else {
    console.log('✅ TLS security: NODE_TLS_REJECT_UNAUTHORIZED=0 is NOT present.');
  }

  // Check required auth secrets
  const nextAuthSecret = parsed.NEXTAUTH_SECRET;
  const ticketHmacSecret = parsed.TICKET_HMAC_SECRET;

  if (!nextAuthSecret) {
    console.warn('⚠️  NEXTAUTH_SECRET is missing or empty in .env.local.');
  } else if (nextAuthSecret.length < 32) {
    console.error('❌ NEXTAUTH_SECRET must be at least 32 characters long.');
    failed = true;
  } else if (/(dev_secret|change-me|fallback)/i.test(nextAuthSecret)) {
    console.error('❌ NEXTAUTH_SECRET looks like a placeholder and is forbidden.');
    failed = true;
  } else {
    console.log('✅ NEXTAUTH_SECRET: Configured with sufficient entropy (>= 32 characters).');
  }

  if (!ticketHmacSecret) {
    console.warn('⚠️  TICKET_HMAC_SECRET is missing or empty in .env.local.');
  } else if (ticketHmacSecret.length < 32) {
    console.error('❌ TICKET_HMAC_SECRET must be at least 32 characters long.');
    failed = true;
  } else if (ticketHmacSecret === nextAuthSecret) {
    console.error('❌ TICKET_HMAC_SECRET must be different from NEXTAUTH_SECRET.');
    failed = true;
  } else {
    console.log('✅ TICKET_HMAC_SECRET: Configured and distinct from session secret.');
  }

  // Check database URL
  if (!parsed.DATABASE_URL) {
    console.warn('⚠️  DATABASE_URL is not set in .env.local.');
  } else {
    console.log('✅ DATABASE_URL: Configured.');
  }
} else {
  console.log('ℹ️  No .env.local found. Copy .env.example to .env.local to configure your local environment.');
}

console.log('');
if (failed) {
  console.error('❌ Environment safety verification FAILED. Please resolve the errors above.\n');
  process.exit(1);
} else {
  console.log('🎉 Environment safety verification PASSED.\n');
  process.exit(0);
}
