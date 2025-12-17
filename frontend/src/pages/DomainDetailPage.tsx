import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DomainWithBacklinks, Backlink } from '../types';
import { getDomain, updateDomain, activateDomain, deactivateDomain, deleteDomain, checkRedirect, RedirectCheckResult } from '../api/domains';
import { importBacklinks, deleteBacklink, deleteAllBacklinks } from '../api/backlinks';

export default function DomainDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [domain, setDomain] = useState<DomainWithBacklinks | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [checkResult, setCheckResult] = useState<RedirectCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const loadDomain = async () => {
    if (!id) return;
    try {
      const data = await getDomain(parseInt(id));
      setDomain(data);
    } catch (err: any) {
      setError('Failed to load domain');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDomain();
  }, [id]);

  const handleToggleStatus = async () => {
    if (!domain) return;
    try {
      const updated =
        domain.status === 'active'
          ? await deactivateDomain(domain.id)
          : await activateDomain(domain.id);
      setDomain({ ...domain, ...updated });
    } catch (err: any) {
      setError('Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!domain) return;
    if (!confirm(`Are you sure you want to delete ${domain.domain_name}?`)) return;

    try {
      await deleteDomain(domain.id);
      navigate('/');
    } catch (err: any) {
      setError('Failed to delete domain');
    }
  };

  const handleDeleteBacklink = async (backlink: Backlink) => {
    if (!domain) return;
    try {
      await deleteBacklink(backlink.id);
      setDomain({
        ...domain,
        backlinks: domain.backlinks.filter((b) => b.id !== backlink.id),
        backlink_count: domain.backlink_count - 1,
      });
    } catch (err: any) {
      setError('Failed to delete backlink');
    }
  };

  const handleClearAllBacklinks = async () => {
    if (!domain) return;
    if (!confirm('Are you sure you want to delete all backlinks?')) return;

    try {
      await deleteAllBacklinks(domain.id);
      setDomain({ ...domain, backlinks: [], backlink_count: 0 });
    } catch (err: any) {
      setError('Failed to clear backlinks');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(text);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleCheckRedirects = async () => {
    if (!domain) return;
    setIsChecking(true);
    try {
      const result = await checkRedirect(domain.id);
      setCheckResult(result);
    } catch (err: any) {
      setError('Failed to check redirects');
    } finally {
      setIsChecking(false);
    }
  };

  if (isLoading) {
    return <div className="text-gray-400">Loading domain...</div>;
  }

  if (!domain) {
    return <div className="text-red-400">Domain not found</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <Link to="/" className="text-gray-400 hover:text-white text-sm">
          &larr; Back to Domains
        </Link>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Domain Header */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-white">{domain.domain_name}</h1>
            <p className="text-gray-400 mt-1">
              Target: <a href={domain.target_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">{domain.target_url}</a>
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleToggleStatus}
              className={`px-4 py-2 rounded-md font-medium ${
                domain.status === 'active'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-600 hover:bg-gray-500 text-white'
              }`}
            >
              {domain.status === 'active' ? 'Active' : 'Inactive'}
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
            >
              Delete
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-gray-700 rounded p-4">
            <div className="text-gray-400 text-sm">Mode</div>
            <div className="text-white font-medium">{domain.redirect_mode}</div>
          </div>
          <div className="bg-gray-700 rounded p-4">
            <div className="text-gray-400 text-sm">Unmatched Paths</div>
            <div className="text-white font-medium">{domain.unmatched_behavior}</div>
          </div>
          <div className="bg-gray-700 rounded p-4">
            <div className="text-gray-400 text-sm">Backlinks</div>
            <div className="text-white font-medium">{domain.backlink_count}</div>
          </div>
        </div>

        {domain.notes && (
          <div className="mt-4 p-3 bg-gray-700 rounded">
            <div className="text-gray-400 text-sm mb-1">Notes</div>
            <div className="text-gray-200">{domain.notes}</div>
          </div>
        )}
      </div>

      {/* Cloudflare Instructions */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-bold text-white mb-4">Cloudflare DNS Setup</h2>
        <div className="bg-gray-700 rounded p-4 font-mono text-sm">
          <p className="text-gray-300">Add these A records in Cloudflare:</p>
          <div className="mt-2 space-y-1">
            <p className="text-green-400">@ → 89.147.108.50 (Proxied)</p>
            <p className="text-green-400">www → 89.147.108.50 (Proxied)</p>
          </div>
          <p className="text-yellow-400 mt-3">SSL/TLS Mode: Flexible (Important!)</p>
        </div>
      </div>

      {/* Backlinks Section */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-white">
            Backlinks
            {domain.backlinks.length > 0 && (
              <span className="ml-2 text-gray-400 font-normal text-sm">({domain.backlinks.length})</span>
            )}
          </h2>
          <div className="flex items-center space-x-3">
            {domain.backlinks.length > 0 && (
              <>
                <button
                  onClick={handleCheckRedirects}
                  disabled={isChecking}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded-md text-sm"
                >
                  {isChecking ? 'Checking...' : 'Test Redirects'}
                </button>
                <button
                  onClick={handleClearAllBacklinks}
                  className="px-3 py-1 text-red-400 hover:text-red-300 text-sm"
                >
                  Clear All
                </button>
              </>
            )}
            <button
              onClick={() => setShowImportModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
            >
              Import Backlinks
            </button>
          </div>
        </div>

        {/* Check Results */}
        {checkResult && (
          <div className={`mb-4 p-4 rounded-lg border ${
            checkResult.status === 'ok'
              ? 'bg-green-900/30 border-green-600'
              : checkResult.status === 'warning'
              ? 'bg-yellow-900/30 border-yellow-600'
              : 'bg-red-900/30 border-red-600'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`font-medium ${
                checkResult.status === 'ok' ? 'text-green-200' :
                checkResult.status === 'warning' ? 'text-yellow-200' : 'text-red-200'
              }`}>
                {checkResult.message}
              </span>
              <button
                onClick={() => setCheckResult(null)}
                className="text-gray-400 hover:text-white text-sm"
              >
                Dismiss
              </button>
            </div>
            {checkResult.results.length > 0 && (
              <div className="space-y-2 mt-3">
                {checkResult.results.map((result, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-800/50 rounded px-3 py-2 text-sm">
                    <div className="flex items-center space-x-3">
                      <span className={`w-2 h-2 rounded-full ${
                        result.status === 'ok' ? 'bg-green-500' :
                        result.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <span className="text-gray-300 font-mono">{result.path}</span>
                      <span className="text-gray-500">{result.message}</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(result.url)}
                      className={`text-xs px-2 py-1 rounded ${
                        copiedUrl === result.url
                          ? 'bg-green-700 text-green-200'
                          : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      }`}
                    >
                      {copiedUrl === result.url ? 'Copied!' : 'Copy URL'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {domain.backlinks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No backlinks imported yet.</p>
            <button
              onClick={() => setShowImportModal(true)}
              className="mt-2 text-blue-400 hover:text-blue-300"
            >
              Import backlinks
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {domain.backlinks.map((backlink) => (
              <BacklinkRow
                key={backlink.id}
                backlink={backlink}
                domainName={domain.domain_name}
                onDelete={handleDeleteBacklink}
                onCopy={copyToClipboard}
                copiedUrl={copiedUrl}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <EditDomainModal
          domain={domain}
          onClose={() => setIsEditing(false)}
          onSave={(updated) => {
            setDomain({ ...domain, ...updated });
            setIsEditing(false);
          }}
        />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <ImportBacklinksModal
          domainId={domain.id}
          onClose={() => setShowImportModal(false)}
          onImport={(newBacklinks) => {
            setDomain({
              ...domain,
              backlinks: [...domain.backlinks, ...newBacklinks],
              backlink_count: domain.backlink_count + newBacklinks.length,
            });
            setShowImportModal(false);
          }}
        />
      )}
    </div>
  );
}

interface BacklinkRowProps {
  backlink: Backlink;
  domainName: string;
  onDelete: (backlink: Backlink) => void;
  onCopy: (text: string) => void;
  copiedUrl: string | null;
}

function BacklinkRow({ backlink, domainName, onDelete, onCopy, copiedUrl }: BacklinkRowProps) {
  const redirectUrl = `https://${domainName}${backlink.url_path}`;

  return (
    <div className="border border-gray-700 rounded-lg p-4 hover:bg-gray-750">
      <div className="flex flex-col space-y-3">
        {/* Linking URL (where backlink comes from) */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="text-gray-500 text-xs mb-1">Backlink from:</div>
            <a
              href={backlink.linking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-sm break-all"
            >
              {backlink.linking_url}
            </a>
          </div>
          <button
            onClick={() => onCopy(backlink.linking_url)}
            className={`ml-3 text-xs px-2 py-1 rounded flex-shrink-0 ${
              copiedUrl === backlink.linking_url
                ? 'bg-green-700 text-green-200'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            {copiedUrl === backlink.linking_url ? 'Copied!' : 'Copy'}
          </button>
        </div>

        {/* Path and Redirect URL */}
        <div className="flex items-center justify-between bg-gray-900 rounded px-3 py-2">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <span className="text-gray-500 text-xs">Redirects:</span>
            <span className="text-yellow-400 font-mono text-sm">{backlink.url_path}</span>
            <span className="text-gray-500">→</span>
            <span className="text-green-400 font-mono text-sm truncate">Target URL</span>
          </div>
          <div className="flex items-center space-x-2 ml-3">
            <button
              onClick={() => onCopy(redirectUrl)}
              className={`text-xs px-2 py-1 rounded ${
                copiedUrl === redirectUrl
                  ? 'bg-green-700 text-green-200'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
              title={redirectUrl}
            >
              {copiedUrl === redirectUrl ? 'Copied!' : 'Copy Redirect URL'}
            </button>
            <button
              onClick={() => onDelete(backlink)}
              className="text-red-400 hover:text-red-300 text-xs"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface EditDomainModalProps {
  domain: DomainWithBacklinks;
  onClose: () => void;
  onSave: (domain: DomainWithBacklinks) => void;
}

function EditDomainModal({ domain, onClose, onSave }: EditDomainModalProps) {
  const [targetUrl, setTargetUrl] = useState(domain.target_url);
  const [redirectMode, setRedirectMode] = useState(domain.redirect_mode);
  const [unmatchedBehavior, setUnmatchedBehavior] = useState(domain.unmatched_behavior);
  const [notes, setNotes] = useState(domain.notes || '');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const updated = await updateDomain(domain.id, {
        target_url: targetUrl,
        redirect_mode: redirectMode,
        unmatched_behavior: unmatchedBehavior,
        notes: notes || undefined,
      });
      onSave({ ...domain, ...updated });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update domain');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-white mb-4">Edit Domain</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Target URL
            </label>
            <input
              type="url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Redirect Mode
            </label>
            <select
              value={redirectMode}
              onChange={(e) => setRedirectMode(e.target.value as 'full' | 'path-specific')}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="full">Full Domain</option>
              <option value="path-specific">Path-Specific</option>
            </select>
          </div>

          {redirectMode === 'path-specific' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Unmatched Paths
              </label>
              <select
                value={unmatchedBehavior}
                onChange={(e) => setUnmatchedBehavior(e.target.value as '404' | 'homepage')}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="homepage">Redirect to target</option>
                <option value="404">Return 404</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-md"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ImportBacklinksModalProps {
  domainId: number;
  onClose: () => void;
  onImport: (backlinks: Backlink[]) => void;
}

function ImportBacklinksModal({ domainId, onClose, onImport }: ImportBacklinksModalProps) {
  const [csvData, setCsvData] = useState('');
  const [error, setError] = useState('');
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setImportErrors([]);
    setIsLoading(true);

    try {
      const result = await importBacklinks(domainId, csvData);
      if (result.errors && result.errors.length > 0) {
        setImportErrors(result.errors);
      }
      if (result.imported > 0) {
        onImport(result.backlinks);
      } else if (!result.errors || result.errors.length === 0) {
        setError('No backlinks were imported');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to import backlinks');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold text-white mb-4">Import Backlinks</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          {importErrors.length > 0 && (
            <div className="bg-yellow-900/50 border border-yellow-500 text-yellow-200 px-4 py-3 rounded text-sm max-h-32 overflow-auto">
              <div className="font-medium mb-1">Import warnings:</div>
              {importErrors.map((err, i) => (
                <div key={i}>{err}</div>
              ))}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Paste backlinks (CSV format)
            </label>
            <textarea
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={10}
              placeholder="https://blog.example.com/post-about-topic,/old-page
https://news-site.org/article,/another-path"
              required
            />
            <p className="text-gray-500 text-xs mt-1">
              Format: linking_url,path (one per line)
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-md"
            >
              {isLoading ? 'Importing...' : 'Import'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
