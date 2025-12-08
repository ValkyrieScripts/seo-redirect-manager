import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Globe, ArrowRight, Check, Clock, X as XIcon } from 'lucide-react';
import { domainsApi } from '@/api/domains';
import type { Domain, DomainFormData } from '@/types';
import toast from 'react-hot-toast';

export function DashboardPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCloudflareModal, setShowCloudflareModal] = useState(false);
  const [newDomain, setNewDomain] = useState<Domain | null>(null);

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
      const data = await domainsApi.list();
      setDomains(data);
    } catch (error) {
      toast.error('Failed to load domains');
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Domains</h1>
          <p className="mt-1 text-slate-400">Manage your redirect domains</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
        >
          <Plus className="h-5 w-5" />
          Add Domain
        </button>
      </div>

      {/* Domain List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : domains.length === 0 ? (
        <div className="text-center py-16 bg-slate-800/50 rounded-xl border border-slate-700">
          <Globe className="h-12 w-12 text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No domains yet</h3>
          <p className="text-slate-400 mb-6">Add your first domain to start redirecting traffic</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Add Domain
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {domains.map((domain) => (
            <Link
              key={domain.id}
              to={`/domains/${domain.id}`}
              className="block p-5 bg-slate-800/50 hover:bg-slate-800 rounded-xl border border-slate-700 hover:border-slate-600 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-700/50 group-hover:bg-blue-600/20 transition-colors">
                    <Globe className="h-6 w-6 text-slate-400 group-hover:text-blue-400 transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                      {domain.domain_name}
                    </h3>
                    <p className="text-sm text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <ArrowRight className="h-3 w-3" />
                      {domain.target_url || 'No target set'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-white">
                      {domain.backlink_count || 0}
                    </p>
                    <p className="text-xs text-slate-500">backlinks</p>
                  </div>
                  {getStatusBadge(domain.status)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Add Domain Modal */}
      {showAddModal && (
        <AddDomainModal
          onClose={() => setShowAddModal(false)}
          onSuccess={(domain) => {
            setNewDomain(domain);
            setShowAddModal(false);
            setShowCloudflareModal(true);
            fetchDomains();
          }}
        />
      )}

      {/* Cloudflare Instructions Modal */}
      {showCloudflareModal && newDomain && (
        <CloudflareModal
          domain={newDomain}
          onClose={() => {
            setShowCloudflareModal(false);
            setNewDomain(null);
          }}
        />
      )}
    </div>
  );
}

// Add Domain Modal Component
function AddDomainModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (domain: Domain) => void;
}) {
  const [formData, setFormData] = useState<DomainFormData>({
    domain_name: '',
    target_url: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.domain_name || !formData.target_url) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const domain = await domainsApi.create(formData);
      toast.success('Domain added successfully');
      onSuccess(domain);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add domain');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-800 rounded-xl border border-slate-700 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Add Domain</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Domain Name
            </label>
            <input
              type="text"
              value={formData.domain_name}
              onChange={(e) =>
                setFormData({ ...formData, domain_name: e.target.value })
              }
              placeholder="expired-domain.com"
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Target URL
            </label>
            <input
              type="url"
              value={formData.target_url}
              onChange={(e) =>
                setFormData({ ...formData, target_url: e.target.value })
              }
              placeholder="https://mysite.com"
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <p className="mt-2 text-xs text-slate-500">
              All traffic from this domain will redirect here (301)
            </p>
          </div>
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Domain'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Cloudflare Instructions Modal
function CloudflareModal({
  domain,
  onClose,
}: {
  domain: Domain;
  onClose: () => void;
}) {
  const serverIP = '89.147.108.50';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-800 rounded-xl border border-slate-700 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Cloudflare DNS Setup</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5 space-y-5">
          <p className="text-slate-300">
            Add these DNS records in Cloudflare for{' '}
            <span className="font-semibold text-white">{domain.domain_name}</span>:
          </p>

          {/* DNS Records */}
          <div className="space-y-3">
            <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
              <div className="flex items-center justify-between">
                <div className="space-y-1.5 font-mono text-sm">
                  <p className="text-slate-400">
                    Type: <span className="text-white">A</span>
                  </p>
                  <p className="text-slate-400">
                    Name: <span className="text-white">@</span>
                  </p>
                  <p className="text-slate-400">
                    Content: <span className="text-blue-400">{serverIP}</span>
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(serverIP)}
                  className="px-3 py-1.5 bg-slate-700 text-white text-xs font-medium rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Copy IP
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
              <div className="flex items-center justify-between">
                <div className="space-y-1.5 font-mono text-sm">
                  <p className="text-slate-400">
                    Type: <span className="text-white">A</span>
                  </p>
                  <p className="text-slate-400">
                    Name: <span className="text-white">www</span>
                  </p>
                  <p className="text-slate-400">
                    Content: <span className="text-blue-400">{serverIP}</span>
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(serverIP)}
                  className="px-3 py-1.5 bg-slate-700 text-white text-xs font-medium rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Copy IP
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <p className="text-sm text-amber-400">
              <strong>Important:</strong> Enable the proxy (orange cloud) for both records.
              Set SSL mode to "Full" in Cloudflare SSL/TLS settings.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
