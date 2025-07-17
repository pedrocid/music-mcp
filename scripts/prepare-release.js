#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Music MCP Release Preparation Script');
console.log('=====================================\n');

let hasErrors = false;
let hasWarnings = false;

function logError(message) {
  console.error(`❌ ERROR: ${message}`);
  hasErrors = true;
}

function logWarning(message) {
  console.warn(`⚠️  WARNING: ${message}`);
  hasWarnings = true;
}

function logSuccess(message) {
  console.log(`✅ ${message}`);
}

function logInfo(message) {
  console.log(`ℹ️  ${message}`);
}

function runCommand(command, description, allowFailure = false) {
  try {
    logInfo(`Running: ${description}`);
    execSync(command, { stdio: 'pipe' });
    logSuccess(description);
    return true;
  } catch (error) {
    if (allowFailure) {
      logWarning(`${description} failed: ${error.message}`);
      return false;
    } else {
      logError(`${description} failed: ${error.message}`);
      return false;
    }
  }
}

// 1. Git & Version Control Checks
console.log('📋 Git & Version Control Checks');
console.log('-'.repeat(40));

// Check current branch
try {
  const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  if (currentBranch !== 'main') {
    logWarning(`Currently on branch '${currentBranch}', not 'main'`);
  } else {
    logSuccess('On main branch');
  }
} catch (error) {
  logError('Failed to check current branch');
}

// Check for uncommitted changes
try {
  const status = execSync('git status --porcelain', { encoding: 'utf8' });
  if (status.trim()) {
    logError('Uncommitted changes detected. Please commit or stash changes.');
  } else {
    logSuccess('No uncommitted changes');
  }
} catch (error) {
  logError('Failed to check git status');
}

// Check sync with origin
runCommand('git fetch origin', 'Fetching from origin', true);
try {
  const behind = execSync('git rev-list --count HEAD..origin/main', { encoding: 'utf8' }).trim();
  const ahead = execSync('git rev-list --count origin/main..HEAD', { encoding: 'utf8' }).trim();
  
  if (behind !== '0') {
    logWarning(`Local branch is ${behind} commits behind origin/main`);
  }
  if (ahead !== '0') {
    logInfo(`Local branch is ${ahead} commits ahead of origin/main`);
  }
  if (behind === '0' && ahead === '0') {
    logSuccess('Branch is in sync with origin/main');
  }
} catch (error) {
  logWarning('Could not check sync status with origin');
}

console.log();

// 2. Version Checks
console.log('🔢 Version Checks');
console.log('-'.repeat(40));

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = packageJson.version;

if (!version.match(/^\d+\.\d+\.\d+$/)) {
  logError(`Invalid version format: ${version}`);
} else {
  logSuccess(`Version format is valid: ${version}`);
}

// Check if version exists on npm
runCommand(`npm view ${packageJson.name}@${version}`, 'Checking version availability on npm', true);

console.log();

// 3. Code Quality Checks
console.log('🔍 Code Quality Checks');
console.log('-'.repeat(40));

// Install dependencies
runCommand('npm ci', 'Installing dependencies');

// Check for outdated dependencies
runCommand('npm outdated', 'Checking for outdated dependencies', true);

// Security audit
runCommand('npm audit --audit-level moderate', 'Running security audit', true);

// TypeScript compilation
runCommand('npm run build', 'TypeScript compilation');

// Tests
runCommand('npm test', 'Running tests');

// ESLint
runCommand('npm run lint', 'Running ESLint', true);

console.log();

// 4. File Checks
console.log('📁 File Checks');
console.log('-'.repeat(40));

// Check for large files
const checkFileSize = (filePath, maxSize) => {
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    const lines = fs.readFileSync(filePath, 'utf8').split('\n').length;
    if (lines > maxSize) {
      logWarning(`${filePath} has ${lines} lines (limit: ${maxSize})`);
    } else {
      logSuccess(`${filePath} size OK (${lines} lines)`);
    }
  }
};

// Check TypeScript files
const srcFiles = fs.readdirSync('src', { recursive: true })
  .filter(file => file.endsWith('.ts'))
  .map(file => path.join('src', file));

srcFiles.forEach(file => checkFileSize(file, 500));

console.log();

// 5. Package Validation
console.log('📦 Package Validation');
console.log('-'.repeat(40));

// Required fields
const requiredFields = ['name', 'version', 'description', 'main', 'bin', 'author', 'license'];
requiredFields.forEach(field => {
  if (packageJson[field]) {
    logSuccess(`Package.json has required field: ${field}`);
  } else {
    logError(`Package.json missing required field: ${field}`);
  }
});

// Check package size
try {
  const packOutput = execSync('npm pack --dry-run', { encoding: 'utf8' });
  const sizeMatch = packOutput.match(/package size:\s*([^\s]+)/);
  if (sizeMatch) {
    const size = sizeMatch[1];
    logInfo(`Package size: ${size}`);
    if (size.includes('MB') && parseFloat(size) > 2) {
      logWarning('Package size is larger than 2MB');
    }
  }
} catch (error) {
  logWarning('Could not determine package size');
}

// Check critical files
const criticalFiles = ['src/index.ts', 'README.md', 'LICENSE'];
criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    logSuccess(`Critical file exists: ${file}`);
  } else {
    logError(`Critical file missing: ${file}`);
  }
});

console.log();

// 6. Final Summary
console.log('📊 Release Preparation Summary');
console.log('-'.repeat(40));

if (hasErrors) {
  console.error('❌ RELEASE PREPARATION FAILED');
  console.error('Please fix the errors above before releasing.');
  process.exit(1);
} else if (hasWarnings) {
  console.warn('⚠️  RELEASE PREPARATION COMPLETED WITH WARNINGS');
  console.warn('Review the warnings above. You may proceed with caution.');
  process.exit(0);
} else {
  console.log('✅ RELEASE PREPARATION SUCCESSFUL');
  console.log('All checks passed! Ready for release.');
  console.log('\nNext steps:');
  console.log('1. npm publish --tag beta');
  console.log('2. Test: npx @pedrocid/music-mcp@beta');
  console.log('3. npm publish (if beta works)');
  process.exit(0);
} 