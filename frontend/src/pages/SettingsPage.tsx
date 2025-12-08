import { useState } from 'react';
import { Lock, Check, AlertCircle } from 'lucide-react';
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
    <div className="p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-slate-400">Manage your account</p>
      </div>

      {/* Account Info */}
      <div className="p-5 bg-slate-800/50 rounded-xl border border-slate-700">
        <h2 className="text-lg font-semibold text-white mb-4">Account</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-slate-900 rounded-lg">
            <span className="text-slate-400">Username</span>
            <span className="text-white font-medium">{user?.username || 'admin'}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-slate-900 rounded-lg">
            <span className="text-slate-400">Role</span>
            <span className="text-green-400 text-sm">Administrator</span>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="p-5 bg-slate-800/50 rounded-xl border border-slate-700">
        <h2 className="text-lg font-semibold text-white mb-4">Change Password</h2>

        {message && (
          <div className={`flex items-center gap-3 p-4 rounded-lg mb-4 ${
            message.type === 'success'
              ? 'bg-green-500/10 border border-green-500/30 text-green-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}>
            {message.type === 'success' ? (
              <Check className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              required
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              required
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Lock className="h-4 w-4" />
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* System Info */}
      <div className="p-5 bg-slate-800/50 rounded-xl border border-slate-700">
        <h2 className="text-lg font-semibold text-white mb-4">System</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-slate-900 rounded-lg">
            <span className="text-slate-400">Version</span>
            <span className="text-white font-mono text-sm">1.0.0</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-slate-900 rounded-lg">
            <span className="text-slate-400">Server</span>
            <span className="text-white font-mono text-sm">89.147.108.50</span>
          </div>
        </div>
      </div>
    </div>
  );
}
