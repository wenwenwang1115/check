import { Router } from 'itty-router';
import { users } from '../src/data/mockData';
import { User } from '../src/types';

export interface Env {
  // 可以在这里定义 Workers 绑定
}

const router = Router();

router.get('/api/health', () => {
  return new Response(JSON.stringify({ success: true, message: 'ok' }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

router.post('/api/auth/login', async (request: Request) => {
  try {
    const { username, password } = await request.json();

    if (username === 'admin' && password === 'admin123') {
      const adminUser: User = {
        id: 'admin',
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin',
        createdAt: new Date(),
        isActive: true,
      };
      return new Response(JSON.stringify({ success: true, user: adminUser }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = users.find(u => u.username === username && u.role === 'user');
    if (user) {
      return new Response(JSON.stringify({ success: true, user }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: false, message: '用户名或密码错误' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: '请求解析失败' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

router.post('/api/auth/register', async (request: Request) => {
  try {
    const { username, password, inviteCode } = await request.json();

    if (!inviteCode || inviteCode !== 'INVITE2026') {
      return new Response(JSON.stringify({ success: false, message: '邀请码无效' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const newUser: User = {
      id: `user${Date.now()}`,
      username,
      email: `${username}@example.com`,
      role: 'user',
      createdAt: new Date(),
      isActive: true,
    };

    return new Response(JSON.stringify({ success: true, user: newUser }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: '请求解析失败' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

router.all('*', () => {
  return new Response(JSON.stringify({ success: false, error: 'API not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
});

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return router.handle(request, env, ctx);
  },
};
