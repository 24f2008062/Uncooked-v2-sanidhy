import { spawnSync } from 'child_process';
import os from 'os';

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';
const npxCmd = isWindows ? 'npx.cmd' : 'npx';

console.log('='.repeat(70));
console.log('🚀 OPPORTIA CI/CD LOCAL & LAB RUNNER');
console.log(`   OS: ${os.type()} ${os.release()} (${process.platform}) [${process.arch}]`);
console.log(`   Node.js: ${process.version}`);
console.log(`   Timestamp: ${new Date().toISOString()}`);
console.log('='.repeat(70) + '\n');

const steps = [
  {
    name: '1. Environment & Secret Safety Check',
    cmd: 'node',
    args: ['scripts/check-env-safety.mjs'],
  },
  {
    name: '2. Dependency Audit (High+ Vulnerabilities)',
    cmd: npmCmd,
    args: ['audit', '--omit=dev', '--audit-level=high'],
  },
  {
    name: '3. ESLint Code Quality',
    cmd: npmCmd,
    args: ['run', 'lint'],
  },
  {
    name: '4. Unit & Security Invariants Test Suite',
    cmd: npmCmd,
    args: ['test'],
  },
  {
    name: '5. Production Build (Prisma + Turbopack)',
    cmd: npmCmd,
    args: ['run', 'build'],
  },
  {
    name: '6. Production Route Smoke Verification',
    cmd: 'node',
    args: ['scripts/verify-build-routes.mjs'],
  },
];

const results = [];
let overallSuccess = true;
const totalStart = Date.now();

for (const step of steps) {
  console.log(`\n▶️  [START] ${step.name}...`);
  const stepStart = Date.now();

  const proc = spawnSync(step.cmd, step.args, {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      // Provide standard CI defaults if running without local secrets
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'local-runner-nextauth-secret-at-least-32-chars-long',
      TICKET_HMAC_SECRET: process.env.TICKET_HMAC_SECRET || 'local-runner-ticket-hmac-secret-at-least-32-chars',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/opportia_ci?schema=public',
      DIRECT_URL: process.env.DIRECT_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/opportia_ci?schema=public',
    },
  });

  const durationMs = Date.now() - stepStart;
  const passed = proc.status === 0;

  if (!passed) {
    overallSuccess = false;
    console.error(`❌ [FAILED] ${step.name} (exited with code ${proc.status}) in ${(durationMs / 1000).toFixed(2)}s`);
    results.push({ name: step.name, status: 'FAILED', durationMs });
    break; // Stop immediately on first failure for fast feedback
  } else {
    console.log(`✅ [PASSED] ${step.name} in ${(durationMs / 1000).toFixed(2)}s`);
    results.push({ name: step.name, status: 'PASSED', durationMs });
  }
}

const totalDurationMs = Date.now() - totalStart;

console.log('\n' + '='.repeat(70));
console.log('📊 CI/CD LOCAL RUN SUMMARY');
console.log('='.repeat(70));

for (const r of results) {
  const icon = r.status === 'PASSED' ? '✅' : '❌';
  console.log(`  ${icon} ${r.name.padEnd(50)} [${r.status}] in ${(r.durationMs / 1000).toFixed(2)}s`);
}

console.log('-'.repeat(70));
console.log(`  Total Duration: ${(totalDurationMs / 1000).toFixed(2)}s`);

if (overallSuccess && results.length === steps.length) {
  console.log('\n🎉 ALL CI/CD GATES PASSED! Ready for commit, pull request, or lab deployment.\n');
  process.exit(0);
} else {
  console.error('\n❌ CI/CD PIPELINE FAILED. Please fix the highlighted errors before pushing.\n');
  process.exit(1);
}
