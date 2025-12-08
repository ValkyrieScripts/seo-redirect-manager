import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Trash2, Edit, Eye, Upload, Globe, X } from 'lucide-react';
import { domainsApi } from '@/api/domains';
import { projectsApi } from '@/api/projects';
import type { Domain, Project, DomainStatus, DomainFormData } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
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

export function DomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DomainStatus | ''>('');
  const [projectFilter, setProjectFilter] = useState<string>('');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null);
  const [deletingDomain, setDeletingDomain] = useState<Domain | null>(null);

  // Form state
  const [formData, setFormData] = useState<DomainFormData>({
    domain: '',
    project_id: null,
    status: 'pending',
    target_url: '',
    notes: '',
  });
  const [bulkDomains, setBulkDomains] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [domainsData, projectsData] = await Promise.all([
        domainsApi.list({
          status: statusFilter || undefined,
          project_id: projectFilter ? parseInt(projectFilter) : undefined,
        }),
        projectsApi.list(),
      ]);
      setDomains(domainsData);
      setProjects(projectsData);
    } catch (err) {
      toast.error('Failed to load domains');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, projectFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredDomains = domains.filter((domain) =>
    domain.domain.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      domain: '',
      project_id: null,
      status: 'pending',
      target_url: '',
      notes: '',
    });
  };

  const handleAddDomain = async () => {
    setIsSubmitting(true);
    try {
      await domainsApi.create(formData);
      toast.success('Domain added successfully');
      setIsAddModalOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      toast.error('Failed to add domain');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditDomain = async () => {
    if (!editingDomain) return;
    setIsSubmitting(true);
    try {
      await domainsApi.update(editingDomain.id, formData);
      toast.success('Domain updated successfully');
      setEditingDomain(null);
      resetForm();
      fetchData();
    } catch (err) {
      toast.error('Failed to update domain');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDomain = async () => {
    if (!deletingDomain) return;
    setIsSubmitting(true);
    try {
      await domainsApi.delete(deletingDomain.id);
      toast.success('Domain deleted successfully');
      setDeletingDomain(null);
      fetchData();
    } catch (err) {
      toast.error('Failed to delete domain');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkImport = async () => {
    const domainList = bulkDomains
      .split('\n')
      .map((d) => d.trim())
      .filter((d) => d.length > 0);

    if (domainList.length === 0) {
      toast.error('Please enter at least one domain');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await domainsApi.bulkCreate(domainList);
      toast.success(`Created ${result.created} domains`);
      if (result.errors.length > 0) {
        toast.error(`${result.errors.length} errors occurred`);
      }
      setIsBulkModalOpen(false);
      setBulkDomains('');
      fetchData();
    } catch (err) {
      toast.error('Failed to import domains');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (domain: Domain) => {
    setFormData({
      domain: domain.domain,
      project_id: domain.project_id,
      status: domain.status,
      target_url: domain.target_url || '',
      notes: domain.notes || '',
    });
    setEditingDomain(domain);
  };

  const projectOptions = [
    { value: '', label: 'All Projects' },
    ...projects.map((p) => ({ value: p.id.toString(), label: p.name })),
  ];

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'pending', label: 'Pending' },
  ];

  const formStatusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'pending', label: 'Pending' },
  ];

  const formProjectOptions = [
    { value: '', label: 'No Project' },
    ...projects.map((p) => ({ value: p.id.toString(), label: p.name })),
  ];

  if (isLoading) {
    return <LoadingState message="Loading domains..." />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Domains</h1>
          </div>
          <p className="text-slate-400">
            Manage your domain redirects
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setIsBulkModalOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Bulk Import
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Domain
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  placeholder="Search domains..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-11"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Select
                options={statusOptions}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as DomainStatus | '')}
                className="w-40"
              />
              <Select
                options={projectOptions}
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="w-48"
              />
              {(search || statusFilter || projectFilter) && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('');
                    setProjectFilter('');
                  }}
                  title="Clear filters"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Domains Table */}
      <Card className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Domain</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Redirects</TableHead>
              <TableHead>Backlinks</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDomains.length === 0 ? (
              <TableEmpty colSpan={7} message="No domains found" />
            ) : (
              filteredDomains.map((domain) => (
                <TableRow key={domain.id}>
                  <TableCell className="font-medium text-white">{domain.domain}</TableCell>
                  <TableCell>{domain.project_name || <span className="text-slate-500">-</span>}</TableCell>
                  <TableCell>
                    <StatusBadge status={domain.status} />
                  </TableCell>
                  <TableCell>{domain.redirect_count || 0}</TableCell>
                  <TableCell>{domain.backlink_count || 0}</TableCell>
                  <TableCell className="text-slate-400">{formatDate(domain.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Link to={`/domains/${domain.id}`}>
                        <Button variant="ghost" size="icon" title="View details">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(domain)}
                        title="Edit domain"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingDomain(domain)}
                        title="Delete domain"
                        className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
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

      {/* Add Domain Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          resetForm();
        }}
        title="Add Domain"
      >
        <div className="space-y-4">
          <Input
            id="domain"
            label="Domain"
            placeholder="example.com"
            value={formData.domain}
            onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
            required
          />
          <Select
            id="project"
            label="Project"
            options={formProjectOptions}
            value={formData.project_id?.toString() || ''}
            onChange={(e) =>
              setFormData({ ...formData, project_id: e.target.value ? parseInt(e.target.value) : null })
            }
          />
          <Select
            id="status"
            label="Status"
            options={formStatusOptions}
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as DomainStatus })}
          />
          <Input
            id="target_url"
            label="Default Target URL"
            placeholder="https://example.com"
            value={formData.target_url}
            onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
          />
          <Textarea
            id="notes"
            label="Notes"
            placeholder="Add any notes..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddDomain} isLoading={isSubmitting}>
              Add Domain
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Domain Modal */}
      <Modal
        isOpen={!!editingDomain}
        onClose={() => {
          setEditingDomain(null);
          resetForm();
        }}
        title="Edit Domain"
      >
        <div className="space-y-4">
          <Input
            id="edit-domain"
            label="Domain"
            placeholder="example.com"
            value={formData.domain}
            onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
            required
          />
          <Select
            id="edit-project"
            label="Project"
            options={formProjectOptions}
            value={formData.project_id?.toString() || ''}
            onChange={(e) =>
              setFormData({ ...formData, project_id: e.target.value ? parseInt(e.target.value) : null })
            }
          />
          <Select
            id="edit-status"
            label="Status"
            options={formStatusOptions}
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as DomainStatus })}
          />
          <Input
            id="edit-target_url"
            label="Default Target URL"
            placeholder="https://example.com"
            value={formData.target_url}
            onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
          />
          <Textarea
            id="edit-notes"
            label="Notes"
            placeholder="Add any notes..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50">
            <Button
              variant="outline"
              onClick={() => {
                setEditingDomain(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEditDomain} isLoading={isSubmitting}>
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
          setBulkDomains('');
        }}
        title="Bulk Import Domains"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Enter one domain per line. Domains will be created with pending status.
          </p>
          <Textarea
            id="bulk-domains"
            label="Domains"
            placeholder="example1.com&#10;example2.com&#10;example3.com"
            value={bulkDomains}
            onChange={(e) => setBulkDomains(e.target.value)}
            rows={10}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50">
            <Button
              variant="outline"
              onClick={() => {
                setIsBulkModalOpen(false);
                setBulkDomains('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleBulkImport} isLoading={isSubmitting}>
              Import Domains
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingDomain}
        onClose={() => setDeletingDomain(null)}
        title="Delete Domain"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/20">
              <Trash2 className="h-5 w-5 text-rose-400" />
            </div>
            <p className="text-slate-300">
              Are you sure you want to delete <strong className="text-white">{deletingDomain?.domain}</strong>? This will also
              delete all associated redirects and backlinks. This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50">
            <Button variant="outline" onClick={() => setDeletingDomain(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteDomain} isLoading={isSubmitting}>
              Delete Domain
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
