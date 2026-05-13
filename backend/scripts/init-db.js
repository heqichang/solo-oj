require('dotenv').config();

const { spawn } = require('child_process');
const path = require('path');

const runScript = (scriptPath) => {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', [scriptPath], {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script failed with code ${code}`));
      }
    });
    
    proc.on('error', reject);
  });
};

const main = async () => {
  console.log('========================================');
  console.log('Solo OJ - Database Initialization');
  console.log('========================================\n');
  
  try {
    console.log('[1/2] Running seed script...\n');
    await runScript(path.join(__dirname, '..', 'src', 'seeders', 'seed.js'));
    
    console.log('\n[2/2] Setting up test data...\n');
    await runScript(path.join(__dirname, 'auto-setup-test-data.js'));
    
    console.log('\n========================================');
    console.log('Database initialization complete!');
    console.log('========================================');
    console.log('\nTest users:');
    console.log('  Admin: admin / admin123');
    console.log('  User:  testuser / test123456');
    
  } catch (error) {
    console.error('\nError:', error.message);
    process.exit(1);
  }
};

main();
