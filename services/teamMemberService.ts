import { supabase } from './supabaseClient';
import { TeamMember, DatabaseTeamMember } from '../types';
import { RealtimeChannel } from '@supabase/supabase-js';
import { createErrorMessage } from './errorHandler';

/**
 * 将数据库格式转换为应用层的 TeamMember
 */
const databaseToTeamMember = (dbMember: DatabaseTeamMember): TeamMember => {
  return {
    id: dbMember.id,
    name: dbMember.name,
    role: dbMember.role,
    avatar: dbMember.avatar || '',
  };
};

/**
 * 从数据库获取所有团队成员
 */
export const fetchTeamMembers = async (): Promise<TeamMember[]> => {
  try {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching team members:', error);
      throw new Error(createErrorMessage(error, 'en', 'fetchTeamMembers'));
    }

    return (data || []).map(databaseToTeamMember);
  } catch (error) {
    console.error('Exception fetching team members:', error);
    throw error; // Re-throw to let caller handle
  }
};

/**
 * 根据ID获取团队成员
 */
export const getTeamMemberById = async (id: string): Promise<TeamMember | null> => {
  try {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Error fetching team member:', error);
      return null;
    }

    return databaseToTeamMember(data);
  } catch (error) {
    console.error('Exception fetching team member:', error);
    return null;
  }
};

let teamMembersChannel: RealtimeChannel | null = null;

/**
 * 实时订阅团队成员变更
 */
export const subscribeToTeamMembers = (callback: (members: TeamMember[]) => void): (() => void) => {
  // 取消现有订阅
  if (teamMembersChannel) {
    supabase.removeChannel(teamMembersChannel);
  }

  // 订阅 team_members 表的变更
  teamMembersChannel = supabase
    .channel('team_members_changes')
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'team_members',
      },
      async () => {
        console.log('Team members change detected');
        // 重新获取所有团队成员
        const members = await fetchTeamMembers();
        callback(members);
      }
    )
    .subscribe();

  // 返回取消订阅的函数
  return () => {
    if (teamMembersChannel) {
      supabase.removeChannel(teamMembersChannel);
      teamMembersChannel = null;
    }
  };
};

/**
 * 取消团队成员订阅
 */
export const unsubscribeFromTeamMembers = (): void => {
  if (teamMembersChannel) {
    supabase.removeChannel(teamMembersChannel);
    teamMembersChannel = null;
  }
};

