import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Globe,
  ArrowRight,
  Upload,
  ChevronDown,
  ChevronRight,
  Trash2,
  Check,
  Clock,
  Edit2,
  X as XIcon,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { domainsApi } from '@/api/domains';
import { backlinksApi } from '@/api/backlinks';
import type { Domain, GroupedBacklink } from '@/types';
import toast from 'react-hot-toast';

export function DomainDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const domainId = parseInt(id || '0');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [domain, setDomain] = useState<Domain | null>(null);
  const [groupedBacklinks, setGroupedBacklinks] = useState<GroupedBacklink[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [newTargetUrl, setNewTargetUrl] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [uploading, setUploading] = useState(false);

  const serverIP = '89.147.108.50';

  const fetchData = useCallback(async () => {
    if (!domainId) return;
    try {
      const [domainData, backlinksData] = await Promise.all([
        domainsApi.get(domainId),
        backlinksApi.getGrouped(domainId),
      ]);
      setDomain(domainData);
      setGroupedBacklinks(backlinksData);
      setNewTargetUrl(domainData.target_url || '');
    } catch (err) {
      toast.error('Failed to load domain details');
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [domainId, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const togglePath = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleUpdateTarget = async () => {
    if (!domain) return;
    try {
      await domainsApi.update(domain.id, { target_url: newTargetUrl });
      toast.success('Target URL updated');
      setIsEditingTarget(false);
      fetchData();
    } catch (err) {
      toast.error('Failed to update target URL');
    }
  };

  const handleStatusToggle = async () => {
    if (!domain) return;
    const newStatus = domain.status === 'active' ? 'inactive' : 'active';
    try {
      await domainsApi.update(domain.id, { status: newStatus });
      toast.success(`Domain ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      fetchData();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await backlinksApi.import(domainId, file);
      toast.success(`Imported ${result.imported} backlinks (${result.skipped} skipped)`);
      fetchData();
    } catch (err) {
      toast.error('Failed to import backlinks');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteDomain = async () => {
    if (!domain) return;
    try {
      await domainsApi.delete(domain.id);
      toast.success('Domain deleted');
      navigate('/');
    } catch (err) {
      toast.error('Failed to delete domain');
    }
  };

  const handleClearBacklinks = async () => {
    try {
      await backlinksApi.deleteAll(domainId);
      toast.success('All backlinks cleared');
      fetchData();
    } catch (err) {
      toast.error('Failed to clear backlinks');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
            <Check className="h-3 w-3" /> Active
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
            <Clock className="h-3 w-3" /> Pending
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-slate-500/20 text-slate-400 border border-slate-500/30">
            Inactive
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!domain) {
    return (
      <div className="p-6 lg:p-8 text-center">
        <p className="text-slate-400">Domain not found</p>
        <Link to="/" className="text-blue-400 hover:underline mt-2 inline-block">
          Back to domains
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/"
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Globe className="h-6 w-6 text-blue-400" />
            <h1 className="text-2xl font-bold text-white">{domain.domain_name}</h1>
            {getStatusBadge(domain.status)}
          </div>
        </div>
        <button
          onClick={handleStatusToggle}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            domain.status === 'active'
              ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
              : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
          }`}
        >
          {domain.status === 'active' ? 'Deactivate' : 'Activate'}
        </button>
      </div>

      {/* Target URL Section */}
      <div className="p-5 bg-slate-800/50 rounded-xl border border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium text-slate-400">Target URL</h2>
          {!isEditingTarget && (
            <button
              onClick={() => setIsEditingTarget(true)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Edit2 className="h-4 w-4" />
            </button>
          )}
        </div>
        {isEditingTarget ? (
          <div className="flex gap-2">
            <input
              type="url"
              value={newTargetUrl}
              onChange={(e) => setNewTargetUrl(e.target.value)}
              className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://mysite.com"
            />
            <button
              onClick={handleUpdateTarget}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => {
                setIsEditingTarget(false);
                setNewTargetUrl(domain.target_url || '');
              }}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-slate-500" />
            <a
              href={domain.target_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline flex items-center gap-1"
            >
              {domain.target_url || 'No target set'}
              {domain.target_url && <ExternalLink className="h-3 w-3" />}
            </a>
          </div>
        )}
        <p className="mt-2 text-xs text-slate-500">
          All traffic from this domain will 301 redirect here
        </p>
      </div>

      {/* Cloudflare DNS Section */}
      <div className="p-5 bg-slate-800/50 rounded-xl border border-slate-700">
        <h2 className="text-lg font-semibold text-white mb-4">Cloudflare DNS Setup</h2>
        <p className="text-slate-400 text-sm mb-4">
          Add these DNS records in Cloudflare:
        </p>
        <div className="space-y-3">
          <div className="p-4 bg-slate-900 rounded-lg border border-slate-700 flex items-center justify-between">
            <div className="font-mono text-sm space-y-1">
              <p className="text-slate-400">Type: <span className="text-white">A</span> | Name: <span className="text-white">@</span> | Content: <span className="text-blue-400">{serverIP}</span></p>
            </div>
            <button
              onClick={() => copyToClipboard(serverIP)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <div className="p-4 bg-slate-900 rounded-lg border border-slate-700 flex items-center justify-between">
            <div className="font-mono text-sm space-y-1">
              <p className="text-slate-400">Type: <span className="text-white">A</span> | Name: <span className="text-white">www</span> | Content: <span className="text-blue-400">{serverIP}</span></p>
            </div>
            <button
              onClick={() => copyToClipboard(serverIP)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
        </div>
        <p className="mt-4 text-xs text-amber-400">
          Enable the proxy (orange cloud) and set SSL mode to "Full"
        </p>
      </div>

      {/* Backlinks Section */}
      <div className="p-5 bg-slate-800/50 rounded-xl border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            Backlinks
            <span className="ml-2 text-sm font-normal text-slate-400">
              ({domain.backlink_count || 0} total)
            </span>
          </h2>
          <div className="flex gap-2">
            {groupedBacklinks.length > 0 && (
              <button
                onClick={handleClearBacklinks}
                className="px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
              >
                Clear All
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              {uploading ? 'Uploading...' : 'Upload CSV/TXT'}
            </button>
          </div>
        </div>

        <p className="text-slate-400 text-sm mb-4">
          Format: <code className="bg-slate-900 px-2 py-0.5 rounded text-xs">linking_site,url_path</code> (e.g., <code className="bg-slate-900 px-2 py-0.5 rounded text-xs">example.com,/old-page</code>)
        </p>

        {groupedBacklinks.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Upload className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>No backlinks uploaded yet</p>
            <p className="text-sm mt-1">Upload a CSV or TXT file to see backlinks</p>
          </div>
        ) : (
          <div className="space-y-2">
            {groupedBacklinks.map((group) => (
              <div key={group.url_path} className="border border-slate-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => togglePath(group.url_path)}
                  className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    {expandedPaths.has(group.url_path) ? (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    )}
                    <span className="font-mono text-white">{group.url_path}</span>
                  </div>
                  <span className="text-sm text-slate-400">
                    {group.count} backlink{group.count !== 1 ? 's' : ''}
                  </span>
                </button>
                {expandedPaths.has(group.url_path) && (
                  <div className="border-t border-slate-700 bg-slate-900/50 p-4">
                    <div className="space-y-2">
                      {group.linking_sites.map((site, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-300">{site}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Domain */}
      <div className="p-5 bg-red-500/10 rounded-xl border border-red-500/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-medium">Delete Domain</h3>
            <p className="text-sm text-slate-400 mt-1">
              Permanently delete this domain and all its backlinks
            </p>
          </div>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-800 rounded-xl border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white">Delete Domain</h2>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-slate-300">
                Are you sure you want to delete <strong className="text-white">{domain.domain_name}</strong>?
                This will also delete all associated backlinks.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteDomain}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
