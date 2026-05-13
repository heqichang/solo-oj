const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const testDataDir = path.join(__dirname, '..', 'test-data');
const inputsDir = path.join(testDataDir, 'inputs');
const outputsDir = path.join(testDataDir, 'outputs');

const defaultTestCases = {
  'a-plus-b': {
    count: 3,
    generate: (i) => {
      const a = Math.floor(Math.random() * 1000);
      const b = Math.floor(Math.random() * 1000);
      return {
        input: `${a} ${b}\n`,
        output: `${a + b}\n`,
      };
    },
  },
  'hello-world': {
    count: 1,
    generate: () => ({
      input: '',
      output: 'Hello World!\n',
    }),
  },
  'fibonacci': {
    count: 5,
    generate: (i) => {
      const fib = [0, 1];
      for (let j = 2; j <= 40; j++) {
        fib[j] = fib[j - 1] + fib[j - 2];
      }
      const n = [0, 1, 10, 20, 40][i];
      return {
        input: `${n}\n`,
        output: `${fib[n]}\n`,
      };
    },
  },
  'reverse-string': {
    count: 3,
    generate: (i) => {
      const inputs = ['Hello World', 'ABCDEFG', 'Programming Contest'];
      const input = inputs[i];
      return {
        input: `${input}\n`,
        output: `${input.split('').reverse().join('')}\n`,
      };
    },
  },
  'maximum-subarray': {
    count: 4,
    generate: (i) => {
      const testCases = [
        { input: [-2, 1, -3, 4, -1, 2, 1, -5, 4], expected: 6 },
        { input: [1], expected: 1 },
        { input: [-1], expected: -1 },
        { input: [5, 4, -1, 7, 8], expected: 23 },
      ];
      const tc = testCases[i];
      return {
        input: `${tc.input.length}\n${tc.input.join(' ')}\n`,
        output: `${tc.expected}\n`,
      };
    },
  },
};

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const createTestDataForProblem = async (problemSlug, problemId) => {
  const problemDirInput = path.join(inputsDir, problemId);
  const problemDirOutput = path.join(outputsDir, problemId);
  
  ensureDir(problemDirInput);
  ensureDir(problemDirOutput);
  
  const testCaseConfig = defaultTestCases[problemSlug];
  if (!testCaseConfig) {
    console.log(`No default test cases for ${problemSlug}`);
    return;
  }
  
  for (let i = 0; i < testCaseConfig.count; i++) {
    const { input, output } = testCaseConfig.generate(i);
    
    fs.writeFileSync(path.join(problemDirInput, `${i + 1}.in`), input);
    fs.writeFileSync(path.join(problemDirOutput, `${i + 1}.out`), output);
  }
  
  console.log(`Created ${testCaseConfig.count} test cases for ${problemSlug} (${problemId})`);
};

const main = async () => {
  console.log('=== Test Data Setup ===\n');
  
  ensureDir(inputsDir);
  ensureDir(outputsDir);
  
  console.log('This script will create test data directories for problems.');
  console.log('Available default test cases:');
  Object.keys(defaultTestCases).forEach((slug, i) => {
    console.log(`  ${i + 1}. ${slug} (${defaultTestCases[slug].count} test cases)`);
  });
  console.log();
  
  const question = `Enter the problem slug to generate test data (or 'all' for all): `;
  
  rl.question(question, async (answer) => {
    const input = answer.trim();
    
    if (input === 'all') {
      console.log('\nCreating test data for all problems...');
      console.log('Note: You need to provide the actual database IDs for each problem.');
      console.log('After creating problems via API, run this script again with individual slugs.');
      console.log('\nExample usage:');
      console.log('  Enter slug: a-plus-b');
      console.log('  Enter problem ID: <uuid-from-database>');
    } else if (defaultTestCases[input]) {
      rl.question(`Enter problem ID (UUID) for '${input}': `, async (id) => {
        const problemId = id.trim();
        if (problemId) {
          await createTestDataForProblem(input, problemId);
          console.log('\nDone! Test data created.');
        }
        rl.close();
      });
      return;
    } else {
      console.log(`No default test cases for '${input}'`);
    }
    
    rl.close();
  });
};

main();
