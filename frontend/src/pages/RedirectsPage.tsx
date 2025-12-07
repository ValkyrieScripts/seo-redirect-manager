import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Trash2, Edit, Upload, TestTube2 } from 'lucide-react';
import { redirectsApi } from '@/api/redirects';
import { domainsApi } from '@/api/domains';
import type { Redirect, Domain, RedirectFormData, RedirectType } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { Card, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
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

export function RedirectsPage() {
  const [redirects, setRedirects] = useState<Redirect[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState<string>('');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [editingRedirect, setEditingRedirect] = useState<Redirect | null>(null);
  const [deletingRedirect, setDeletingRedirect] = useState<Redirect | null>(null);

  // Form states
  const [formData, setFormData] = useState<RedirectFormData>({
    domain_id: 0,
    source_path: '',
    target_url: '',
    redirect_type: '301',
    is_regex: false,
    priority: 0,
    notes: '',
  });
  const [bulkData, setBulkData] = useState('');
  const [bulkDomainId, setBulkDomainId] = useState<number>(0);
  const [testDomainId, setTestDomainId] = useState<number>(0);
  const [testPath, setTestPath] = useState('');
  const [testResult, setTestResult] = useState<{ matched: boolean; target_url: string | null; redirect_type: string | null } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [redirectsData, domainsData] = await Promise.all([
        redirectsApi.list({
          domain_id: domainFilter ? parseInt(domainFilter) : undefined,
        }),
        domainsApi.list(),
      ]);
      setRedirects(redirectsData);
      setDomains(domainsData);
    } catch (err) {
      toast.error('Failed to load redirects');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [domainFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredRedirects = redirects.filter(
    (redirect) =>
      redirect.source_path.toLowerCase().includes(search.toLowerCase()) ||
      redirect.target_url.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      domain_id: 0,
      source_path: '',
      target_url: '',
      redirect_type: '301',
      is_regex: false,
      priority: 0,
      notes: '',
    });
  };

  const handleAddRedirect = async () => {
    if (!formData.domain_id) {
      toast.error('Please select a domain');
      return;
    }
    setIsSubmitting(true);
    try {
      await redirectsApi.create(formData);
      toast.success('Redirect added successfully');
      setIsAddModalOpen(false);
      resetForm();
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
      await redirectsApi.update(editingRedirect.id, formData);
      toast.success('Redirect updated successfully');
      setEditingRedirect(null);
      resetForm();
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

  const handleBulkImport = async () => {
    if (!bulkDomainId) {
      toast.error('Please select a domain');
      return;
    }

    const lines = bulkData.trim().split('\n').filter((l) => l.trim());
    const redirectsToCreate = lines.map((line) => {
      const [source_path, target_url, type = '301'] = line.split(',').map((s) => s.trim());
      return {
        domain_id: bulkDomainId,
        source_path,
        target_url,
        redirect_type: (type as RedirectType) || '301',
        is_regex: false,
        priority: 0,
      };
    });

    if (redirectsToCreate.length === 0) {
      toast.error('No valid redirects found');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await redirectsApi.bulkCreate(redirectsToCreate);
      toast.success(`Created ${result.created} redirects`);
      if (result.errors.length > 0) {
        toast.error(`${result.errors.length} errors occurred`);
      }
      setIsBulkModalOpen(false);
      setBulkData('');
      setBulkDomainId(0);
      fetchData();
    } catch (err) {
      toast.error('Failed to import redirects');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestRedirect = async () => {
    if (!testDomainId || !testPath) {
      toast.error('Please select a domain and enter a path');
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await redirectsApi.test(testDomainId, testPath);
      setTestResult(result);
    } catch (err) {
      toast.error('Failed to test redirect');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (redirect: Redirect) => {
    setFormData({
      domain_id: redirect.domain_id,
      source_path: redirect.source_path,
      target_url: redirect.target_url,
      redirect_type: redirect.redirect_type,
      is_regex: redirect.is_regex,
      priority: redirect.priority,
      notes: redirect.notes || '',
    });
    setEditingRedirect(redirect);
  };

  const domainOptions = [
    { value: '', label: 'All Domains' },
    ...domains.map((d) => ({ value: d.id.toString(), label: d.domain })),
  ];

  const formDomainOptions = domains.map((d) => ({ value: d.id.toString(), label: d.domain }));

  const redirectTypeOptions = [
    { value: '301', label: '301 - Permanent' },
    { value: '302', label: '302 - Temporary' },
    { value: '307', label: '307 - Temporary (Preserve Method)' },
    { value: '308', label: '308 - Permanent (Preserve Method)' },
  ];

  if (isLoading) {
    return <LoadingState message="Loading redirects..." />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Redirects</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage redirect rules across all domains
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsTestModalOpen(true)}>
            <TestTube2 className="mr-2 h-4 w-4" />
            Test
          </Button>
          <Button variant="outline" onClick={() => setIsBulkModalOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Bulk Import
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Redirect
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search redirects..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select
              options={domainOptions}
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              className="w-48"
            />
          </div>
        </CardContent>
      </Card>

      {/* Redirects Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Domain</TableHead>
              <TableHead>Source Path</TableHead>
              <TableHead>Target URL</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Regex</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRedirects.length === 0 ? (
              <TableEmpty colSpan={6} message="No redirects found" />
            ) : (
              filteredRedirects.map((redirect) => (
                <TableRow key={redirect.id}>
                  <TableCell className="font-medium">{redirect.domain_name || '-'}</TableCell>
                  <TableCell className="font-mono text-sm">{redirect.source_path}</TableCell>
                  <TableCell className="max-w-xs truncate">{truncate(redirect.target_url, 50)}</TableCell>
                  <TableCell>
                    <Badge>{redirect.redirect_type}</Badge>
                  </TableCell>
                  <TableCell>{redirect.is_regex ? 'Yes' : 'No'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(redirect)}
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
      </Card>

      {/* Add Redirect Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          resetForm();
        }}
        title="Add Redirect"
      >
        <div className="space-y-4">
          <Select
            id="domain_id"
            label="Domain"
            options={formDomainOptions}
            value={formData.domain_id.toString()}
            onChange={(e) => setFormData({ ...formData, domain_id: parseInt(e.target.value) })}
            placeholder="Select a domain"
          />
          <Input
            id="source_path"
            label="Source Path"
            placeholder="/old-page"
            value={formData.source_path}
            onChange={(e) => setFormData({ ...formData, source_path: e.target.value })}
            required
          />
          <Input
            id="target_url"
            label="Target URL"
            placeholder="https://example.com/new-page"
            value={formData.target_url}
            onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
            required
          />
          <Select
            id="redirect_type"
            label="Redirect Type"
            options={redirectTypeOptions}
            value={formData.redirect_type}
            onChange={(e) => setFormData({ ...formData, redirect_type: e.target.value as RedirectType })}
          />
          <div className="flex items-center gap-4">
            <Checkbox
              id="is_regex"
              label="Use Regex"
              checked={formData.is_regex}
              onChange={(e) => setFormData({ ...formData, is_regex: e.target.checked })}
            />
            <Input
              id="priority"
              label="Priority"
              type="number"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
              className="w-24"
            />
          </div>
          <Textarea
            id="notes"
            label="Notes"
            placeholder="Optional notes..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false);
                resetForm();
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
          resetForm();
        }}
        title="Edit Redirect"
      >
        <div className="space-y-4">
          <Select
            id="edit-domain_id"
            label="Domain"
            options={formDomainOptions}
            value={formData.domain_id.toString()}
            onChange={(e) => setFormData({ ...formData, domain_id: parseInt(e.target.value) })}
          />
          <Input
            id="edit-source_path"
            label="Source Path"
            placeholder="/old-page"
            value={formData.source_path}
            onChange={(e) => setFormData({ ...formData, source_path: e.target.value })}
            required
          />
          <Input
            id="edit-target_url"
            label="Target URL"
            placeholder="https://example.com/new-page"
            value={formData.target_url}
            onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
            required
          />
          <Select
            id="edit-redirect_type"
            label="Redirect Type"
            options={redirectTypeOptions}
            value={formData.redirect_type}
            onChange={(e) => setFormData({ ...formData, redirect_type: e.target.value as RedirectType })}
          />
          <div className="flex items-center gap-4">
            <Checkbox
              id="edit-is_regex"
              label="Use Regex"
              checked={formData.is_regex}
              onChange={(e) => setFormData({ ...formData, is_regex: e.target.checked })}
            />
            <Input
              id="edit-priority"
              label="Priority"
              type="number"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
              className="w-24"
            />
          </div>
          <Textarea
            id="edit-notes"
            label="Notes"
            placeholder="Optional notes..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setEditingRedirect(null);
                resetForm();
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

      {/* Bulk Import Modal */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => {
          setIsBulkModalOpen(false);
          setBulkData('');
          setBulkDomainId(0);
        }}
        title="Bulk Import Redirects"
        size="lg"
      >
        <div className="space-y-4">
          <Select
            id="bulk-domain"
            label="Domain"
            options={formDomainOptions}
            value={bulkDomainId.toString()}
            onChange={(e) => setBulkDomainId(parseInt(e.target.value))}
            placeholder="Select a domain"
          />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Enter one redirect per line in format: <code className="rounded bg-gray-100 px-1 dark:bg-gray-700">source_path,target_url,type</code>
          </p>
          <Textarea
            id="bulk-redirects"
            label="Redirects"
            placeholder="/old-page,https://example.com/new-page,301&#10;/another-page,https://example.com/other,302"
            value={bulkData}
            onChange={(e) => setBulkData(e.target.value)}
            rows={10}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsBulkModalOpen(false);
                setBulkData('');
                setBulkDomainId(0);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleBulkImport} isLoading={isSubmitting}>
              Import Redirects
            </Button>
          </div>
        </div>
      </Modal>

      {/* Test Redirect Modal */}
      <Modal
        isOpen={isTestModalOpen}
        onClose={() => {
          setIsTestModalOpen(false);
          setTestPath('');
          setTestDomainId(0);
          setTestResult(null);
        }}
        title="Test Redirect"
      >
        <div className="space-y-4">
          <Select
            id="test-domain"
            label="Domain"
            options={formDomainOptions}
            value={testDomainId.toString()}
            onChange={(e) => {
              setTestDomainId(parseInt(e.target.value));
              setTestResult(null);
            }}
            placeholder="Select a domain"
          />
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
    </div>
  );
}
