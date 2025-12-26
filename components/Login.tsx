import React, { useState } from 'react';
import { UserCircle, Lock, AlertCircle, Mail } from 'lucide-react';
import { login } from '../services/authService';
import { TRANSLATIONS } from '../constants';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
  lang: 'en' | 'zh';
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, lang }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const t = TRANSLATIONS[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user) {
        onLoginSuccess(user);
      } else {
        setError(lang === 'zh' ? '邮箱或密码错误' : 'Invalid email or password');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(
        err?.message || 
        (lang === 'zh' ? '登录失败，请重试' : 'Login failed, please try again')
      );
    } finally {
      setLoading(false);
    }
  };

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
                {lang === 'zh' ? '邮箱' : 'Email'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder={lang === 'zh' ? '输入邮箱地址' : 'Enter email address'}
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

          {/* Info */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              {lang === 'zh' 
                ? '请使用您的邮箱和密码登录。如未注册，请联系管理员。' 
                : 'Please login with your email and password. Contact administrator if you need an account.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

