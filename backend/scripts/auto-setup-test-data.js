require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { connectDatabase } = require('../src/config/database');
const { Problem, sequelize } = require('../src/models');

const testDataDir = path.join(__dirname, '..', 'test-data');
const inputsDir = path.join(testDataDir, 'inputs');
const outputsDir = path.join(testDataDir, 'outputs');

const defaultTestCases = {
  'a-plus-b': {
    count: 3,
    generate: (i) => {
      const testCases = [
        { a: 1, b: 2 },
        { a: 100, b: 200 },
        { a: -5, b: 8 },
      ];
      const tc = testCases[i] || { a: Math.floor(Math.random() * 1000), b: Math.floor(Math.random() * 1000) };
      return {
        input: `${tc.a} ${tc.b}\n`,
        output: `${tc.a + tc.b}\n`,
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
      const testCases = [0, 1, 10, 20, 40];
      const n = testCases[i];
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

const createTestDataForProblem = async (problem) => {
  const problemDirInput = path.join(inputsDir, problem.id);
  const problemDirOutput = path.join(outputsDir, problem.id);
  
  ensureDir(problemDirInput);
  ensureDir(problemDirOutput);
  
  const testCaseConfig = defaultTestCases[problem.slug];
  if (!testCaseConfig) {
    console.log(`No default test cases for ${problem.slug}`);
    return 0;
  }
  
  for (let i = 0; i < testCaseConfig.count; i++) {
    const { input, output } = testCaseConfig.generate(i);
    
    fs.writeFileSync(path.join(problemDirInput, `${i + 1}.in`), input);
    fs.writeFileSync(path.join(problemDirOutput, `${i + 1}.out`), output);
  }
  
  console.log(`  Created ${testCaseConfig.count} test cases for: ${problem.slug} (${problem.id})`);
  return testCaseConfig.count;
};

const main = async () => {
  console.log('=== Auto Setup Test Data ===\n');
  
  ensureDir(inputsDir);
  ensureDir(outputsDir);
  
  try {
    await connectDatabase(null);
    
    const problems = await Problem.findAll();
    console.log(`Found ${problems.length} problems in database.\n`);
    
    let totalTestCases = 0;
    for (const problem of problems) {
      const count = await createTestDataForProblem(problem);
      totalTestCases += count;
    }
    
    console.log(`\nDone! Created ${totalTestCases} test cases for ${problems.length} problems.`);
    console.log('\nTest data location:');
    console.log(`  Inputs:  ${inputsDir}`);
    console.log(`  Outputs: ${outputsDir}`);
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

main();
