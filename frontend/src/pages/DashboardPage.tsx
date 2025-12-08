import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Globe,
  FolderKanban,
  ArrowRightLeft,
  Link2,
  Plus,
  ExternalLink,
  TrendingUp,
  Activity,
  Clock,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { exportApi } from '@/api/export';
import type { DashboardStats } from '@/types';
import { StatusBadge } from '@/components/ui/Badge';
import { formatDate, truncate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  link: string;
  gradient: string;
  iconBg: string;
  delay: number;
}

function StatCard({ title, value, icon: Icon, link, gradient, iconBg, delay }: StatCardProps) {
  return (
    <Link to={link} className="group block">
      <div
        className="relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 animate-fade-in"
        style={{ animationDelay: `${delay}s` }}
      >
        {/* Background gradient */}
        <div className={`absolute inset-0 ${gradient} opacity-90`} />

        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }} />

        {/* Glow effect on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/5" />

        {/* Content */}
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white/70 mb-1">{title}</p>
            <p className="text-4xl font-bold text-white tracking-tight">{value.toLocaleString()}</p>
          </div>
          <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${iconBg} shadow-lg`}>
            <Icon className="h-7 w-7 text-white" />
          </div>
        </div>

        {/* Bottom link indicator */}
        <div className="relative z-10 mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
          <span className="text-sm text-white/60">View details</span>
          <ChevronRight className="h-4 w-4 text-white/60 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}

interface StatusCardProps {
  label: string;
  value: number;
  color: 'emerald' | 'amber' | 'rose';
}

function StatusCard({ label, value, color }: StatusCardProps) {
  const colors = {
    emerald: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      text: 'text-emerald-400',
      dot: 'bg-emerald-400'
    },
    amber: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-400',
      dot: 'bg-amber-400'
    },
    rose: {
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      text: 'text-rose-400',
      dot: 'bg-rose-400'
    }
  };

  const c = colors[color];

  return (
    <div className={`flex items-center justify-between rounded-xl ${c.bg} border ${c.border} p-4 transition-all hover:scale-[1.02]`}>
      <div className="flex items-center gap-3">
        <div className={`h-3 w-3 rounded-full ${c.dot} animate-pulse`} />
        <span className={`text-sm font-medium ${c.text}`}>{label}</span>
      </div>
      <span className={`text-2xl font-bold ${c.text}`}>{value}</span>
    </div>
  );
}

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await exportApi.getStats();
        setStats(data);
      } catch (err) {
        toast.error('Failed to load dashboard stats');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-primary-500/20" />
          <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
        </div>
        <p className="text-slate-400 animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-slate-800 mb-4">
          <Activity className="h-8 w-8 text-slate-500" />
        </div>
        <p className="text-slate-400">Failed to load dashboard data</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Projects',
      value: stats.total_projects,
      icon: FolderKanban,
      link: '/projects',
      gradient: 'bg-gradient-to-br from-violet-600 to-purple-700',
      iconBg: 'bg-white/20',
    },
    {
      title: 'Total Domains',
      value: stats.total_domains,
      icon: Globe,
      link: '/domains',
      gradient: 'bg-gradient-to-br from-blue-600 to-cyan-600',
      iconBg: 'bg-white/20',
    },
    {
      title: 'Total Redirects',
      value: stats.total_redirects,
      icon: ArrowRightLeft,
      link: '/redirects',
      gradient: 'bg-gradient-to-br from-emerald-600 to-teal-600',
      iconBg: 'bg-white/20',
    },
    {
      title: 'Total Backlinks',
      value: stats.total_backlinks,
      icon: Link2,
      link: '/backlinks',
      gradient: 'bg-gradient-to-br from-orange-500 to-rose-600',
      iconBg: 'bg-white/20',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-purple-600">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          </div>
          <p className="text-slate-400">
            Welcome back! Here's an overview of your redirect management system.
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/domains">
            <button className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-white overflow-hidden transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-purple-600" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-primary-500 to-purple-500" />
              <Plus className="relative h-5 w-5" />
              <span className="relative">Add Domain</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => (
          <StatCard key={card.title} {...card} delay={index * 0.1} />
        ))}
      </div>

      {/* Domain Status Section */}
      <div className="glass-card rounded-2xl p-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500/20 to-purple-500/20 border border-primary-500/20">
            <TrendingUp className="h-5 w-5 text-primary-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Domain Status Overview</h2>
            <p className="text-sm text-slate-400">Current status of all your domains</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatusCard
            label="Active"
            value={stats.domains_by_status?.active || 0}
            color="emerald"
          />
          <StatusCard
            label="Pending"
            value={stats.domains_by_status?.pending || 0}
            color="amber"
          />
          <StatusCard
            label="Inactive"
            value={stats.domains_by_status?.inactive || 0}
            color="rose"
          />
        </div>
      </div>

      {/* Recent Activity Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Domains */}
        <div className="glass-card rounded-2xl overflow-hidden animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 border border-blue-500/20">
                <Globe className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h2 className="font-semibold text-white">Recent Domains</h2>
                <p className="text-sm text-slate-400">Latest added domains</p>
              </div>
            </div>
            <Link
              to="/domains"
              className="inline-flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300 transition-colors"
            >
              View All
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="p-4">
            {stats.recent_domains?.length > 0 ? (
              <div className="space-y-2">
                {stats.recent_domains.slice(0, 5).map((domain, index) => (
                  <Link
                    key={domain.id}
                    to={`/domains/${domain.id}`}
                    className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 hover:border-slate-600/50 transition-all duration-200 group animate-fade-in"
                    style={{ animationDelay: `${0.5 + index * 0.05}s` }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-700/50 group-hover:bg-blue-500/20 transition-colors">
                        <Globe className="h-4 w-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-white truncate group-hover:text-blue-400 transition-colors">
                          {domain.domain}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Clock className="h-3 w-3" />
                          {formatDate(domain.created_at)}
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={domain.status} />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <Globe className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No domains yet</p>
                <Link
                  to="/domains"
                  className="inline-flex items-center gap-1 mt-3 text-sm text-primary-400 hover:text-primary-300 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add your first domain
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Redirects */}
        <div className="glass-card rounded-2xl overflow-hidden animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/20">
                <ArrowRightLeft className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="font-semibold text-white">Recent Redirects</h2>
                <p className="text-sm text-slate-400">Latest redirect rules</p>
              </div>
            </div>
            <Link
              to="/redirects"
              className="inline-flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300 transition-colors"
            >
              View All
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="p-4">
            {stats.recent_redirects?.length > 0 ? (
              <div className="space-y-2">
                {stats.recent_redirects.slice(0, 5).map((redirect, index) => (
                  <div
                    key={redirect.id}
                    className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 hover:border-slate-600/50 transition-all duration-200 group animate-fade-in"
                    style={{ animationDelay: `${0.6 + index * 0.05}s` }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-sm text-white truncate">
                          {redirect.source_path}
                        </p>
                        <p className="text-xs text-slate-500 truncate mt-1 flex items-center gap-1">
                          <ArrowRightLeft className="h-3 w-3 flex-shrink-0" />
                          {truncate(redirect.target_url, 50)}
                        </p>
                      </div>
                      <span className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-slate-700/50 text-xs font-medium text-slate-300 border border-slate-600/50">
                        {redirect.redirect_type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <ArrowRightLeft className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No redirects yet</p>
                <Link
                  to="/redirects"
                  className="inline-flex items-center gap-1 mt-3 text-sm text-primary-400 hover:text-primary-300 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Create your first redirect
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
