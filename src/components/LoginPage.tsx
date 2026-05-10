import { useState } from 'react';
import { Film, Mail, Lock, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export function LoginPage() {
  const { signIn, signUp } = useAuth();
  const { t, lang, setLang } = useLanguage();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) setError(error);
    } else {
      const { error, needsConfirm } = await signUp(email, password);
      if (error === 'NOT_ALLOWED') setError(t('auth_not_allowed'));
      else if (error === 'ALREADY_EXISTS') setError(t('auth_already_exists'));
      else if (error) setError(error);
      else if (needsConfirm) setConfirmed(true);
    }

    setLoading(false);
  };

  const isLogin = mode === 'login';

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex flex-col items-center justify-center p-4">

      {/* Lang switcher top-right */}
      <div className="absolute top-4 right-4 flex items-center gap-1 bg-white dark:bg-gray-800 rounded-lg p-0.5 shadow-sm border border-gray-200 dark:border-gray-700">
        {(['tr', 'en'] as const).map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
              lang === l
                ? 'bg-blue-600 text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Card */}
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-blue-600 rounded-2xl shadow-lg mb-3">
            <Film size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Watchlist</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('auth_tagline')}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => { setMode('login'); setError(null); setConfirmed(false); }}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                isLogin
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/10'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {t('auth_login')}
            </button>
            <button
              onClick={() => { setMode('register'); setError(null); setConfirmed(false); }}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                !isLogin
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/10'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {t('auth_register')}
            </button>
          </div>

          {/* Confirm email state */}
          {confirmed ? (
            <div className="p-6 flex flex-col items-center gap-3 text-center">
              <CheckCircle size={40} className="text-green-500" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{t('auth_confirm_sent')}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('auth_confirm_hint')}</p>
              <button
                onClick={() => { setMode('login'); setConfirmed(false); }}
                className="mt-2 text-sm text-blue-600 hover:underline"
              >
                {t('auth_go_login')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                  {t('auth_email')}
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="ornek@email.com"
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                  {t('auth_password')}
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
                {!isLogin && (
                  <p className="mt-1 text-[11px] text-gray-400">{t('auth_password_hint')}</p>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={15} className="animate-spin" />}
                {isLogin ? t('auth_login_btn') : t('auth_register_btn')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
