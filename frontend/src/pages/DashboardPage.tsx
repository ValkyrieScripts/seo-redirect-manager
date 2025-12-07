import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Globe,
  FolderKanban,
  ArrowRightLeft,
  Link2,
  Plus,
  ExternalLink,
} from 'lucide-react';
import { exportApi } from '@/api/export';
import type { DashboardStats } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/Spinner';
import { formatDate, truncate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  link: string;
  color: string;
}

function StatCard({ title, value, icon: Icon, link, color }: StatCardProps) {
  return (
    <Link to={link}>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="flex items-center gap-4 p-6">
          <div className={`rounded-lg p-3 ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
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
    return <LoadingState message="Loading dashboard..." />;
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load dashboard data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Overview of your redirect management system
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/domains">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Domain
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Projects"
          value={stats.total_projects}
          icon={FolderKanban}
          link="/projects"
          color="bg-purple-500"
        />
        <StatCard
          title="Total Domains"
          value={stats.total_domains}
          icon={Globe}
          link="/domains"
          color="bg-blue-500"
        />
        <StatCard
          title="Total Redirects"
          value={stats.total_redirects}
          icon={ArrowRightLeft}
          link="/redirects"
          color="bg-green-500"
        />
        <StatCard
          title="Total Backlinks"
          value={stats.total_backlinks}
          icon={Link2}
          link="/backlinks"
          color="bg-orange-500"
        />
      </div>

      {/* Domain Status */}
      <Card>
        <CardHeader>
          <CardTitle>Domains by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center justify-between rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
              <span className="text-sm font-medium text-green-700 dark:text-green-400">Active</span>
              <span className="text-2xl font-bold text-green-700 dark:text-green-400">
                {stats.domains_by_status?.active || 0}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
              <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Pending</span>
              <span className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                {stats.domains_by_status?.pending || 0}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
              <span className="text-sm font-medium text-red-700 dark:text-red-400">Inactive</span>
              <span className="text-2xl font-bold text-red-700 dark:text-red-400">
                {stats.domains_by_status?.inactive || 0}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Domains */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Domains</CardTitle>
            <Link to="/domains">
              <Button variant="ghost" size="sm">
                View All
                <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {stats.recent_domains?.length > 0 ? (
              <div className="space-y-3">
                {stats.recent_domains.slice(0, 5).map((domain) => (
                  <Link
                    key={domain.id}
                    to={`/domains/${domain.id}`}
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {domain.domain}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(domain.created_at)}</p>
                    </div>
                    <StatusBadge status={domain.status} />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-gray-500">No domains yet</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Redirects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Redirects</CardTitle>
            <Link to="/redirects">
              <Button variant="ghost" size="sm">
                View All
                <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {stats.recent_redirects?.length > 0 ? (
              <div className="space-y-3">
                {stats.recent_redirects.slice(0, 5).map((redirect) => (
                  <div
                    key={redirect.id}
                    className="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-sm text-gray-900 dark:text-white">
                          {redirect.source_path}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {truncate(redirect.target_url, 50)}
                        </p>
                      </div>
                      <span className="whitespace-nowrap rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                        {redirect.redirect_type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-gray-500">No redirects yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
