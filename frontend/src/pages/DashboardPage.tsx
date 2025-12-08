import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Domain } from '../types';
import { getDomains, createDomain, deleteDomain, activateDomain, deactivateDomain } from '../api/domains';

export default function DashboardPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

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
      onAdd(domain);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create domain');
    } finally {
      setIsLoading(false);
    }
  };

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
