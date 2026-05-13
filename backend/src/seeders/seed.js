require('dotenv').config();

const { connectDatabase } = require('../config/database');
const { User, Problem, Tag, sequelize } = require('../models');

const seedData = async () => {
  console.log('Starting seed...');
  
  await connectDatabase();
  
  try {
    const admin = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123',
      nickname: '系统管理员',
      bio: '系统管理员账户',
      isAdmin: true,
    });
    console.log('Created admin user: admin / admin123');
    
    const normalUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'test123456',
      nickname: '测试用户',
      bio: '这是一个测试用户',
    });
    console.log('Created test user: testuser / test123456');
    
    const tag1 = await Tag.create({ name: '数组', description: '数组相关问题' });
    const tag2 = await Tag.create({ name: '简单', description: '入门难度' });
    const tag3 = await Tag.create({ name: '数学', description: '数学运算' });
    const tag4 = await Tag.create({ name: '字符串', description: '字符串处理' });
    const tag5 = await Tag.create({ name: '动态规划', description: '动态规划问题' });
    
    console.log('Created tags');
    
    const problem1 = await Problem.create({
      title: 'A + B Problem',
      slug: 'a-plus-b',
      description: '计算两个整数的和。\n\n这是一个入门级的题目，帮助你熟悉编程环境。',
      inputFormat: '输入包含多组数据。\n每组数据包含两个整数 a 和 b。\n\n读取到文件结束为止。',
      outputFormat: '对于每组数据，输出 a + b 的结果。\n每个结果占一行。',
      examples: [
        { input: '1 2\n3 4', output: '3\n7', explanation: '1 + 2 = 3, 3 + 4 = 7' },
      ],
      hints: [
        '使用 while(cin >> a >> b) 来读取输入直到 EOF',
        '注意多组数据的处理',
      ],
      difficulty: 'EASY',
      timeLimitMs: 1000,
      memoryLimitMB: 128,
      testCaseCount: 3,
    });
    await problem1.setTags([tag1, tag2]);
    console.log('Created problem: A + B Problem');
    
    const problem2 = await Problem.create({
      title: 'Hello World',
      slug: 'hello-world',
      description: '输出 "Hello World!"。\n\n这是最基础的题目，只需要输出指定的文本即可。',
      inputFormat: '本题没有输入。',
      outputFormat: '输出一行 "Hello World!"（不含引号）。',
      examples: [
        { input: '', output: 'Hello World!' },
      ],
      hints: [
        '直接使用 cout 或 printf 输出',
        '注意大小写和标点符号',
      ],
      difficulty: 'EASY',
      timeLimitMs: 1000,
      memoryLimitMB: 64,
      testCaseCount: 1,
    });
    await problem2.setTags([tag2]);
    console.log('Created problem: Hello World');
    
    const problem3 = await Problem.create({
      title: '斐波那契数列',
      slug: 'fibonacci',
      description: '计算斐波那契数列的第 n 项。\n\n斐波那契数列定义如下：\nF(0) = 0, F(1) = 1\nF(n) = F(n-1) + F(n-2) (n >= 2)',
      inputFormat: '输入一个整数 n (0 <= n <= 40)',
      outputFormat: '输出 F(n) 的值',
      examples: [
        { input: '0', output: '0' },
        { input: '1', output: '1' },
        { input: '10', output: '55', explanation: 'F(10) = 55' },
      ],
      hints: [
        '可以使用递归，但要注意效率',
        '建议使用迭代或动态规划',
        'n 的范围是 0 到 40，结果不会溢出 int',
      ],
      difficulty: 'EASY',
      timeLimitMs: 1000,
      memoryLimitMB: 128,
      testCaseCount: 5,
    });
    await problem3.setTags([tag3, tag5]);
    console.log('Created problem: 斐波那契数列');
    
    const problem4 = await Problem.create({
      title: '字符串反转',
      slug: 'reverse-string',
      description: '将输入的字符串反转后输出。',
      inputFormat: '输入一行字符串（可能包含空格）',
      outputFormat: '输出反转后的字符串',
      examples: [
        { input: 'Hello', output: 'olleH' },
        { input: 'ABCD', output: 'DCBA' },
      ],
      hints: [
        '可以从后往前遍历字符串',
        '使用双指针法',
        '注意空格也需要保留',
      ],
      difficulty: 'EASY',
      timeLimitMs: 1000,
      memoryLimitMB: 128,
      testCaseCount: 3,
    });
    await problem4.setTags([tag2, tag4]);
    console.log('Created problem: 字符串反转');
    
    const problem5 = await Problem.create({
      title: '最大子数组和',
      slug: 'maximum-subarray',
      description: '给定一个整数数组 nums ，找到一个具有最大和的连续子数组（子数组最少包含一个元素），返回其最大和。',
      inputFormat: '第一行输入数组长度 n\n第二行输入 n 个整数',
      outputFormat: '输出最大子数组的和',
      examples: [
        { input: '9\n-2 1 -3 4 -1 2 1 -5 4', output: '6', explanation: '连续子数组 [4,-1,2,1] 的和最大，为 6' },
        { input: '1\n1', output: '1' },
      ],
      hints: [
        '使用 Kadane 算法',
        '可以使用动态规划',
        '时间复杂度 O(n)',
      ],
      difficulty: 'MEDIUM',
      timeLimitMs: 1000,
      memoryLimitMB: 128,
      testCaseCount: 4,
    });
    await problem5.setTags([tag1, tag5]);
    console.log('Created problem: 最大子数组和');
    
    console.log('\nSeed completed successfully!');
    console.log('\nLogin credentials:');
    console.log('  Admin: admin / admin123');
    console.log('  User:  testuser / test123456');
    
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

seedData();
