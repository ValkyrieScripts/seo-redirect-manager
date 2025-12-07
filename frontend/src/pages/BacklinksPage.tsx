import { useEffect, useState, useCallback } from 'react';
import { Search, Upload, ArrowRightLeft, ExternalLink } from 'lucide-react';
import { backlinksApi } from '@/api/backlinks';
import { domainsApi } from '@/api/domains';
import type { Backlink, Domain, BacklinkPath } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { FileUpload } from '@/components/ui/FileUpload';
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

export function BacklinksPage() {
  const [backlinks, setBacklinks] = useState<Backlink[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [backlinkPaths, setBacklinkPaths] = useState<BacklinkPath[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'backlinks' | 'paths'>('backlinks');

  // Modal states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

  // Form states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importDomainId, setImportDomainId] = useState<number>(0);
  const [generateDomainId, setGenerateDomainId] = useState<number>(0);
  const [generateTargetUrl, setGenerateTargetUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [backlinksData, domainsData] = await Promise.all([
        backlinksApi.list({
          domain_id: domainFilter ? parseInt(domainFilter) : undefined,
        }),
        domainsApi.list(),
      ]);
      setBacklinks(backlinksData);
      setDomains(domainsData);

      // Fetch paths if a domain is selected
      if (domainFilter) {
        const pathsData = await backlinksApi.getPaths(parseInt(domainFilter));
        setBacklinkPaths(pathsData);
      } else {
        setBacklinkPaths([]);
      }
    } catch (err) {
      toast.error('Failed to load backlinks');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [domainFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredBacklinks = backlinks.filter(
    (backlink) =>
      backlink.referring_page.toLowerCase().includes(search.toLowerCase()) ||
      backlink.target_url.toLowerCase().includes(search.toLowerCase()) ||
      (backlink.anchor_text && backlink.anchor_text.toLowerCase().includes(search.toLowerCase()))
  );

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    // Parse CSV to get row count for preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const lines = content.trim().split('\n');
      setPreviewCount(lines.length - 1); // Subtract header row
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!selectedFile || !importDomainId) {
      toast.error('Please select a file and domain');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await backlinksApi.import(importDomainId, selectedFile);
      toast.success(`Imported ${result.imported} backlinks`);
      if (result.errors.length > 0) {
        toast.error(`${result.errors.length} errors occurred`);
        console.error('Import errors:', result.errors);
      }
      setIsImportModalOpen(false);
      setSelectedFile(null);
      setImportDomainId(0);
      setPreviewCount(null);
      fetchData();
    } catch (err) {
      toast.error('Failed to import backlinks');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateRedirects = async () => {
    if (!generateDomainId || !generateTargetUrl) {
      toast.error('Please select a domain and enter a target URL');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await backlinksApi.generateRedirects(generateDomainId, generateTargetUrl);
      toast.success(`Generated ${result.created} redirects`);
      setIsGenerateModalOpen(false);
      setGenerateDomainId(0);
      setGenerateTargetUrl('');
    } catch (err) {
      toast.error('Failed to generate redirects');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const domainOptions = [
    { value: '', label: 'All Domains' },
    ...domains.map((d) => ({ value: d.id.toString(), label: d.domain })),
  ];

  const formDomainOptions = domains.map((d) => ({ value: d.id.toString(), label: d.domain }));

  const tabs = [
    { id: 'backlinks', label: 'All Backlinks', count: filteredBacklinks.length },
    { id: 'paths', label: 'Unique Paths', count: backlinkPaths.length },
  ] as const;

  if (isLoading) {
    return <LoadingState message="Loading backlinks..." />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Backlinks</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Import and manage backlink data from Ahrefs
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsGenerateModalOpen(true)}>
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Generate Redirects
          </Button>
          <Button onClick={() => setIsImportModalOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
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
                  placeholder="Search backlinks..."
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

      {/* Stats */}
      {domainFilter && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Backlinks</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredBacklinks.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Unique Paths</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{backlinkPaths.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Traffic</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {backlinkPaths.reduce((sum, p) => sum + (p.total_traffic || 0), 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Card>
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
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
        </CardHeader>
        <CardContent className="p-0">
          {activeTab === 'backlinks' && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead>Referring Page</TableHead>
                  <TableHead>Target URL</TableHead>
                  <TableHead>Anchor</TableHead>
                  <TableHead>DR</TableHead>
                  <TableHead>UR</TableHead>
                  <TableHead>Traffic</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBacklinks.length === 0 ? (
                  <TableEmpty colSpan={7} message="No backlinks found. Import a CSV to get started." />
                ) : (
                  filteredBacklinks.map((backlink) => (
                    <TableRow key={backlink.id}>
                      <TableCell className="font-medium">{backlink.domain_name || '-'}</TableCell>
                      <TableCell className="max-w-xs">
                        <a
                          href={backlink.referring_page}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary-600 hover:underline"
                        >
                          {truncate(backlink.referring_page, 40)}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{truncate(backlink.target_url, 40)}</TableCell>
                      <TableCell className="max-w-xs truncate">{backlink.anchor_text || '-'}</TableCell>
                      <TableCell>{backlink.domain_rating ?? '-'}</TableCell>
                      <TableCell>{backlink.url_rating ?? '-'}</TableCell>
                      <TableCell>{backlink.traffic?.toLocaleString() ?? '-'}</TableCell>
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
                  <TableEmpty colSpan={5} message="Select a domain to see unique paths" />
                ) : (
                  backlinkPaths.map((path) => (
                    <TableRow key={path.path}>
                      <TableCell className="font-mono text-sm">{path.path}</TableCell>
                      <TableCell>{path.count}</TableCell>
                      <TableCell>{path.avg_dr?.toFixed(1) ?? '-'}</TableCell>
                      <TableCell>{path.avg_ur?.toFixed(1) ?? '-'}</TableCell>
                      <TableCell>{path.total_traffic?.toLocaleString() ?? '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setSelectedFile(null);
          setImportDomainId(0);
          setPreviewCount(null);
        }}
        title="Import Ahrefs CSV"
        size="lg"
      >
        <div className="space-y-4">
          <Select
            id="import-domain"
            label="Domain"
            options={formDomainOptions}
            value={importDomainId.toString()}
            onChange={(e) => setImportDomainId(parseInt(e.target.value))}
            placeholder="Select a domain"
          />

          <FileUpload
            label="Ahrefs Export File"
            description="Upload a CSV file exported from Ahrefs"
            accept=".csv"
            onFileSelect={handleFileSelect}
          />

          {previewCount !== null && (
            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
              <p className="text-sm text-blue-700 dark:text-blue-400">
                Found <strong>{previewCount}</strong> backlinks to import
              </p>
            </div>
          )}

          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Expected CSV Columns:</h4>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <li>- Referring Page URL</li>
              <li>- Target URL</li>
              <li>- Anchor Text</li>
              <li>- DR (Domain Rating)</li>
              <li>- UR (URL Rating)</li>
              <li>- Traffic</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsImportModalOpen(false);
                setSelectedFile(null);
                setImportDomainId(0);
                setPreviewCount(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleImport} isLoading={isSubmitting} disabled={!selectedFile || !importDomainId}>
              Import Backlinks
            </Button>
          </div>
        </div>
      </Modal>

      {/* Generate Redirects Modal */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => {
          setIsGenerateModalOpen(false);
          setGenerateDomainId(0);
          setGenerateTargetUrl('');
        }}
        title="Generate Redirects from Backlinks"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This will create 301 redirects for all unique backlink paths to your specified target URL.
          </p>

          <Select
            id="generate-domain"
            label="Domain"
            options={formDomainOptions}
            value={generateDomainId.toString()}
            onChange={(e) => setGenerateDomainId(parseInt(e.target.value))}
            placeholder="Select a domain"
          />

          <Input
            id="generate-target"
            label="Target URL"
            placeholder="https://example.com/new-page"
            value={generateTargetUrl}
            onChange={(e) => setGenerateTargetUrl(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsGenerateModalOpen(false);
                setGenerateDomainId(0);
                setGenerateTargetUrl('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleGenerateRedirects} isLoading={isSubmitting} disabled={!generateDomainId || !generateTargetUrl}>
              Generate Redirects
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
