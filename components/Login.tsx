import React, { useState, useEffect } from 'react';
import { UserCircle, Lock, AlertCircle } from 'lucide-react';
import { login, initializeDefaultUsers, getAllUsers } from '../services/authService';
import { TEAM_MEMBERS } from '../constants';
import { TRANSLATIONS } from '../constants';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
  lang: 'en' | 'zh';
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, lang }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    // 初始化默认用户
    initializeDefaultUsers(TEAM_MEMBERS);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = login(username, password);
      if (user) {
        onLoginSuccess(user);
      } else {
        setError(lang === 'zh' ? '用户名或密码错误' : 'Invalid username or password');
      }
    } catch (err) {
      setError(lang === 'zh' ? '登录失败，请重试' : 'Login failed, please try again');
    } finally {
      setLoading(false);
    }
  };

  const users = getAllUsers();
  const defaultUsers = users.slice(0, 3); // 显示前3个用户作为快速登录选项

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
              <UserCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">
              {lang === 'zh' ? 'RS Filling 管理系统' : 'RS Filling Management'}
            </h1>
            <p className="text-slate-500 text-sm mt-2">
              {lang === 'zh' ? '请登录以继续' : 'Please login to continue'}
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {lang === 'zh' ? '用户名' : 'Username'}
              </label>
              <div className="relative">
                <UserCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder={lang === 'zh' ? '输入用户名' : 'Enter username'}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {lang === 'zh' ? '密码' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder={lang === 'zh' ? '输入密码' : 'Enter password'}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading 
                ? (lang === 'zh' ? '登录中...' : 'Logging in...')
                : (lang === 'zh' ? '登录' : 'Login')
              }
            </button>
          </form>

          {/* Quick Login Hints */}
          {defaultUsers.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <p className="text-xs text-slate-500 mb-3 text-center">
                {lang === 'zh' ? '快速登录提示（默认密码：123456）' : 'Quick Login (Default password: 123456)'}
              </p>
              <div className="space-y-2">
                {defaultUsers.map((user) => {
                  const member = TEAM_MEMBERS.find(m => m.id === user.memberId);
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => {
                        setUsername(user.username);
                        setPassword('123456');
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      <span className="font-medium">{member?.name}</span>
                      <span className="text-slate-400 ml-2">({user.username})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Info */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              {lang === 'zh' 
                ? '首次使用：系统已自动创建默认账户' 
                : 'First time: Default accounts have been created automatically'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

