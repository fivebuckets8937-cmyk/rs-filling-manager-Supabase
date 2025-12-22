import { TeamMember } from '../types';

export interface User {
  id: string;
  username: string;
  password: string; // 实际项目中应该使用哈希
  memberId: string; // 关联到 TeamMember
  createdAt: string;
  lastLogin?: string;
}

// 简单的用户数据库（实际项目中应使用后端API）
const USERS_DB_KEY = 'rs_users_db';
const CURRENT_USER_KEY = 'rs_current_user';

/**
 * 初始化默认用户（如果不存在）
 */
export const initializeDefaultUsers = (teamMembers: TeamMember[]): void => {
  const existing = localStorage.getItem(USERS_DB_KEY);
  if (existing) return;

  // 为每个团队成员创建默认账户
  const defaultUsers: User[] = teamMembers.map((member, index) => ({
    id: `user_${member.id}`,
    username: member.name.toLowerCase().replace(/\s+/g, ''),
    password: '123456', // 默认密码
    memberId: member.id,
    createdAt: new Date().toISOString(),
  }));

  localStorage.setItem(USERS_DB_KEY, JSON.stringify(defaultUsers));
};

/**
 * 获取所有用户
 */
export const getAllUsers = (): User[] => {
  const data = localStorage.getItem(USERS_DB_KEY);
  return data ? JSON.parse(data) : [];
};

/**
 * 根据用户名查找用户
 */
export const findUserByUsername = (username: string): User | null => {
  const users = getAllUsers();
  return users.find(u => u.username === username) || null;
};

/**
 * 验证用户登录
 */
export const login = (username: string, password: string): User | null => {
  const user = findUserByUsername(username);
  if (!user || user.password !== password) {
    return null;
  }

  // 更新最后登录时间
  const users = getAllUsers();
  const updatedUsers = users.map(u => 
    u.id === user.id 
      ? { ...u, lastLogin: new Date().toISOString() }
      : u
  );
  localStorage.setItem(USERS_DB_KEY, JSON.stringify(updatedUsers));

  // 保存当前登录用户
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return { ...user, lastLogin: new Date().toISOString() };
};

/**
 * 登出
 */
export const logout = (): void => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

/**
 * 获取当前登录用户
 */
export const getCurrentUser = (): User | null => {
  const data = localStorage.getItem(CURRENT_USER_KEY);
  return data ? JSON.parse(data) : null;
};

/**
 * 检查是否已登录
 */
export const isAuthenticated = (): boolean => {
  return getCurrentUser() !== null;
};

/**
 * 创建新用户（管理员功能）
 */
export const createUser = (username: string, password: string, memberId: string): User | null => {
  const users = getAllUsers();
  
  // 检查用户名是否已存在
  if (users.find(u => u.username === username)) {
    return null;
  }

  const newUser: User = {
    id: `user_${Date.now()}`,
    username,
    password,
    memberId,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
  return newUser;
};

