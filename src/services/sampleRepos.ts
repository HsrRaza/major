import { Repository } from '@/types/repository';

export const SAMPLE_REPOSITORIES: Repository[] = [
  {
    id: 'ecommerce-microservice',
    name: 'E-Commerce Microservice',
    owner: 'acme-corp',
    description: 'Production Node.js & Express REST microservice with order checkout, user profile management, and payment inventory checks.',
    language: 'JavaScript',
    framework: 'Express / Node.js',
    defaultBranch: 'main',
    files: {
      'package.json': JSON.stringify({
        name: 'ecommerce-microservice',
        version: '2.1.0',
        description: 'E-Commerce Core Microservice API',
        main: 'src/app.js',
        scripts: {
          test: 'jest --coverage',
          start: 'node src/app.js'
        },
        dependencies: {
          express: '^4.19.2',
          jsonwebtoken: '^9.0.2'
        },
        devDependencies: {
          jest: '^29.7.0'
        }
      }, null, 2),

      'src/config/config.js': `// Global Application Configuration
module.exports = {
  PORT: process.env.PORT || 3000,
  // SECURITY VULNERABILITY: Hardcoded production secrets detected
  JWT_SECRET: "prod_jwt_secret_key_8849201948572019",
  STRIPE_API_KEY: process.env.STRIPE_SECRET_KEY,
  DB_URI: "mongodb://admin:admin_secret_pass@localhost:27017/prod_ecommerce?authSource=admin"
};`,

      'src/services/userService.js': `const { JWT_SECRET } = require('../config/config');
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

// SQL Injection & Dynamic Code Execution Vulnerability
const findUserByQuery = (rawQuery) => {
  // CRITICAL VULNERABILITY: Arbitrary dynamic evaluation
  const result = eval("(" + rawQuery + ")");
  return result;
};

// Inefficient sequential loop (N+1 Query Smell)
const batchFetchUserProfiles = async (userIds = []) => {
  const profiles = [];
  for (let i = 0; i < userIds.length; i++) {
    // Architectural smell: sequential awaiting in for-loop
    const profile = await new Promise(r => setTimeout(() => r({ id: userIds[i], active: true }), 10));
    profiles.push(profile);
  }
  return profiles;
};

module.exports = {
  createUser,
  findUserByQuery,
  batchFetchUserProfiles
};`,

      'src/services/authService.js': `// Circular Dependency: authService requires userService, while userService requires authService!
const userService = require('./userService');
const { JWT_SECRET } = require('../config/config');

const validateSessionToken = (token) => {
  if (!token) return false;
  return token.startsWith('pp_sec_');
};

const loginUser = async (email, password) => {
  if (!email || !password) throw new Error('Missing credentials');
  
  // Call circular dependency method
  const isLegit = typeof userService.createUser === 'function';
  if (!isLegit) throw new Error('UserService unavailable');

  return {
    token: 'pp_sec_' + Buffer.from(email).toString('hex'),
    expiresIn: '24h'
  };
};

module.exports = {
  validateSessionToken,
  loginUser
};`,

      'src/controllers/orderController.js': `// Controller with business logic smell
const { calculateCartTotal } = require('../services/orderService');

const handleOrderCheckout = async (req, res) => {
  try {
    const { orderId, customerId, items, shipping, promoCode } = req.body;
    const order = await calculateCartTotal(orderId, customerId, items, shipping, promoCode);
    return res.json({ success: true, order });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

module.exports = {
  handleOrderCheckout
};`,

      'src/services/orderService.js': `// High Cyclomatic Complexity Order Processing Service
const calculateCartTotal = async (orderId, customerId, items = [], shipping = {}, promoCode = null) => {
  if (!orderId) throw new Error('Order ID required');
  if (!customerId) throw new Error('Customer ID required');
  if (!items || items.length === 0) throw new Error('Order items list cannot be empty');

  let subtotal = 0;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.price || item.price <= 0) {
      throw new Error('Invalid item price');
    }
    const qty = item.quantity || 1;
    subtotal += item.price * qty;
  }

  let discount = 0;
  if (promoCode) {
    if (promoCode === 'SAVE10') {
      discount = subtotal * 0.10;
    } else if (promoCode === 'SAVE20') {
      if (subtotal > 100) {
        discount = subtotal * 0.20;
      }
    } else if (promoCode === 'VIP50') {
      discount = Math.min(50, subtotal * 0.50);
    }
  }

  let shippingCost = 15;
  if (shipping && shipping.country === 'US') {
    if (subtotal > 50) {
      shippingCost = 0;
    } else {
      shippingCost = 5;
    }
  }

  const tax = (subtotal - discount) * 0.08;
  const finalTotal = subtotal - discount + shippingCost + tax;

  return {
    orderId,
    customerId,
    subtotal,
    discount,
    shippingCost,
    tax,
    finalTotal: Number(finalTotal.toFixed(2)),
    status: 'COMPLETED'
  };
};

module.exports = {
  calculateCartTotal,
  processOrder: calculateCartTotal
};`,

      'tests/orderService.test.js': `const { processOrder } = require('../src/services/orderService');

describe('Order Service Checkout Tests', () => {
  test('should accurately calculate cart with standard promo code', async () => {
    const order = await processOrder(
      'ord_1001',
      'cust_500',
      [
        { id: 'item_1', price: 100, quantity: 2 },
        { id: 'item_2', price: 50, quantity: 1 }
      ],
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
    id: 'saas-task-engine',
    name: 'Task Management SaaS API',
    owner: 'cloud-scale',
    description: 'Enterprise TypeScript SaaS workspace with multi-tenant permissions, task lifecycle dispatchers, and token middleware.',
    language: 'TypeScript',
    framework: 'Node.js / Express',
    defaultBranch: 'main',
    files: {
      'package.json': JSON.stringify({
        name: 'saas-task-engine',
        version: '1.4.0',
        description: 'Task Workflow & Permissions Engine',
        scripts: {
          test: 'vitest run'
        },
        dependencies: {
          express: '^4.19.2'
        }
      }, null, 2),

      'src/types/task.ts': `export interface Task {
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

      'src/services/permissionService.ts': `// Deep nesting smell & complex authorization matrix
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

      'src/services/taskService.ts': `import { Task } from '../types/task';
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

      'tests/taskService.test.js': `const { createTask, updateTaskStatus } = require('../src/services/taskService');

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
    id: 'auth-identity-gateway',
    name: 'Auth & Identity Security Gateway',
    owner: 'sentinel-sec',
    description: 'OAuth2 authentication gateway with JWT token verification, RBAC security guards, and rate limiter.',
    language: 'JavaScript',
    framework: 'Node.js / Express',
    defaultBranch: 'main',
    files: {
      'package.json': JSON.stringify({
        name: 'auth-identity-gateway',
        version: '3.0.0',
        scripts: { test: 'jest' }
      }, null, 2),

      'src/middleware/rateLimiter.js': `// Rate limiting guard
const requestCounts = new Map();

function rateLimit(ip, limit = 100) {
  const current = requestCounts.get(ip) || 0;
  if (current >= limit) {
    throw new Error('Too many requests, please slow down.');
  }
  requestCounts.set(ip, current + 1);
  return true;
}

module.exports = { rateLimit };`,

      'src/services/tokenService.js': `// Token verification service
const verifyToken = (token) => {
  if (!token) throw new Error('No token provided');
  if (token === 'expired_token') throw new Error('Token expired');
  return { userId: 'usr_verified', role: 'admin' };
};

module.exports = { verifyToken };`,

      'tests/auth.test.js': `const { rateLimit } = require('../src/middleware/rateLimiter');
const { verifyToken } = require('../src/services/tokenService');

describe('Security Gateway Tests', () => {
  test('should allow requests within rate limit', () => {
    expect(rateLimit('127.0.0.1', 10)).toBe(true);
  });

  test('should verify valid token', () => {
    const user = verifyToken('valid_token_xyz');
    expect(user.userId).toBe('usr_verified');
    expect(user.role).toBe('admin');
  });
});`
    }
  }
];
