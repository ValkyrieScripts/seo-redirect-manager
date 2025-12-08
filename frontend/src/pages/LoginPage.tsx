import { useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ArrowRightLeft, LogIn, Lock, User, Sparkles, Globe, Link2, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';

export function LoginPage() {
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center gradient-mesh">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          <span className="text-lg text-slate-300">Loading...</span>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username, password);
      toast.success('Welcome back!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: Globe, title: 'Domain Management', description: 'Organize and manage all your redirect domains in one place' },
    { icon: Link2, title: 'Smart Redirects', description: 'Create 301/302 redirects with ease and precision' },
    { icon: Zap, title: 'Bulk Operations', description: 'Import backlinks and export URLs for indexing at scale' },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 gradient-mesh">
          {/* Animated orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-1.5s' }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 w-full">
          {/* Logo and Title */}
          <div className="mb-12 animate-fade-in">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-purple-500 rounded-2xl blur-lg opacity-50" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-purple-600 shadow-xl">
                  <ArrowRightLeft className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  SEO Redirect Manager
                </h1>
                <p className="text-slate-400 text-lg">Enterprise-grade redirect management</p>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-6 max-w-xl">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="flex items-start gap-4 p-5 rounded-2xl glass-card animate-fade-in hover:border-primary-500/30 transition-all duration-300"
                style={{ animationDelay: `${(index + 1) * 0.1}s` }}
              >
                <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500/20 to-purple-500/20 border border-primary-500/20">
                  <feature.icon className="h-6 w-6 text-primary-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">{feature.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-12 flex gap-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div>
              <div className="text-3xl font-bold text-gradient">10K+</div>
              <div className="text-sm text-slate-500">Redirects Managed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gradient">99.9%</div>
              <div className="text-sm text-slate-500">Uptime</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gradient">&lt;10ms</div>
              <div className="text-sm text-slate-500">Response Time</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-6 sm:p-12 bg-[#0a0a14]">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-10 text-center animate-fade-in">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-primary-600 to-purple-600 shadow-xl glow-primary mb-4">
              <ArrowRightLeft className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">SEO Redirect Manager</h1>
            <p className="text-slate-400 mt-1">Enterprise-grade redirect management</p>
          </div>

          {/* Login Card */}
          <div className="relative animate-scale-in">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary-600/20 via-purple-600/20 to-cyan-600/20 rounded-3xl blur-xl" />

            <div className="relative glass-card rounded-3xl p-8 sm:p-10">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 mb-4">
                  <Sparkles className="h-4 w-4 text-primary-400" />
                  <span className="text-sm text-primary-300 font-medium">Welcome back</span>
                </div>
                <h2 className="text-2xl font-bold text-white">Sign in to your account</h2>
                <p className="text-slate-400 mt-2">Enter your credentials to continue</p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="flex items-center gap-3 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 animate-scale-in">
                    <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-red-500/20">
                      <Lock className="h-5 w-5" />
                    </div>
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-2">
                    Username
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                      <User className="h-5 w-5 text-slate-500 group-focus-within:text-primary-400 transition-colors" />
                    </div>
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username"
                      required
                      autoComplete="username"
                      autoFocus
                      className="w-full h-12 pl-12 pr-4 rounded-xl bg-slate-900/50 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-primary-400 transition-colors" />
                    </div>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      autoComplete="current-password"
                      className="w-full h-12 pl-12 pr-4 rounded-xl bg-slate-900/50 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="relative w-full h-12 mt-2 rounded-xl font-semibold text-white overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {/* Button gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-primary-500 to-purple-600 transition-all duration-300 group-hover:scale-105" />

                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

                  {/* Button content */}
                  <span className="relative flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="h-5 w-5" />
                        <span>Sign In</span>
                      </>
                    )}
                  </span>
                </button>
              </form>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-slate-800">
                <p className="text-center text-sm text-slate-500">
                  Secure login powered by JWT authentication
                </p>
              </div>
            </div>
          </div>

          {/* Bottom text */}
          <p className="text-center text-sm text-slate-600 mt-8">
            SEO Redirect Manager v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
