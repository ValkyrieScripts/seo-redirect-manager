import { useEffect, useState, useCallback } from 'react';
import { Download, Copy, FileText, Code, List, Check, FileDown, FolderKanban, Globe } from 'lucide-react';
import { exportApi } from '@/api/export';
import { domainsApi } from '@/api/domains';
import { projectsApi } from '@/api/projects';
import type { Domain, Project } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { LoadingState } from '@/components/ui/Spinner';
import { downloadFile, copyToClipboard } from '@/lib/utils';
import toast from 'react-hot-toast';

type ExportType = 'indexnow' | 'csv' | 'urls' | 'nginx' | 'lua';

interface ExportOption {
  id: ExportType;
  name: string;
  description: string;
  icon: React.ElementType;
  extension: string;
  mimeType: string;
}

const exportOptions: ExportOption[] = [
  {
    id: 'indexnow',
    name: 'IndexNow',
    description: 'Export URLs in IndexNow format for search engine submission',
    icon: FileText,
    extension: 'txt',
    mimeType: 'text/plain',
  },
  {
    id: 'csv',
    name: 'CSV Export',
    description: 'Export redirects as a CSV file for spreadsheets',
    icon: FileText,
    extension: 'csv',
    mimeType: 'text/csv',
  },
  {
    id: 'urls',
    name: 'Plain URLs',
    description: 'Simple list of all redirect target URLs',
    icon: List,
    extension: 'txt',
    mimeType: 'text/plain',
  },
  {
    id: 'nginx',
    name: 'Nginx Config',
    description: 'Generate nginx redirect configuration',
    icon: Code,
    extension: 'conf',
    mimeType: 'text/plain',
  },
  {
    id: 'lua',
    name: 'Lua Rules',
    description: 'Generate Lua redirect rules for OpenResty',
    icon: Code,
    extension: 'lua',
    mimeType: 'text/plain',
  },
];

export function ExportPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Selection state
  const [selectedDomains, setSelectedDomains] = useState<Set<number>>(new Set());
  const [selectedProjects, setSelectedProjects] = useState<Set<number>>(new Set());
  const [selectedExport, setSelectedExport] = useState<ExportType>('indexnow');

  // Export state
  const [exportContent, setExportContent] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [domainsData, projectsData] = await Promise.all([
        domainsApi.list(),
        projectsApi.list(),
      ]);
      setDomains(domainsData);
      setProjects(projectsData);
    } catch (err) {
      toast.error('Failed to load data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleDomain = (id: number) => {
    const newSelected = new Set(selectedDomains);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedDomains(newSelected);
  };

  const toggleProject = (id: number) => {
    const newSelected = new Set(selectedProjects);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedProjects(newSelected);
  };

  const selectAllDomains = () => {
    if (selectedDomains.size === domains.length) {
      setSelectedDomains(new Set());
    } else {
      setSelectedDomains(new Set(domains.map((d) => d.id)));
    }
  };

  const selectAllProjects = () => {
    if (selectedProjects.size === projects.length) {
      setSelectedProjects(new Set());
    } else {
      setSelectedProjects(new Set(projects.map((p) => p.id)));
    }
  };

  const getExportParams = () => {
    const params: { domain_ids?: number[]; project_ids?: number[] } = {};
    if (selectedDomains.size > 0) {
      params.domain_ids = Array.from(selectedDomains);
    }
    if (selectedProjects.size > 0) {
      params.project_ids = Array.from(selectedProjects);
    }
    return params;
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportContent('');
    try {
      const params = getExportParams();
      let content: string;

      switch (selectedExport) {
        case 'indexnow':
          content = await exportApi.getIndexNow(params);
          break;
        case 'csv':
          content = await exportApi.getCsv(params);
          break;
        case 'urls':
          content = await exportApi.getUrls(params);
          break;
        case 'nginx':
          content = await exportApi.getNginxConfig(params);
          break;
        case 'lua':
          content = await exportApi.getLuaRules(params);
          break;
        default:
          throw new Error('Invalid export type');
      }

      setExportContent(content);
      toast.success('Export generated successfully');
    } catch (err) {
      toast.error('Failed to generate export');
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownload = () => {
    const option = exportOptions.find((o) => o.id === selectedExport);
    if (!option || !exportContent) return;

    const filename = `redirects-export-${Date.now()}.${option.extension}`;
    downloadFile(exportContent, filename, option.mimeType);
    toast.success('File downloaded');
  };

  const handleCopy = async () => {
    if (!exportContent) return;
    try {
      await copyToClipboard(exportContent);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading export options..." />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
            <FileDown className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Export</h1>
        </div>
        <p className="text-slate-400">
          Export redirects in various formats
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Selection Panel */}
        <div className="space-y-6 lg:col-span-1">
          {/* Domains Selection */}
          <Card className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-400" />
                  <CardTitle className="text-base">Domains</CardTitle>
                </div>
                <Button variant="ghost" size="sm" onClick={selectAllDomains}>
                  {selectedDomains.size === domains.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              <CardDescription>Select domains to include in export</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-48 space-y-2 overflow-y-auto scrollbar-thin">
                {domains.length === 0 ? (
                  <p className="text-sm text-slate-500">No domains found</p>
                ) : (
                  domains.map((domain) => (
                    <div key={domain.id} className="flex items-center">
                      <Checkbox
                        id={`domain-${domain.id}`}
                        checked={selectedDomains.has(domain.id)}
                        onChange={() => toggleDomain(domain.id)}
                        label={domain.domain}
                      />
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Projects Selection */}
          <Card className="animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderKanban className="h-4 w-4 text-purple-400" />
                  <CardTitle className="text-base">Projects</CardTitle>
                </div>
                <Button variant="ghost" size="sm" onClick={selectAllProjects}>
                  {selectedProjects.size === projects.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              <CardDescription>Or select by project</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-48 space-y-2 overflow-y-auto scrollbar-thin">
                {projects.length === 0 ? (
                  <p className="text-sm text-slate-500">No projects found</p>
                ) : (
                  projects.map((project) => (
                    <div key={project.id} className="flex items-center">
                      <Checkbox
                        id={`project-${project.id}`}
                        checked={selectedProjects.has(project.id)}
                        onChange={() => toggleProject(project.id)}
                        label={`${project.name} (${project.domain_count || 0} domains)`}
                      />
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Export Options & Preview */}
        <div className="space-y-6 lg:col-span-2">
          {/* Export Format Selection */}
          <Card className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <CardHeader>
              <CardTitle className="text-base">Export Format</CardTitle>
              <CardDescription>Choose the output format</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {exportOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedExport(option.id)}
                    className={`flex flex-col items-start rounded-xl border p-4 text-left transition-all duration-200 ${
                      selectedExport === option.id
                        ? 'border-primary-500/50 bg-primary-500/10'
                        : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600/50 hover:bg-slate-800/50'
                    }`}
                  >
                    <option.icon
                      className={`mb-2 h-5 w-5 ${
                        selectedExport === option.id ? 'text-primary-400' : 'text-slate-400'
                      }`}
                    />
                    <span className={`font-medium ${
                      selectedExport === option.id ? 'text-white' : 'text-slate-300'
                    }`}>
                      {option.name}
                    </span>
                    <span className="mt-1 text-xs text-slate-500">
                      {option.description}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-4 flex justify-end">
                <Button onClick={handleExport} isLoading={isExporting}>
                  Generate Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Export Preview */}
          {exportContent && (
            <Card className="animate-fade-in">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Export Preview</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopy}>
                      {copied ? (
                        <>
                          <Check className="mr-1 h-4 w-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="mr-1 h-4 w-4" />
                          Copy
                        </>
                      )}
                    </Button>
                    <Button size="sm" onClick={handleDownload}>
                      <Download className="mr-1 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="max-h-96 overflow-auto rounded-xl bg-slate-950 border border-slate-800 p-4 text-sm text-slate-300 font-mono">
                  <code>{exportContent}</code>
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
