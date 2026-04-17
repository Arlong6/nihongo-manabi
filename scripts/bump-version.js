#!/usr/bin/env node
/**
 * Version bump script for Nihongo Manabi
 *
 * Usage:
 *   node scripts/bump-version.js patch   # 1.2.0 → 1.2.1
 *   node scripts/bump-version.js minor   # 1.2.0 → 1.3.0
 *   node scripts/bump-version.js major   # 1.2.0 → 2.0.0
 *
 * Automatically updates:
 *   - app.json: expo.version, ios.buildNumber, android.versionCode
 *   - package.json: version
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const appJsonPath = path.join(root, 'app.json');
const pkgJsonPath = path.join(root, 'package.json');

const type = process.argv[2] || 'patch';
if (!['patch', 'minor', 'major'].includes(type)) {
  console.error('Usage: bump-version.js [patch|minor|major]');
  process.exit(1);
}

// Read files
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));

// Bump semver
const [major, minor, patch] = appJson.expo.version.split('.').map(Number);
let newVersion;
switch (type) {
  case 'major': newVersion = `${major + 1}.0.0`; break;
  case 'minor': newVersion = `${major}.${minor + 1}.0`; break;
  case 'patch': newVersion = `${major}.${minor}.${patch + 1}`; break;
}

// Bump build number (always increment by 1)
const oldBuild = parseInt(appJson.expo.ios?.buildNumber || '0', 10);
const newBuild = oldBuild + 1;

// Update app.json
appJson.expo.version = newVersion;
appJson.expo.ios.buildNumber = String(newBuild);
appJson.expo.android.versionCode = newBuild;

// Update package.json
pkgJson.version = newVersion;

// Write files
fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');
fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + '\n');

console.log(`✅ ${appJson.expo.version.replace(newVersion, appJson.expo.version)} → v${newVersion} (build ${newBuild})`);
console.log(`   app.json:     version=${newVersion}, buildNumber=${newBuild}, versionCode=${newBuild}`);
console.log(`   package.json: version=${newVersion}`);
