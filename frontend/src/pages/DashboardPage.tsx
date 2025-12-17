import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Domain } from '../types';
import { getDomains, createDomain, deleteDomain, activateDomain, deactivateDomain, checkRedirect, RedirectCheckResult } from '../api/domains';

export default function DashboardPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [checkingDomains, setCheckingDomains] = useState<Set<number>>(new Set());
  const [checkResults, setCheckResults] = useState<Record<number, RedirectCheckResult>>({});

  const loadDomains = async () => {
    try {
      const data = await getDomains();
      setDomains(data);
    } catch (err: any) {
      setError('Failed to load domains');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDomains();
  }, []);

  const handleDelete = async (id: number, domainName: string) => {
    if (!confirm(`Are you sure you want to delete ${domainName}?`)) return;

    try {
      await deleteDomain(id);
      setDomains(domains.filter((d) => d.id !== id));
    } catch (err: any) {
      setError('Failed to delete domain');
    }
  };

  const handleToggleStatus = async (domain: Domain) => {
    try {
      const updated =
        domain.status === 'active'
          ? await deactivateDomain(domain.id)
          : await activateDomain(domain.id);
      setDomains(domains.map((d) => (d.id === domain.id ? { ...d, ...updated } : d)));
    } catch (err: any) {
      setError('Failed to update domain status');
    }
  };

  const handleCheckRedirect = async (domain: Domain) => {
    setCheckingDomains((prev) => new Set([...prev, domain.id]));
    try {
      const result = await checkRedirect(domain.id);
      setCheckResults((prev) => ({ ...prev, [domain.id]: result }));
    } catch (err: any) {
      setCheckResults((prev) => ({
        ...prev,
        [domain.id]: {
          status: 'error',
          redirecting: false,
          message: 'Failed to check redirect'
        }
      }));
    } finally {
      setCheckingDomains((prev) => {
        const next = new Set(prev);
        next.delete(domain.id);
        return next;
      });
    }
  };

  if (isLoading) {
    return <div className="text-gray-400">Loading domains...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Domains</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
        >
          Add Domain
        </button>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {domains.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-400">No domains added yet.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 text-blue-400 hover:text-blue-300"
          >
            Add your first domain
          </button>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Domain
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Mode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Backlinks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Redirect
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {domains.map((domain) => (
                <tr key={domain.id} className="hover:bg-gray-750">
                  <td className="px-6 py-4">
                    <Link
                      to={`/domain/${domain.id}`}
                      className="text-blue-400 hover:text-blue-300 font-medium"
                    >
                      {domain.domain_name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-gray-300 text-sm truncate max-w-xs">
                    {domain.target_url}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        domain.redirect_mode === 'full'
                          ? 'bg-purple-900 text-purple-200'
                          : 'bg-yellow-900 text-yellow-200'
                      }`}
                    >
                      {domain.redirect_mode}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{domain.backlink_count || 0}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleStatus(domain)}
                      className={`px-2 py-1 text-xs rounded ${
                        domain.status === 'active'
                          ? 'bg-green-900 text-green-200 hover:bg-green-800'
                          : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                      }`}
                    >
                      {domain.status}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    {checkingDomains.has(domain.id) ? (
                      <span className="text-gray-400 text-xs">Checking...</span>
                    ) : checkResults[domain.id] ? (
                      <div className="flex items-center space-x-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            checkResults[domain.id].status === 'ok' && checkResults[domain.id].matchesTarget
                              ? 'bg-green-500'
                              : checkResults[domain.id].status === 'ok'
                              ? 'bg-yellow-500'
                              : checkResults[domain.id].status === 'warning'
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                        />
                        <button
                          onClick={() => handleCheckRedirect(domain)}
                          className="text-gray-400 hover:text-white text-xs underline"
                          title={checkResults[domain.id].message}
                        >
                          {checkResults[domain.id].statusCode || (checkResults[domain.id].status === 'error' ? 'Error' : '?')}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleCheckRedirect(domain)}
                        className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded"
                      >
                        Check
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/domain/${domain.id}`}
                      className="text-gray-400 hover:text-white mr-4"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(domain.id, domain.domain_name)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <AddDomainModal
          onClose={() => setShowAddModal(false)}
          onAdd={(domain) => {
            setDomains([domain, ...domains]);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}

interface AddDomainModalProps {
  onClose: () => void;
  onAdd: (domain: Domain) => void;
}

function AddDomainModal({ onClose, onAdd }: AddDomainModalProps) {
  const [step, setStep] = useState<'form' | 'instructions'>('form');
  const [createdDomain, setCreatedDomain] = useState<Domain | null>(null);
  const [domainName, setDomainName] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [redirectMode, setRedirectMode] = useState<'full' | 'path-specific'>('full');
  const [unmatchedBehavior, setUnmatchedBehavior] = useState<'404' | 'homepage'>('homepage');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const domain = await createDomain({
        domain_name: domainName,
        target_url: targetUrl,
        redirect_mode: redirectMode,
        unmatched_behavior: unmatchedBehavior,
        notes: notes || undefined,
      });
      setCreatedDomain(domain);
      setStep('instructions');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create domain');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = () => {
    if (createdDomain) {
      onAdd(createdDomain);
    }
    onClose();
  };

  if (step === 'instructions' && createdDomain) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white">Domain Added!</h2>
          </div>

          <div className="bg-gray-700 rounded-lg p-4 mb-4">
            <p className="text-gray-300 text-sm mb-2">
              <span className="text-gray-400">Domain:</span> <span className="text-white font-mono">{createdDomain.domain_name}</span>
            </p>
            <p className="text-gray-300 text-sm">
              <span className="text-gray-400">Target:</span> <span className="text-blue-400">{createdDomain.target_url}</span>
            </p>
          </div>

          <h3 className="text-lg font-semibold text-white mb-3">Cloudflare DNS Setup</h3>

          <div className="bg-gray-900 rounded-lg p-4 mb-4">
            <p className="text-gray-400 text-sm mb-3">Add these DNS records in Cloudflare for <span className="text-white font-mono">{createdDomain.domain_name}</span>:</p>

            <div className="space-y-2 font-mono text-sm">
              <div className="flex items-center justify-between bg-gray-800 rounded px-3 py-2">
                <span className="text-gray-400">Type:</span>
                <span className="text-green-400">A</span>
              </div>
              <div className="flex items-center justify-between bg-gray-800 rounded px-3 py-2">
                <span className="text-gray-400">Name:</span>
                <span className="text-yellow-400">@</span>
              </div>
              <div className="flex items-center justify-between bg-gray-800 rounded px-3 py-2">
                <span className="text-gray-400">Content:</span>
                <span className="text-blue-400">89.147.108.50</span>
              </div>
              <div className="flex items-center justify-between bg-gray-800 rounded px-3 py-2">
                <span className="text-gray-400">Proxy:</span>
                <span className="text-orange-400">Proxied (orange cloud)</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-700">
              <p className="text-gray-400 text-xs mb-2">Also add for www:</p>
              <div className="flex items-center justify-between bg-gray-800 rounded px-3 py-2 font-mono text-sm">
                <span className="text-gray-400">Name:</span>
                <span className="text-yellow-400">www</span>
                <span className="text-gray-400">-&gt;</span>
                <span className="text-blue-400">89.147.108.50</span>
              </div>
            </div>
          </div>

          <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3 mb-4">
            <p className="text-yellow-200 text-sm">
              <strong>Important:</strong> Set SSL/TLS mode to <span className="font-mono bg-yellow-900/50 px-1 rounded">Flexible</span> in Cloudflare SSL/TLS settings.
            </p>
          </div>

          <div className="text-gray-400 text-sm mb-4">
            <p>Next steps:</p>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Configure Cloudflare DNS as shown above</li>
              <li>Import your backlinks (optional)</li>
              <li>Activate the domain when ready</li>
            </ol>
          </div>

          <div className="flex justify-end space-x-3">
            <Link
              to={`/domain/${createdDomain.id}`}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
              onClick={() => onAdd(createdDomain)}
            >
              Go to Domain
            </Link>
            <button
              onClick={handleFinish}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-white mb-4">Add Domain</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Domain Name
            </label>
            <input
              type="text"
              value={domainName}
              onChange={(e) => setDomainName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="expired-domain.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Target URL
            </label>
            <input
              type="url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://your-site.com"
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
              <option value="full">Full Domain (all paths redirect)</option>
              <option value="path-specific">Path-Specific (only backlink paths)</option>
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
                <option value="homepage">Redirect to target (more juice)</option>
                <option value="404">Return 404 (cleaner)</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any notes about this domain..."
              rows={2}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-md transition-colors"
            >
              {isLoading ? 'Adding...' : 'Add Domain'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
