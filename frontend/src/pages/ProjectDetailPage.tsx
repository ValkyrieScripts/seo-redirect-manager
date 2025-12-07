import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, FolderKanban, Globe, Plus } from 'lucide-react';
import { projectsApi } from '@/api/projects';
import { domainsApi } from '@/api/domains';
import type { Project, Domain } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from '@/components/ui/Table';
import { LoadingState } from '@/components/ui/Spinner';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const projectId = parseInt(id || '0');

  const [project, setProject] = useState<Project | null>(null);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    try {
      const [projectData, domainsData] = await Promise.all([
        projectsApi.get(projectId),
        domainsApi.list({ project_id: projectId }),
      ]);
      setProject(projectData);
      setDomains(domainsData);
    } catch (err) {
      toast.error('Failed to load project details');
      console.error(err);
      navigate('/projects');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return <LoadingState message="Loading project details..." />;
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Project not found</p>
        <Link to="/projects">
          <Button className="mt-4">Back to Projects</Button>
        </Link>
      </div>
    );
  }

  const statusCounts = {
    active: domains.filter((d) => d.status === 'active').length,
    pending: domains.filter((d) => d.status === 'pending').length,
    inactive: domains.filter((d) => d.status === 'inactive').length,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link to="/projects">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <FolderKanban className="h-6 w-6 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
          </div>
          {project.description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{project.description}</p>
          )}
        </div>
        <Link to="/domains">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Domain
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Domains</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{domains.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
            <p className="text-2xl font-bold text-green-600">{statusCounts.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Inactive</p>
            <p className="text-2xl font-bold text-red-600">{statusCounts.inactive}</p>
          </CardContent>
        </Card>
      </div>

      {/* Domains Table */}
      <Card>
        <CardHeader>
          <CardTitle>Project Domains</CardTitle>
          <CardDescription>Domains assigned to this project</CardDescription>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Domain</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Redirects</TableHead>
              <TableHead>Backlinks</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {domains.length === 0 ? (
              <TableEmpty colSpan={5} message="No domains in this project" />
            ) : (
              domains.map((domain) => (
                <TableRow key={domain.id}>
                  <TableCell>
                    <Link
                      to={`/domains/${domain.id}`}
                      className="flex items-center gap-2 font-medium text-primary-600 hover:underline"
                    >
                      <Globe className="h-4 w-4" />
                      {domain.domain}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={domain.status} />
                  </TableCell>
                  <TableCell>{domain.redirect_count || 0}</TableCell>
                  <TableCell>{domain.backlink_count || 0}</TableCell>
                  <TableCell>{formatDate(domain.created_at)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
