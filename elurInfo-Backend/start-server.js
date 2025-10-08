const { execSync } = require('child_process');
const path = require('path');

console.log('Starting ElurInfo Backend Server...');
console.log('Current directory:', process.cwd());

try {
  // Try with tsx first
  console.log('Attempting to start with tsx...');
  execSync('npx tsx src/index.ts', { stdio: 'inherit', cwd: __dirname });
} catch (error) {
  console.log('tsx failed, trying with ts-node...');
  try {
    execSync('npx ts-node src/index.ts', { stdio: 'inherit', cwd: __dirname });
  } catch (error2) {
    console.log('ts-node failed, trying to compile and run...');
    try {
      execSync('npx tsc', { stdio: 'inherit', cwd: __dirname });
      execSync('node dist/index.js', { stdio: 'inherit', cwd: __dirname });
    } catch (error3) {
      console.error('All methods failed:', error3.message);
      process.exit(1);
    }
  }
}