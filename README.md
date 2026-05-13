# Solo Online Judge (SoloOJ)

一个现代化的在线代码评测系统，类似 LeetCode / Codeforces。

## 功能特性

### V1 - 题目浏览与代码提交

- **用户模块**
  - 用户注册（用户名 + 邮箱 + 密码）
  - 用户登录（JWT Token）
  - 用户信息管理（头像、昵称、个人简介）

- **题目模块**
  - 题目列表（分页、按难度筛选、按标签筛选）
  - 题目详情（题目描述、输入输出格式、样例、提示、时间/空间限制）
  - 题目搜索（按标题模糊搜索）
  - 题目标签（数组、链表、动态规划等）

- **代码提交与评测**
  - 在线代码编辑器（Monaco Editor，支持 C/C++/Java/Python/JavaScript）
  - 提交代码
  - 评测结果（Accepted / Wrong Answer / Time Limit Exceeded / Memory Limit Exceeded / Runtime Error / Compilation Error）
  - 评测详情（每个测试用例的结果、运行时间、内存使用）
  - 提交记录列表（按用户、题目筛选）

- **评测引擎**
  - 编译代码（各语言编译命令）
  - 运行代码（输入测试数据，捕获输出）
  - 对比输出（与预期输出逐行对比）
  - 时间限制检测
  - 内存限制检测
  - Docker 沙箱隔离

## 技术栈

### 后端
- Node.js + Express
- PostgreSQL + Sequelize ORM
- Redis + Bull Queue（评测队列）
- Dockerode（容器管理）
- JWT（认证）
- bcryptjs（密码加密）

### 前端
- React 18 + TypeScript
- Vite
- React Router
- Monaco Editor
- Axios
- Tailwind CSS

### 基础服务
- PostgreSQL 15
- Redis 7
- Docker（代码沙箱）

## 快速开始

### 环境要求
- Node.js >= 18
- Docker >= 20.10
- Docker Compose >= 2.0

### 1. 启动基础服务

```bash
docker-compose up -d
```

这将启动 PostgreSQL 和 Redis。

### 2. 安装后端依赖

```bash
cd backend
npm install
cp .env.example .env
```

### 3. 安装前端依赖

```bash
cd frontend
npm install
```

### 4. 启动后端服务

在 `backend` 目录下：

```bash
# 启动 API 服务器
npm run dev

# 启动评测 Worker（在另一个终端）
npm run worker
```

### 5. 启动前端服务

在 `frontend` 目录下：

```bash
npm run dev
```

前端将在 http://localhost:5173 运行。

## 添加示例题目

### 1. 登录管理员账户

首先需要创建一个管理员用户，可以通过直接修改数据库或使用 API：

```bash
# 在 PostgreSQL 中将某个用户设为管理员
docker exec -it solo-oj-postgres psql -U postgres -d solo_oj -c "UPDATE users SET \"isAdmin\" = true WHERE username = 'your_username';"
```

### 2. 添加题目

使用管理员账户调用 API 创建题目：

```bash
POST http://localhost:5000/api/problems
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "title": "A + B Problem",
  "description": "计算两个整数的和。",
  "inputFormat": "输入包含多组数据，每组数据包含两个整数 a 和 b。",
  "outputFormat": "对于每组数据，输出 a + b 的结果。",
  "examples": [
    {
      "input": "1 2\n3 4",
      "output": "3\n7"
    }
  ],
  "hints": ["使用循环读取输入直到 EOF"],
  "difficulty": "EASY",
  "timeLimitMs": 1000,
  "memoryLimitMB": 128,
  "tags": ["数组", "简单"]
}
```

### 3. 添加测试数据

在 `backend/test-data/inputs/<problem-id>/` 和 `backend/test-data/outputs/<problem-id>/` 目录下放置测试数据文件：

```
backend/test-data/
├── inputs/
│   └── <problem-id>/
│       ├── 1.in
│       ├── 2.in
│       └── 3.in
└── outputs/
    └── <problem-id>/
        ├── 1.out
        ├── 2.out
        └── 3.out
```

## 支持的编程语言

| 语言 | 版本 | 编译/运行 |
|------|------|-----------|
| C++ | GCC 13.2 | g++ -O2 |
| C | GCC 13.2 | gcc -O2 |
| Java | OpenJDK 17 | javac + java |
| Python | Python 3.11 | python3 |
| JavaScript | Node.js 20 | node |

## 评测状态说明

| 状态 | 说明 |
|------|------|
| PENDING | 排队中，等待评测 |
| RUNNING | 评测中 |
| ACCEPTED | 通过，所有测试用例正确 |
| WRONG_ANSWER | 答案错误，输出与预期不符 |
| TIME_LIMIT_EXCEEDED | 超时，超出时间限制 |
| MEMORY_LIMIT_EXCEEDED | 内存超限，超出内存限制 |
| RUNTIME_ERROR | 运行时错误 |
| COMPILATION_ERROR | 编译错误 |
| SYSTEM_ERROR | 系统错误 |

## 项目结构

```
solo-oj/
├── backend/                    # 后端服务
│   ├── src/
│   │   ├── config/            # 配置文件
│   │   ├── controllers/       # 控制器
│   │   ├── middlewares/       # 中间件
│   │   ├── models/            # 数据模型
│   │   ├── routes/            # 路由
│   │   ├── services/          # 服务层（评测引擎）
│   │   ├── utils/             # 工具函数
│   │   ├── workers/           # 评测 Worker
│   │   ├── app.js             # Express 应用
│   │   └── server.js          # 服务器入口
│   ├── test-data/             # 测试数据
│   │   ├── inputs/
│   │   └── outputs/
│   ├── package.json
│   └── .env.example
├── frontend/                   # 前端应用
│   ├── src/
│   │   ├── components/        # 组件
│   │   ├── context/           # React Context
│   │   ├── hooks/             # 自定义 Hooks
│   │   ├── pages/             # 页面组件
│   │   ├── services/          # API 服务
│   │   ├── types/             # TypeScript 类型
│   │   ├── utils/             # 工具函数
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml         # 基础服务配置
└── README.md
```

## API 文档

### 认证接口

#### POST /api/auth/register
注册新用户
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

#### POST /api/auth/login
用户登录
```json
{
  "login": "string",
  "password": "string"
}
```

#### GET /api/auth/me
获取当前用户信息（需要认证）

#### PUT /api/auth/profile
更新用户信息（需要认证）

### 题目接口

#### GET /api/problems
获取题目列表，支持查询参数：
- `page` - 页码
- `limit` - 每页数量
- `difficulty` - 难度筛选 (EASY/MEDIUM/HARD)
- `tag` - 标签筛选
- `search` - 关键词搜索

#### GET /api/problems/:slug
获取题目详情

#### GET /api/problems/tags
获取所有标签

#### POST /api/problems
创建题目（需要管理员权限）

### 提交接口

#### POST /api/submissions
提交代码（需要认证）
```json
{
  "problemId": "string",
  "code": "string",
  "language": "cpp|c|java|python|javascript"
}
```

#### GET /api/submissions/me
获取当前用户的提交记录（需要认证）

#### GET /api/submissions/:id
获取提交详情（需要认证）

## License

MIT
