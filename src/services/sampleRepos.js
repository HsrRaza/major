// Production Sample Repositories for PatchPilot Platform
// These repositories contain authentic code architectures with real runnable test suites.

export const SAMPLE_REPOSITORIES = [
  {
    id: "ecommerce-microservice",
    name: "E-Commerce Microservice",
    owner: "acme-corp",
    description: "Production Node.js & Express REST microservice with order checkout, user profile management, and payment inventory checks.",
    language: "JavaScript",
    framework: "Express / Node.js",
    defaultBranch: "main",
    files: {
      "package.json": JSON.stringify({
        name: "ecommerce-microservice",
        version: "2.1.0",
        description: "E-Commerce Core Microservice API",
        main: "src/app.js",
        scripts: {
          test: "jest --coverage",
          start: "node src/app.js"
        },
        dependencies: {
          express: "^4.19.2",
          jsonwebtoken: "^9.0.2"
        },
        devDependencies: {
          jest: "^29.7.0"
        }
      }, null, 2),

      "src/config/config.js": `// Global Application Configuration
module.exports = {
  PORT: process.env.PORT || 3000,
  // SECURITY VULNERABILITY: Hardcoded production secrets detected
  JWT_SECRET: "prod_jwt_secret_key_8849201948572019",
  STRIPE_API_KEY: process.env.STRIPE_SECRET_KEY,
  DB_URI: "mongodb://admin:admin_secret_pass@localhost:27017/prod_ecommerce?authSource=admin"
};`,

      "src/services/userService.js": `const { JWT_SECRET } = require('../config/config');
const authService = require('./authService');

// Architectural Debt: High Cyclomatic Complexity, Deep Nesting & Circular Dependency
const createUser = async (userData, options = {}) => {
  if (!userData) {
    throw new Error('User data is missing');
  }
  if (!userData.email) {
    throw new Error('Email is required');
  }
  if (!userData.email.includes('@')) {
    throw new Error('Invalid email format');
  }
  if (!userData.password) {
    throw new Error('Password is required');
  }
  if (userData.password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  // Deeply nested validation block
  if (userData.age && userData.age < 18) {
    if (userData.allowParentalConsent) {
      if (!userData.parentEmail) {
        throw new Error('Parent email required for minors');
      } else {
        if (!userData.parentEmail.includes('@')) {
          throw new Error('Invalid parent email format');
        }
      }
    } else {
      throw new Error('User must be 18 or older');
    }
  }

  // Role assignment logic
  let role = 'customer';
  if (userData.isAdmin) {
    if (options && options.secretAdminToken === 'GRANT_SUPER_ADMIN_KEY') {
      role = 'admin';
    } else {
      throw new Error('Unauthorized admin escalation');
    }
  }

  // Circular Dependency Call: authService imports userService, and userService imports authService!
  const isSessionValid = authService.validateSessionToken(userData.token);
  if (!isSessionValid) {
    console.log('[UserService] Token invalid or unauthenticated session');
  }

  const hashedPassword = Buffer.from(userData.password).toString('base64');
  return {
    id: 'user_' + Math.floor(Math.random() * 90000 + 10000),
    email: userData.email,
    password: hashedPassword,
    role: role,
    createdAt: new Date().toISOString()
  };
};

const deleteUser = async (userId) => {
  if (!userId) throw new Error('User ID is required');
  console.log(\`[UserService] Successfully deleted user \${userId}\`);
  return true;
};

module.exports = { createUser, deleteUser };`,

      "src/services/authService.js": `const userService = require('./userService');

// Circular Dependency: authService directly imports userService back!
const validateSessionToken = (token) => {
  if (!token) return false;
  if (token === 'invalid_expired_token') return false;
  return true;
};

const login = async (email, password) => {
  if (!email || !password) throw new Error('Email and password required');

  // CRITICAL SECURITY VULNERABILITY: SQL Injection via unescaped string concatenation
  const rawQuery = "SELECT * FROM users WHERE email = '" + email + "' AND password = '" + password + "'";
  console.log('[AuthService] Executing query:', rawQuery);

  return {
    success: true,
    token: 'jwt_mock_token_xyz_987'
  };
};

module.exports = { validateSessionToken, login };`,

      "src/services/orderService.js": `// High Cyclomatic Complexity, N+1 Query Loop & Unsafe eval() Execution
const checkStockInDatabase = async (itemId) => {
  // Simulates external inventory database lookup
  return true;
};

const processOrder = async (orderId, customerId, items = [], paymentDetails = {}, shippingAddress = {}, couponCode = '') => {
  if (!items || items.length === 0) {
    throw new Error('Order items list cannot be empty');
  }

  let subtotal = 0;
  let tax = 0;
  let discount = 0;
  let shippingFee = 15.00;

  // PERFORMANCE VULNERABILITY: N+1 sequential async await inside loop
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.quantity <= 0) throw new Error('Invalid item quantity');
    if (item.price < 0) throw new Error('Invalid item price');

    // N+1 network roundtrip for each item
    const inStock = await checkStockInDatabase(item.id);
    if (!inStock) {
      throw new Error('Item ' + item.id + ' is out of stock');
    }

    subtotal += item.price * item.quantity;
  }

  // Nested conditionals for coupon calculation
  if (couponCode) {
    if (couponCode === 'SAVE10') {
      discount = subtotal * 0.10;
    } else if (couponCode === 'SAVE20') {
      discount = subtotal * 0.20;
    } else if (couponCode === 'VIP50') {
      if (subtotal > 200) {
        discount = subtotal * 0.50;
      } else {
        discount = 20.00;
      }
    }
  }

  // Deeply nested shipping and tax regional conditionals
  if (shippingAddress) {
    if (shippingAddress.country === 'US') {
      if (shippingAddress.state === 'CA') {
        tax = subtotal * 0.0825;
      } else if (shippingAddress.state === 'NY') {
        tax = subtotal * 0.08875;
      } else {
        tax = subtotal * 0.05;
      }
    } else if (shippingAddress.country === 'CA') {
      tax = subtotal * 0.13;
    } else {
      tax = subtotal * 0.15;
      shippingFee = 45.00;
    }
  }

  // CRITICAL SECURITY VULNERABILITY: Dangerous dynamic code execution with eval()
  const expr = "(" + subtotal + " + " + tax + " + " + shippingFee + ") - " + discount;
  const verifiedTotal = eval(expr);

  return {
    orderId,
    customerId,
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    shippingFee,
    discount: Math.round(discount * 100) / 100,
    finalTotal: Math.round(verifiedTotal * 100) / 100,
    status: 'COMPLETED'
  };
};

module.exports = { processOrder };`,

      "src/controllers/userController.js": `const userService = require('../services/userService');

const handleCreateUser = async (req, res) => {
  try {
    const user = await userService.createUser(req.body, req.headers);
    return res.status(201).json({ success: true, data: user });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

const handleDeleteUser = async (req, res) => {
  try {
    await userService.deleteUser(req.params.id);
    return res.status(200).json({ success: true, message: 'Deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { handleCreateUser, handleDeleteUser };`,

      "tests/userService.test.js": `const { createUser, deleteUser } = require('../src/services/userService');

describe('User Service Test Suite', () => {
  test('should create standard user successfully', async () => {
    const user = await createUser({
      email: 'john.doe@example.com',
      password: 'strongPassword123'
    });
    expect(user).toHaveProperty('id');
    expect(user.email).toBe('john.doe@example.com');
    expect(user.role).toBe('customer');
  });

  test('should reject user creation when email format is invalid', async () => {
    await expect(createUser({
      email: 'invalid_email_format',
      password: 'password123'
    })).rejects.toThrow('Invalid email format');
  });

  test('should reject user creation when password is shorter than 6 chars', async () => {
    await expect(createUser({
      email: 'alice@example.com',
      password: '123'
    })).rejects.toThrow('Password must be at least 6 characters');
  });

  test('should require parental consent when age is under 18', async () => {
    await expect(createUser({
      email: 'teen@example.com',
      password: 'password123',
      age: 15
    })).rejects.toThrow('User must be 18 or older');
  });

  test('should prevent unauthorized admin escalation without secret token', async () => {
    await expect(createUser({
      email: 'hacker@example.com',
      password: 'password123',
      isAdmin: true
    })).rejects.toThrow('Unauthorized admin escalation');
  });

  test('should delete user given valid user ID', async () => {
    const result = await deleteUser('user_12345');
    expect(result).toBe(true);
  });
});`,

      "tests/orderService.test.js": `const { processOrder } = require('../src/services/orderService');

describe('Order Service Test Suite', () => {
  test('should calculate order subtotal and California tax correctly', async () => {
    const order = await processOrder(
      'ord_1001',
      'cust_500',
      [
        { id: 'item_1', price: 100, quantity: 2 },
        { id: 'item_2', price: 50, quantity: 1 }
      ],
      { method: 'card' },
      { country: 'US', state: 'CA' },
      'SAVE10'
    );

    expect(order.orderId).toBe('ord_1001');
    expect(order.subtotal).toBe(250);
    expect(order.discount).toBe(25);
    expect(order.status).toBe('COMPLETED');
    expect(order.finalTotal).toBeGreaterThan(0);
  });

  test('should throw error when items array is empty', async () => {
    await expect(processOrder(
      'ord_1002',
      'cust_501',
      []
    )).rejects.toThrow('Order items list cannot be empty');
  });

  test('should reject order with negative item price', async () => {
    await expect(processOrder(
      'ord_1003',
      'cust_502',
      [{ id: 'item_x', price: -20, quantity: 1 }]
    )).rejects.toThrow('Invalid item price');
  });
});`
    }
  },

  {
    id: "saas-task-engine",
    name: "Task Management SaaS API",
    owner: "cloud-scale",
    description: "Enterprise TypeScript SaaS workspace with multi-tenant permissions, task lifecycle dispatchers, and token middleware.",
    language: "TypeScript",
    framework: "Node.js / Express",
    defaultBranch: "main",
    files: {
      "package.json": JSON.stringify({
        name: "saas-task-engine",
        version: "1.4.0",
        description: "Task Workflow & Permissions Engine",
        scripts: {
          test: "vitest run"
        },
        dependencies: {
          express: "^4.19.2"
        }
      }, null, 2),

      "src/types/task.ts": `export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE';
  assigneeId?: string;
  dueDate: string;
  tags: string[];
}

export interface UserRole {
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  organizationId: string;
}`,

      "src/services/permissionService.ts": `// Deep nesting smell & complex authorization matrix
export function canUserManageTask(user: any, task: any, action: string): boolean {
  if (user) {
    if (user.isActive) {
      if (user.role === 'OWNER' || user.role === 'ADMIN') {
        return true;
      } else {
        if (user.role === 'MEMBER') {
          if (task && task.assigneeId === user.userId) {
            if (action === 'UPDATE_STATUS' || action === 'ADD_COMMENT') {
              return true;
            }
          }
        }
      }
    }
  }
  return false;
}`,

      "src/services/taskService.ts": `import { Task } from '../types/task';
import { canUserManageTask } from './permissionService';

const taskDatabase = new Map<string, Task>();

export async function createTask(user: any, taskData: Partial<Task>): Promise<Task> {
  if (!taskData.title || taskData.title.trim().length === 0) {
    throw new Error('Task title cannot be empty');
  }

  const task: Task = {
    id: 'task_' + Date.now(),
    title: taskData.title.trim(),
    description: taskData.description || '',
    priority: taskData.priority || 'MEDIUM',
    status: 'PENDING',
    assigneeId: taskData.assigneeId,
    dueDate: taskData.dueDate || new Date().toISOString(),
    tags: taskData.tags || []
  };

  taskDatabase.set(task.id, task);
  return task;
}

export async function updateTaskStatus(user: any, taskId: string, newStatus: 'PENDING' | 'IN_PROGRESS' | 'DONE'): Promise<Task> {
  const task = taskDatabase.get(taskId);
  if (!task) throw new Error('Task not found: ' + taskId);

  const allowed = canUserManageTask(user, task, 'UPDATE_STATUS');
  if (!allowed) throw new Error('Forbidden: User lacks permission to update task status');

  task.status = newStatus;
  taskDatabase.set(taskId, task);
  return task;
}`,

      "tests/taskService.test.js": `const { createTask, updateTaskStatus } = require('../src/services/taskService');

describe('Task Engine Service Tests', () => {
  test('should create new task with default status PENDING', async () => {
    const user = { userId: 'u_1', role: 'MEMBER', isActive: true };
    const task = await createTask(user, { title: 'Implement OAuth Login', priority: 'HIGH' });
    expect(task).toHaveProperty('id');
    expect(task.title).toBe('Implement OAuth Login');
    expect(task.status).toBe('PENDING');
  });

  test('should reject creation when title is empty', async () => {
    const user = { userId: 'u_1', role: 'MEMBER', isActive: true };
    await expect(createTask(user, { title: '' })).rejects.toThrow('Task title cannot be empty');
  });
});`
    }
  },

  {
    id: "auth-identity-gateway",
    name: "Auth & Identity Security Gateway",
    owner: "sentinel-sec",
    description: "OAuth2 authentication gateway with JWT token verification, RBAC security guards, and rate limiter.",
    language: "JavaScript",
    framework: "Node.js / Express",
    defaultBranch: "main",
    files: {
      "package.json": JSON.stringify({
        name: "auth-identity-gateway",
        version: "3.0.0",
        scripts: { test: "jest" }
      }, null, 2),

      "src/gateway/tokenVerifier.js": `const JWT_SECRET = 'sentinel_secret_key_88392019485720';

function verifyTokenUnsafely(token) {
  if (!token) throw new Error('Token required');
  // Security Smell: Missing expiry verification and algorithm whitelist
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Malformed JWT token');
  return JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
}

module.exports = { verifyTokenUnsafely };`,

      "src/gateway/rateLimiter.js": `const requestCounts = new Map();

function isRateLimited(ipAddress, maxRequests = 100, windowMs = 60000) {
  const now = Date.now();
  const record = requestCounts.get(ipAddress) || { count: 0, resetTime: now + windowMs };

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
  } else {
    record.count += 1;
  }

  requestCounts.set(ipAddress, record);
  return record.count > maxRequests;
}

module.exports = { isRateLimited };`,

      "tests/rateLimiter.test.js": `const { isRateLimited } = require('../src/gateway/rateLimiter');

describe('Rate Limiter Gateway Tests', () => {
  test('should allow requests within threshold', () => {
    expect(isRateLimited('192.168.1.1', 5)).toBe(false);
    expect(isRateLimited('192.168.1.1', 5)).toBe(false);
  });

  test('should block requests exceeding threshold', () => {
    const ip = '10.0.0.99';
    for (let i = 0; i < 5; i++) isRateLimited(ip, 5);
    expect(isRateLimited(ip, 5)).toBe(true);
  });
});`
    }
  }
];
