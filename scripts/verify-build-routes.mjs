import fs from 'fs';
import path from 'path';

console.log('🔍 Running production build route verification...\n');

const baseDir = path.resolve(process.cwd(), '.next');
const appServerDir = path.join(baseDir, 'server', 'app');

if (!fs.existsSync(baseDir)) {
  console.error('❌ Build directory (.next) not found. Run "npm run build" first.');
  process.exit(1);
}

if (!fs.existsSync(appServerDir)) {
  console.error('❌ App server directory (.next/server/app) not found.');
  process.exit(1);
}

// Critical routes that must be present in every production build
const requiredRoutes = [
  // Core pages
  { name: 'Root page (/)', relPath: 'page.js' },
  { name: 'About (/about)', relPath: 'about.html' },
  { name: 'Login (/login)', relPath: 'login.html' },
  { name: 'Signup (/signup)', relPath: 'signup.html' },
  { name: 'Events Catalog (/events)', relPath: 'events.html' },
  { name: 'Opportunities (/opportunities)', relPath: 'opportunities.html' },
  { name: 'Privacy Notice (/privacy)', relPath: 'privacy.html' },
  { name: 'Terms of Service (/terms)', relPath: 'terms.html' },

  // Critical API endpoints
  { name: 'Health Check API (/api/health)', relPath: path.join('api', 'health') },
  { name: 'Events API (/api/events)', relPath: path.join('api', 'events') },
  { name: 'Auth Login API (/api/auth/login)', relPath: path.join('api', 'auth', 'login') },
  { name: 'Check-in API (/api/events/[id]/check-in)', relPath: path.join('api', 'events', '[id]', 'check-in') },
  { name: 'Host Scanner (/host/scanner/[eventId])', relPath: path.join('host', 'scanner', '[eventId]') },
];

let missingCount = 0;

for (const route of requiredRoutes) {
  const targetPath = path.join(appServerDir, route.relPath);
  const exists = fs.existsSync(targetPath);
  if (exists) {
    console.log(`  ✅ ${route.name.padEnd(45)} [Found]`);
  } else {
    // Check if directory exists without extension
    const dirFallback = targetPath.replace(/\.[^/.]+$/, '');
    if (fs.existsSync(dirFallback)) {
      console.log(`  ✅ ${route.name.padEnd(45)} [Found directory]`);
    } else {
      console.error(`  ❌ MISSING: ${route.name.padEnd(40)} (expected at ${route.relPath})`);
      missingCount++;
    }
  }
}

console.log('');
if (missingCount > 0) {
  console.error(`❌ Build route verification FAILED: ${missingCount} required route(s) missing.\n`);
  process.exit(1);
} else {
  console.log(`🎉 Build route verification PASSED: All ${requiredRoutes.length} critical routes verified.\n`);
  process.exit(0);
}
