import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Globe,
  ArrowRightLeft,
  Link2,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { domainsApi } from '@/api/domains';
import { redirectsApi } from '@/api/redirects';
import { backlinksApi } from '@/api/backlinks';
import type { Domain, Redirect, Backlink, BacklinkPath, RedirectFormData, RedirectType } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge, Badge } from '@/components/ui/Badge';
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
import { truncate } from '@/lib/utils';
import toast from 'react-hot-toast';

export function DomainDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const domainId = parseInt(id || '0');

  const [domain, setDomain] = useState<Domain | null>(null);
  const [redirects, setRedirects] = useState<Redirect[]>([]);
  const [backlinks, setBacklinks] = useState<Backlink[]>([]);
  const [backlinkPaths, setBacklinkPaths] = useState<BacklinkPath[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'redirects' | 'backlinks' | 'paths'>('redirects');

  // Modal states
  const [isAddRedirectOpen, setIsAddRedirectOpen] = useState(false);
  const [editingRedirect, setEditingRedirect] = useState<Redirect | null>(null);
  const [deletingRedirect, setDeletingRedirect] = useState<Redirect | null>(null);
  const [isGenerateRedirectsOpen, setIsGenerateRedirectsOpen] = useState(false);
  const [isTestRedirectOpen, setIsTestRedirectOpen] = useState(false);

  // Form states
  const [redirectForm, setRedirectForm] = useState<RedirectFormData>({
    domain_id: domainId,
    source_path: '',
    target_url: '',
    redirect_type: '301',
    is_regex: false,
    priority: 0,
    notes: '',
  });
  const [generateTargetUrl, setGenerateTargetUrl] = useState('');
  const [testPath, setTestPath] = useState('');
  const [testResult, setTestResult] = useState<{ matched: boolean; target_url: string | null; redirect_type: string | null } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!domainId) return;
    try {
      const [domainData, redirectsData, backlinksData, pathsData] = await Promise.all([
        domainsApi.get(domainId),
        redirectsApi.list({ domain_id: domainId }),
        backlinksApi.list({ domain_id: domainId }),
        backlinksApi.getPaths(domainId),
      ]);
      setDomain(domainData);
      setRedirects(redirectsData);
      setBacklinks(backlinksData);
      setBacklinkPaths(pathsData);
    } catch (err) {
      toast.error('Failed to load domain details');
      console.error(err);
      navigate('/domains');
    } finally {
      setIsLoading(false);
    }
  }, [domainId, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetRedirectForm = () => {
    setRedirectForm({
      domain_id: domainId,
      source_path: '',
      target_url: '',
      redirect_type: '301',
      is_regex: false,
      priority: 0,
      notes: '',
    });
  };

  const handleAddRedirect = async () => {
    setIsSubmitting(true);
    try {
      await redirectsApi.create(redirectForm);
      toast.success('Redirect added successfully');
      setIsAddRedirectOpen(false);
      resetRedirectForm();
      fetchData();
    } catch (err) {
      toast.error('Failed to add redirect');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditRedirect = async () => {
    if (!editingRedirect) return;
    setIsSubmitting(true);
    try {
      await redirectsApi.update(editingRedirect.id, redirectForm);
      toast.success('Redirect updated successfully');
      setEditingRedirect(null);
      resetRedirectForm();
      fetchData();
    } catch (err) {
      toast.error('Failed to update redirect');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRedirect = async () => {
    if (!deletingRedirect) return;
    setIsSubmitting(true);
    try {
      await redirectsApi.delete(deletingRedirect.id);
      toast.success('Redirect deleted successfully');
      setDeletingRedirect(null);
      fetchData();
    } catch (err) {
      toast.error('Failed to delete redirect');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateRedirects = async () => {
    if (!generateTargetUrl) {
      toast.error('Please enter a target URL');
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await backlinksApi.generateRedirects(domainId, generateTargetUrl);
      toast.success(`Generated ${result.created} redirects`);
      setIsGenerateRedirectsOpen(false);
      setGenerateTargetUrl('');
      fetchData();
    } catch (err) {
      toast.error('Failed to generate redirects');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestRedirect = async () => {
    if (!testPath) {
      toast.error('Please enter a path to test');
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await redirectsApi.test(domainId, testPath);
      setTestResult(result);
    } catch (err) {
      toast.error('Failed to test redirect');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditRedirect = (redirect: Redirect) => {
    setRedirectForm({
      domain_id: domainId,
      source_path: redirect.source_path,
      target_url: redirect.target_url,
      redirect_type: redirect.redirect_type,
      is_regex: redirect.is_regex,
      priority: redirect.priority,
      notes: redirect.notes || '',
    });
    setEditingRedirect(redirect);
  };

  const redirectTypeOptions = [
    { value: '301', label: '301 - Permanent' },
    { value: '302', label: '302 - Temporary' },
    { value: '307', label: '307 - Temporary (Preserve Method)' },
    { value: '308', label: '308 - Permanent (Preserve Method)' },
  ];

  if (isLoading) {
    return <LoadingState message="Loading domain details..." />;
  }

  if (!domain) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Domain not found</p>
        <Link to="/domains">
          <Button className="mt-4">Back to Domains</Button>
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: 'redirects', label: 'Redirects', count: redirects.length },
    { id: 'backlinks', label: 'Backlinks', count: backlinks.length },
    { id: 'paths', label: 'Backlink Paths', count: backlinkPaths.length },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link to="/domains">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Globe className="h-6 w-6 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{domain.domain}</h1>
            <StatusBadge status={domain.status} />
          </div>
          {domain.target_url && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Default target: {domain.target_url}
            </p>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900">
              <ArrowRightLeft className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Redirects</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{redirects.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900">
              <Link2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Backlinks</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{backlinks.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900">
              <ExternalLink className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Unique Paths</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{backlinkPaths.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-2 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-b-2 border-primary-600 text-primary-600'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
            {activeTab === 'redirects' && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsTestRedirectOpen(true)}>
                  Test Redirect
                </Button>
                <Button size="sm" onClick={() => setIsAddRedirectOpen(true)}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add Redirect
                </Button>
              </div>
            )}
            {activeTab === 'paths' && backlinkPaths.length > 0 && (
              <Button size="sm" onClick={() => setIsGenerateRedirectsOpen(true)}>
                <Plus className="mr-1 h-4 w-4" />
                Generate Redirects
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {activeTab === 'redirects' && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source Path</TableHead>
                  <TableHead>Target URL</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Regex</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {redirects.length === 0 ? (
                  <TableEmpty colSpan={6} message="No redirects configured" />
                ) : (
                  redirects.map((redirect) => (
                    <TableRow key={redirect.id}>
                      <TableCell className="font-mono text-sm">{redirect.source_path}</TableCell>
                      <TableCell className="max-w-xs truncate">{truncate(redirect.target_url, 50)}</TableCell>
                      <TableCell>
                        <Badge>{redirect.redirect_type}</Badge>
                      </TableCell>
                      <TableCell>{redirect.is_regex ? 'Yes' : 'No'}</TableCell>
                      <TableCell>{redirect.priority}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditRedirect(redirect)}
                            title="Edit redirect"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingRedirect(redirect)}
                            title="Delete redirect"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {activeTab === 'backlinks' && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referring Page</TableHead>
                  <TableHead>Target URL</TableHead>
                  <TableHead>Anchor</TableHead>
                  <TableHead>DR</TableHead>
                  <TableHead>UR</TableHead>
                  <TableHead>Traffic</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backlinks.length === 0 ? (
                  <TableEmpty colSpan={6} message="No backlinks imported" />
                ) : (
                  backlinks.map((backlink) => (
                    <TableRow key={backlink.id}>
                      <TableCell className="max-w-xs truncate">
                        <a
                          href={backlink.referring_page}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:underline"
                        >
                          {truncate(backlink.referring_page, 50)}
                        </a>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{truncate(backlink.target_url, 40)}</TableCell>
                      <TableCell className="max-w-xs truncate">{backlink.anchor_text || '-'}</TableCell>
                      <TableCell>{backlink.domain_rating ?? '-'}</TableCell>
                      <TableCell>{backlink.url_rating ?? '-'}</TableCell>
                      <TableCell>{backlink.traffic ?? '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {activeTab === 'paths' && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Path</TableHead>
                  <TableHead>Backlinks</TableHead>
                  <TableHead>Avg DR</TableHead>
                  <TableHead>Avg UR</TableHead>
                  <TableHead>Total Traffic</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backlinkPaths.length === 0 ? (
                  <TableEmpty colSpan={5} message="No backlink paths found" />
                ) : (
                  backlinkPaths.map((path) => (
                    <TableRow key={path.path}>
                      <TableCell className="font-mono text-sm">{path.path}</TableCell>
                      <TableCell>{path.count}</TableCell>
                      <TableCell>{path.avg_dr?.toFixed(1) ?? '-'}</TableCell>
                      <TableCell>{path.avg_ur?.toFixed(1) ?? '-'}</TableCell>
                      <TableCell>{path.total_traffic ?? '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Redirect Modal */}
      <Modal
        isOpen={isAddRedirectOpen}
        onClose={() => {
          setIsAddRedirectOpen(false);
          resetRedirectForm();
        }}
        title="Add Redirect"
      >
        <div className="space-y-4">
          <Input
            id="source_path"
            label="Source Path"
            placeholder="/old-page"
            value={redirectForm.source_path}
            onChange={(e) => setRedirectForm({ ...redirectForm, source_path: e.target.value })}
            required
          />
          <Input
            id="target_url"
            label="Target URL"
            placeholder="https://example.com/new-page"
            value={redirectForm.target_url}
            onChange={(e) => setRedirectForm({ ...redirectForm, target_url: e.target.value })}
            required
          />
          <Select
            id="redirect_type"
            label="Redirect Type"
            options={redirectTypeOptions}
            value={redirectForm.redirect_type}
            onChange={(e) => setRedirectForm({ ...redirectForm, redirect_type: e.target.value as RedirectType })}
          />
          <div className="flex items-center gap-4">
            <Checkbox
              id="is_regex"
              label="Use Regex"
              checked={redirectForm.is_regex}
              onChange={(e) => setRedirectForm({ ...redirectForm, is_regex: e.target.checked })}
            />
            <Input
              id="priority"
              label="Priority"
              type="number"
              value={redirectForm.priority}
              onChange={(e) => setRedirectForm({ ...redirectForm, priority: parseInt(e.target.value) || 0 })}
              className="w-24"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddRedirectOpen(false);
                resetRedirectForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddRedirect} isLoading={isSubmitting}>
              Add Redirect
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Redirect Modal */}
      <Modal
        isOpen={!!editingRedirect}
        onClose={() => {
          setEditingRedirect(null);
          resetRedirectForm();
        }}
        title="Edit Redirect"
      >
        <div className="space-y-4">
          <Input
            id="edit-source_path"
            label="Source Path"
            placeholder="/old-page"
            value={redirectForm.source_path}
            onChange={(e) => setRedirectForm({ ...redirectForm, source_path: e.target.value })}
            required
          />
          <Input
            id="edit-target_url"
            label="Target URL"
            placeholder="https://example.com/new-page"
            value={redirectForm.target_url}
            onChange={(e) => setRedirectForm({ ...redirectForm, target_url: e.target.value })}
            required
          />
          <Select
            id="edit-redirect_type"
            label="Redirect Type"
            options={redirectTypeOptions}
            value={redirectForm.redirect_type}
            onChange={(e) => setRedirectForm({ ...redirectForm, redirect_type: e.target.value as RedirectType })}
          />
          <div className="flex items-center gap-4">
            <Checkbox
              id="edit-is_regex"
              label="Use Regex"
              checked={redirectForm.is_regex}
              onChange={(e) => setRedirectForm({ ...redirectForm, is_regex: e.target.checked })}
            />
            <Input
              id="edit-priority"
              label="Priority"
              type="number"
              value={redirectForm.priority}
              onChange={(e) => setRedirectForm({ ...redirectForm, priority: parseInt(e.target.value) || 0 })}
              className="w-24"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setEditingRedirect(null);
                resetRedirectForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEditRedirect} isLoading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingRedirect}
        onClose={() => setDeletingRedirect(null)}
        title="Delete Redirect"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete the redirect from <strong>{deletingRedirect?.source_path}</strong>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDeletingRedirect(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteRedirect} isLoading={isSubmitting}>
              Delete Redirect
            </Button>
          </div>
        </div>
      </Modal>

      {/* Generate Redirects Modal */}
      <Modal
        isOpen={isGenerateRedirectsOpen}
        onClose={() => {
          setIsGenerateRedirectsOpen(false);
          setGenerateTargetUrl('');
        }}
        title="Generate Redirects from Backlinks"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This will create 301 redirects for all unique backlink paths to the target URL you specify.
          </p>
          <Input
            id="generate-target"
            label="Target URL"
            placeholder="https://example.com/new-page"
            value={generateTargetUrl}
            onChange={(e) => setGenerateTargetUrl(e.target.value)}
            required
          />
          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>{backlinkPaths.length}</strong> unique paths will be redirected
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsGenerateRedirectsOpen(false);
                setGenerateTargetUrl('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleGenerateRedirects} isLoading={isSubmitting}>
              Generate Redirects
            </Button>
          </div>
        </div>
      </Modal>

      {/* Test Redirect Modal */}
      <Modal
        isOpen={isTestRedirectOpen}
        onClose={() => {
          setIsTestRedirectOpen(false);
          setTestPath('');
          setTestResult(null);
        }}
        title="Test Redirect"
      >
        <div className="space-y-4">
          <Input
            id="test-path"
            label="Path to Test"
            placeholder="/example-path"
            value={testPath}
            onChange={(e) => {
              setTestPath(e.target.value);
              setTestResult(null);
            }}
          />
          <Button onClick={handleTestRedirect} isLoading={isSubmitting} className="w-full">
            Test
          </Button>
          {testResult && (
            <div className={`rounded-lg p-4 ${testResult.matched ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
              {testResult.matched ? (
                <div className="space-y-2">
                  <p className="font-medium text-green-700 dark:text-green-400">Match found!</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Target:</strong> {testResult.target_url}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Type:</strong> {testResult.redirect_type}
                  </p>
                </div>
              ) : (
                <p className="font-medium text-red-700 dark:text-red-400">No matching redirect found</p>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
