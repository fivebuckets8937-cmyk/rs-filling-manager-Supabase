import { supabase } from './supabaseClient';
import { DatabaseTeamMember, TeamMember } from '../types';
import { logger } from '../utils/logger';

export interface AuthUser {
  id: string;
  email: string;
  teamMember: DatabaseTeamMember | null;
}

/**
 * 使用邮箱和密码登录
 */
export const login = async (email: string, password: string): Promise<AuthUser | null> => {
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      logger.error('登录失败', authError as Error, { email });
      return null;
    }

    // 获取关联的 team_member 信息
    const { data: teamMember, error: memberError } = await supabase
      .from('team_members')
      .select('*')
      .eq('user_id', authData.user.id)
      .single();

    if (memberError) {
      logger.warn('获取团队成员信息失败', { error: memberError, userId: authData.user.id });
      // 即使没有 team_member 也允许登录，但 teamMember 为 null
    }

    return {
      id: authData.user.id,
      email: authData.user.email || email,
      teamMember: teamMember || null,
    };
  } catch (error) {
    logger.error('登录异常', error as Error, { email });
    return null;
  }
};

/**
 * 使用邮箱和密码注册新用户
 */
export const signUp = async (
  email: string,
  password: string,
  name: string,
  role: 'MANAGER' | 'MEMBER' = 'MEMBER'
): Promise<AuthUser | null> => {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      logger.error('注册失败', authError as Error, { email });
      return null;
    }

    // 创建 team_member 记录
    const { data: teamMember, error: memberError } = await supabase
      .from('team_members')
      .insert({
        user_id: authData.user.id,
        name,
        role,
        avatar: null,
      })
      .select()
      .single();

    if (memberError) {
      logger.error('创建团队成员记录失败', memberError as Error, { userId: authData.user.id, name, role });
      return null;
    }

    return {
      id: authData.user.id,
      email: authData.user.email || email,
      teamMember: teamMember,
    };
  } catch (error) {
    logger.error('注册异常', error as Error, { email, name });
    return null;
  }
};

/**
 * 登出
 */
export const logout = async (): Promise<void> => {
  await supabase.auth.signOut();
};

/**
 * 获取当前登录用户
 */
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    logger.debug('开始获取当前用户');
    let timedOut = false;
    const timeoutMs = 15000; // 15秒超时
    
    // 添加超时保护，但超时后等待实际结果（避免误判）
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        timedOut = true;
        reject(new Error('getUser 超时：请检查网络连接'));
      }, timeoutMs);
    });

    const userPromise = supabase.auth.getUser();
    let userResult: { data: { user: any }, error: any };
    
    try {
      userResult = await Promise.race([userPromise, timeoutPromise]);
    } catch (timeoutError: any) {
      // 超时后，等待实际结果
      if (timedOut && timeoutError?.message?.includes('超时')) {
        logger.warn('getUser 超时，等待实际结果');
        // 等待实际结果（最多再等10秒）
        try {
          userResult = await Promise.race([
            userPromise,
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('getUser 最终超时')), 10000))
          ]);
        } catch (finalError: any) {
          logger.error('getUser 最终超时', finalError as Error);
          return null;
        }
      } else {
        throw timeoutError;
      }
    }

    const { data: { user }, error: userError } = userResult;

    if (userError || !user) {
      logger.error('获取当前用户失败', userError as Error);
      return null;
    }

    logger.info('获取当前用户成功', { userId: user.id, email: user.email });

    // 获取关联的 team_member 信息（也添加超时）
    try {
      const memberTimeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('获取团队成员信息超时'));
        }, 5000);
      });

      const memberPromise = supabase
        .from('team_members')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const { data: teamMember, error: memberError } = await Promise.race([
        memberPromise,
        memberTimeoutPromise
      ]);

      if (memberError) {
        logger.warn('获取团队成员信息失败', { error: memberError, userId: user.id });
        // 即使没有 team_member 也返回用户信息，但 teamMember 为 null
      } else {
        logger.debug('团队成员信息获取成功', { teamMemberName: teamMember?.name });
      }

      return {
        id: user.id,
        email: user.email || '',
        teamMember: teamMember || null,
      };
    } catch (memberError: any) {
      logger.error('获取团队成员信息异常', memberError as Error, { userId: user.id });
      // 即使获取团队成员失败，也返回用户基本信息
      return {
        id: user.id,
        email: user.email || '',
        teamMember: null,
      };
    }
  } catch (error: any) {
    logger.error('获取当前用户异常', error as Error);
    return null;
  }
};

/**
 * 检查是否已登录
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    logger.debug('开始检查认证状态');
    const start = Date.now();
    let timedOut = false;
    const timeoutMs = 15000; // 放宽超时时间，避免误登出
    // 添加超时保护
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        timedOut = true;
        reject(new Error(`getSession 超时（>${timeoutMs}ms）：请检查网络连接`));
      }, timeoutMs);
    });

    const sessionPromise = supabase.auth.getSession();
    let data, error;
    try {
      const result = await Promise.race([sessionPromise, timeoutPromise]);
      // @ts-ignore
      data = result.data;
      // @ts-ignore
      error = result.error;
    } catch (err: any) {
      // 如果是超时，不立刻登出，返回 true 以保留当前会话，等待后续 onAuthStateChange 校正
      if (timedOut) {
        return true; // 假定仍有会话，避免误登出
      }
      throw err;
    }
    
    if (error) {
      logger.error('getSession 错误', error as Error);
      return false;
    }
    
    const hasSession = !!data?.session;
    logger.debug('认证状态检查完成', { hasSession });
    return hasSession;
  } catch (error: any) {
    logger.error('isAuthenticated 异常', error as Error);
    // 如果超时或出错，假设未认证，让用户重新登录
    return false;
  }
};

/**
 * 获取当前用户的 team_member 信息
 */
export const getUserTeamMember = async (): Promise<DatabaseTeamMember | null> => {
  const user = await getCurrentUser();
  return user?.teamMember || null;
};

/**
 * 监听认证状态变化
 */
export const onAuthStateChange = (callback: (user: AuthUser | null) => void) => {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      try {
        const user = await getCurrentUser();
        if (user) {
          // getCurrentUser 成功
          callback(user);
        } else {
          // getCurrentUser 超时返回 null，但 session 存在，使用 session.user 构建基本用户信息
          logger.warn('getCurrentUser 超时，使用 session.user 构建基本用户信息');
          const fallbackUser: AuthUser = {
            id: session.user.id,
            email: session.user.email || '',
            teamMember: null, // 稍后异步获取
          };
          callback(fallbackUser);
          
          // 异步获取 teamMember（不阻塞）
          getCurrentUser().then(fullUser => {
            if (fullUser?.teamMember) {
              // 如果获取到完整的用户信息，再次回调更新
              callback(fullUser);
            }
          }).catch(() => {
            // 忽略异步获取失败
          });
        }
      } catch (err:any) {
        // 如果 getCurrentUser 抛出异常，但 session 存在，仍然使用 session.user
        if (session?.user) {
          logger.warn('getCurrentUser 异常，使用 session.user 构建基本用户信息', { error: err });
          const fallbackUser: AuthUser = {
            id: session.user.id,
            email: session.user.email || '',
            teamMember: null,
          };
          callback(fallbackUser);
        } else {
          callback(null);
        }
      }
    } else {
      callback(null);
    }
  });
};

/**
 * 将 DatabaseTeamMember 转换为 TeamMember（用于兼容现有代码）
 */
export const convertToTeamMember = (dbMember: DatabaseTeamMember): TeamMember => {
  return {
    id: dbMember.id,
    name: dbMember.name,
    role: dbMember.role,
    avatar: dbMember.avatar || '',
  };
};
