import { useState } from 'react';
import { Settings, User, Lock, Info, Shield, Check, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/api';

export function SettingsPage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (newPassword.length < 4) {
      setMessage({ type: 'error', text: 'Password must be at least 4 characters' });
      return;
    }

    setLoading(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to change password' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-purple-600">
            <Settings className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
        </div>
        <p className="text-slate-400">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        {/* Account Info */}
        <Card className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 border border-blue-500/20">
                <User className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Account Information</h2>
                <p className="text-sm text-slate-400">Your account details</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <div>
                  <p className="text-sm text-slate-400">Username</p>
                  <p className="text-white font-medium mt-0.5">{user?.username || 'admin'}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-700/50">
                  <Shield className="h-5 w-5 text-slate-400" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <div>
                  <p className="text-sm text-slate-400">Role</p>
                  <p className="text-white font-medium mt-0.5">Administrator</p>
                </div>
                <span className="px-3 py-1 rounded-lg bg-primary-500/10 text-primary-400 text-sm font-medium border border-primary-500/20">
                  Full Access
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Change Password */}
        <Card className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/20">
                <Lock className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Change Password</h2>
                <p className="text-sm text-slate-400">Update your account password</p>
              </div>
            </div>

            {message && (
              <div className={`flex items-center gap-3 p-4 rounded-xl mb-6 animate-scale-in ${
                message.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/20'
                  : 'bg-rose-500/10 border border-rose-500/20'
              }`}>
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  message.type === 'success' ? 'bg-emerald-500/20' : 'bg-rose-500/20'
                }`}>
                  {message.type === 'success' ? (
                    <Check className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-rose-400" />
                  )}
                </div>
                <span className={message.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}>
                  {message.text}
                </span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <Input
                id="current-password"
                type="password"
                label="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
              />

              <Input
                id="new-password"
                type="password"
                label="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
              />

              <Input
                id="confirm-password"
                type="password"
                label="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
              />

              <div className="pt-2">
                <Button type="submit" isLoading={loading}>
                  <Lock className="mr-2 h-4 w-4" />
                  {loading ? 'Changing Password...' : 'Change Password'}
                </Button>
              </div>
            </form>
          </div>
        </Card>

        {/* System Info */}
        <Card className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-500/20 border border-slate-500/20">
                <Info className="h-5 w-5 text-slate-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">System Information</h2>
                <p className="text-sm text-slate-400">Application details</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-800/30">
                <span className="text-slate-400">Version</span>
                <span className="text-white font-mono">1.0.0</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-800/30">
                <span className="text-slate-400">API Endpoint</span>
                <span className="text-white font-mono text-xs truncate max-w-[200px]">
                  {import.meta.env.VITE_API_URL || 'http://localhost:3001'}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-800/30">
                <span className="text-slate-400">Environment</span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                  {import.meta.env.MODE}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
