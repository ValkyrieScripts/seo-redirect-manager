import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { domainsApi } from '../api/domains';
import { backlinksApi } from '../api/backlinks';
import type { Domain, GroupedBacklink } from '../types';
import toast from 'react-hot-toast';

export function DomainDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const domainId = parseInt(id || '0');

  const [domain, setDomain] = useState<Domain | null>(null);
  const [backlinks, setBacklinks] = useState<GroupedBacklink[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetUrl, setTargetUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const serverIp = '89.147.108.50';

  useEffect(() => {
    if (!domainId) return;
    loadData();
  }, [domainId]);

  const loadData = async () => {
    try {
      const [d, b] = await Promise.all([
        domainsApi.get(domainId),
        backlinksApi.getGrouped(domainId),
      ]);
      setDomain(d);
      setBacklinks(b);
      setTargetUrl(d.target_url || '');
    } catch {
      toast.error('Failed to load domain');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const saveTarget = async () => {
    try {
      await domainsApi.update(domainId, { target_url: targetUrl });
      toast.success('Target updated');
      setEditingTarget(false);
      loadData();
    } catch {
      toast.error('Failed to update');
    }
  };

  const toggleStatus = async () => {
    if (!domain) return;
    const newStatus = domain.status === 'active' ? 'inactive' : 'active';
    try {
      await domainsApi.update(domainId, { status: newStatus });
      toast.success(newStatus === 'active' ? 'Activated' : 'Deactivated');
      loadData();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await backlinksApi.import(domainId, file);
      toast.success(`Imported ${result.imported} backlinks`);
      loadData();
    } catch {
      toast.error('Failed to import');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const clearBacklinks = async () => {
    try {
      await backlinksApi.deleteAll(domainId);
      toast.success('Backlinks cleared');
      loadData();
    } catch {
      toast.error('Failed to clear');
    }
  };

  const deleteDomain = async () => {
    try {
      await domainsApi.delete(domainId);
      toast.success('Domain deleted');
      navigate('/');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
  };

  const toggle = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!domain) return null;

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link to="/" className="text-slate-400 hover:text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{domain.domain_name}</h1>
        </div>
        <span className={`px-3 py-1 text-sm font-medium rounded-full ${
          domain.status === 'active'
            ? 'bg-green-500/20 text-green-400'
            : domain.status === 'pending'
            ? 'bg-yellow-500/20 text-yellow-400'
            : 'bg-slate-500/20 text-slate-400'
        }`}>
          {domain.status}
        </span>
        <button
          onClick={toggleStatus}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            domain.status === 'active'
              ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
              : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
          }`}
        >
          {domain.status === 'active' ? 'Deactivate' : 'Activate'}
        </button>
      </div>

      {/* Target URL */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium text-slate-400">Target URL</h2>
          {!editingTarget && (
            <button onClick={() => setEditingTarget(true)} className="text-slate-400 hover:text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          )}
        </div>
        {editingTarget ? (
          <div className="flex gap-2">
            <input
              type="url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
            <button onClick={saveTarget} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Save
            </button>
            <button onClick={() => { setEditingTarget(false); setTargetUrl(domain.target_url || ''); }} className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">
              Cancel
            </button>
          </div>
        ) : (
          <p className="text-white">{domain.target_url || 'No target set'}</p>
        )}
        <p className="text-xs text-slate-500 mt-2">All traffic 301 redirects here</p>
      </div>

      {/* DNS */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Cloudflare DNS</h2>
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
            <code className="text-sm text-slate-300">A | @ | <span className="text-blue-400">{serverIp}</span></code>
            <button onClick={() => copy(serverIp)} className="text-slate-400 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
            <code className="text-sm text-slate-300">A | www | <span className="text-blue-400">{serverIp}</span></code>
            <button onClick={() => copy(serverIp)} className="text-slate-400 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>
        <p className="text-xs text-yellow-400">Enable proxy (orange cloud) • SSL mode: Full</p>
      </div>

      {/* Backlinks */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            Backlinks <span className="text-sm font-normal text-slate-400">({domain.backlink_count || 0})</span>
          </h2>
          <div className="flex gap-2">
            {backlinks.length > 0 && (
              <button onClick={clearBacklinks} className="px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/20 rounded-lg">
                Clear All
              </button>
            )}
            <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleUpload} className="hidden" />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload CSV'}
            </button>
          </div>
        </div>

        <p className="text-sm text-slate-400 mb-4">
          Format: <code className="bg-slate-900 px-2 py-0.5 rounded text-xs">linking_site,url_path</code>
        </p>

        {backlinks.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p>No backlinks yet</p>
            <p className="text-sm mt-1">Upload a CSV file to import backlinks</p>
          </div>
        ) : (
          <div className="space-y-2">
            {backlinks.map((group) => (
              <div key={group.url_path} className="border border-slate-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggle(group.url_path)}
                  className="w-full flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-700/50 text-left"
                >
                  <div className="flex items-center gap-2">
                    <svg className={`w-4 h-4 text-slate-400 transition-transform ${expanded.has(group.url_path) ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <code className="text-white">{group.url_path}</code>
                  </div>
                  <span className="text-sm text-slate-400">{group.count} backlinks</span>
                </button>
                {expanded.has(group.url_path) && (
                  <div className="p-3 bg-slate-900/50 border-t border-slate-700 space-y-1">
                    {group.linking_sites.map((site, i) => (
                      <div key={i} className="text-sm text-slate-300 pl-6">• {site}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete */}
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-medium">Delete Domain</h3>
            <p className="text-sm text-slate-400">Permanently remove this domain</p>
          </div>
          <button
            onClick={() => setShowDelete(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Delete Modal */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Delete Domain?</h2>
            <p className="text-slate-300 mb-6">
              Are you sure you want to delete <strong>{domain.domain_name}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(false)} className="flex-1 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">
                Cancel
              </button>
              <button onClick={deleteDomain} className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
