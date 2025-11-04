/**
 * 认证系统
 * 简化版session-based认证，复用arizon-one-v3逻辑
 */

import { cookies } from 'next/headers';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { query } from './db';

// ========================================
// 用户接口
// ========================================

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  department?: string;
  language: string;
}

export interface Session {
  userId: number;
  username: string;
  role: string;
}

// ========================================
// 密码处理
// ========================================

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ========================================
// Session管理
// ========================================

export async function createSession(userId: number): Promise<string> {
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7天过期

  await query(
    `INSERT INTO sop_sessions (user_id, session_token, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, sessionToken, expiresAt]
  );

  return sessionToken;
}

export async function getSession(token: string): Promise<Session | null> {
  const result = await query(
    `SELECT u.id, u.username, u.role
     FROM sop_sessions s
     JOIN sop_users u ON s.user_id = u.id
     WHERE s.session_token = $1 AND s.expires_at > NOW() AND u.active = true`,
    [token]
  );
  
  if (result.rows.length === 0) return null;
  
  return {
    userId: result.rows[0].id,
    username: result.rows[0].username,
    role: result.rows[0].role,
  };
}

export async function deleteSession(token: string): Promise<void> {
  await query(`DELETE FROM sop_sessions WHERE session_token = $1`, [token]);
}

// ========================================
// Cookie管理
// ========================================

export async function getSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get('sop_session')?.value;
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set('sop_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7天
    path: '/',
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('sop_session');
}

// ========================================
// 认证检查
// ========================================

export async function getCurrentUser(): Promise<User | null> {
  const token = await getSessionToken();
  if (!token) return null;
  
  const session = await getSession(token);
  if (!session) return null;
  
  const result = await query(
    `SELECT id, username, email, role, department, language
     FROM sop_users
     WHERE id = $1 AND active = true`,
    [session.userId]
  );
  
  if (result.rows.length === 0) return null;
  
  return result.rows[0];
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireAuth();
  
  if (user.role !== 'admin') {
    throw new Error('Insufficient permissions - Admin only');
  }
  
  return user;
}

// ========================================
// 用户登录
// ========================================

export async function loginUser(email: string, password: string): Promise<User | null> {
  const result = await query(
    `SELECT id, username, email, password_hash, role, department, language
     FROM sop_users
     WHERE email = $1 AND active = true`,
    [email]
  );
  
  if (result.rows.length === 0) return null;
  
  const user = result.rows[0];
  const isValid = await verifyPassword(password, user.password_hash);
  
  if (!isValid) return null;
  
  // 创建session并设置cookie
  const sessionToken = await createSession(user.id);
  await setSessionCookie(sessionToken);
  
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    department: user.department,
    language: user.language,
  };
}

// ========================================
// 用户登出
// ========================================

export async function logoutUser(): Promise<void> {
  const token = await getSessionToken();
  if (token) {
    await deleteSession(token);
  }
  await clearSessionCookie();
}

