import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { domainsApi } from '../api/domains';
import type { Domain } from '../types';
import toast from 'react-hot-toast';

export function DashboardPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDnsModal, setShowDnsModal] = useState(false);
  const [newDomain, setNewDomain] = useState<Domain | null>(null);

  const fetchDomains = async () => {
    try {
      const data = await domainsApi.list();
      setDomains(data);
    } catch {
      toast.error('Failed to load domains');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  const handleDomainCreated = (domain: Domain) => {
    setNewDomain(domain);
    setShowModal(false);
    setShowDnsModal(true);
    fetchDomains();
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Domains</h1>
          <p className="text-slate-400 mt-1">Manage your redirect domains</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Domain
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : domains.length === 0 ? (
        <div className="text-center py-16 bg-slate-800 rounded-xl border border-slate-700">
          <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No domains yet</h3>
          <p className="text-slate-400 mb-4">Add your first domain to start redirecting</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Add Domain
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {domains.map((domain) => (
            <Link
              key={domain.id}
              to={`/domains/${domain.id}`}
              className="block p-4 bg-slate-800 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-white">{domain.domain_name}</h3>
                  <p className="text-sm text-slate-400 mt-1">
                    → {domain.target_url || 'No target set'}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-white font-medium">{domain.backlink_count || 0}</div>
                    <div className="text-xs text-slate-500">backlinks</div>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    domain.status === 'active'
                      ? 'bg-green-500/20 text-green-400'
                      : domain.status === 'pending'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-slate-500/20 text-slate-400'
                  }`}>
                    {domain.status}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Add Domain Modal */}
      {showModal && (
        <AddDomainModal
          onClose={() => setShowModal(false)}
          onSuccess={handleDomainCreated}
        />
      )}

      {/* DNS Instructions Modal */}
      {showDnsModal && newDomain && (
        <DnsModal
          domain={newDomain}
          onClose={() => {
            setShowDnsModal(false);
            setNewDomain(null);
          }}
        />
      )}
    </div>
  );
}

function AddDomainModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (domain: Domain) => void }) {
  const [domainName, setDomainName] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainName || !targetUrl) {
      toast.error('Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      const domain = await domainsApi.create({ domain_name: domainName, target_url: targetUrl });
      toast.success('Domain added');
      onSuccess(domain);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to add domain');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Add Domain</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-2">Domain Name</label>
            <input
              type="text"
              value={domainName}
              onChange={(e) => setDomainName(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="example.com"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">Target URL</label>
            <input
              type="url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="https://mysite.com"
            />
            <p className="text-xs text-slate-500 mt-1">All traffic will 301 redirect here</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Adding...' : 'Add Domain'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DnsModal({ domain, onClose }: { domain: Domain; onClose: () => void }) {
  const serverIp = '89.147.108.50';

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Cloudflare DNS Setup</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-slate-300">
            Add these DNS records for <span className="text-white font-medium">{domain.domain_name}</span>:
          </p>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
              <code className="text-sm text-slate-300">
                A | @ | <span className="text-blue-400">{serverIp}</span>
              </code>
              <button onClick={() => copy(serverIp)} className="text-slate-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
              <code className="text-sm text-slate-300">
                A | www | <span className="text-blue-400">{serverIp}</span>
              </code>
              <button onClick={() => copy(serverIp)} className="text-slate-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-sm text-yellow-400">
              Enable proxy (orange cloud) and set SSL to "Full"
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
