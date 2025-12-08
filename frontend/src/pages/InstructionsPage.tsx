import { Card } from '@/components/ui';
import { BookOpen, Zap, CheckCircle, AlertCircle, ArrowRight, ExternalLink, Shield } from 'lucide-react';

export function InstructionsPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      {/* Page Header */}
      <div className="animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-600">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">How to Use This Tool</h1>
        </div>
        <p className="text-slate-400">
          Complete guide for managing SEO redirects
        </p>
      </div>

      {/* Overview */}
      <Card className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 border border-blue-500/20">
              <Zap className="h-5 w-5 text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Overview</h2>
          </div>
          <p className="text-slate-300 mb-4 leading-relaxed">
            This tool helps you manage 301 redirects across multiple expired domains to pass SEO value
            (link juice) to your target projects. It's designed for domain investors and SEO professionals
            who want to leverage backlinks from expired domains.
          </p>
          <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4">
            <p className="text-blue-400 text-sm flex items-start gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Key Benefit:</strong> Instead of losing valuable backlinks when domains expire,
                you can redirect them to your active projects and transfer the SEO authority.
              </span>
            </p>
          </div>
        </div>
      </Card>

      {/* Workflow */}
      <Card className="animate-fade-in" style={{ animationDelay: '0.15s' }}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/20">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Recommended Workflow</h2>
          </div>
          <ol className="space-y-4">
            {[
              { step: 1, title: 'Create a Project', desc: 'Go to Projects -> Add Project. Enter your target website URL (e.g., https://mysite.com)' },
              { step: 2, title: 'Add Your Domains', desc: 'Go to Domains -> Add Domain. Enter the expired domain and assign it to a project.' },
              { step: 3, title: 'Import Backlinks from Ahrefs', desc: 'Go to Backlinks -> Upload your Ahrefs CSV export. This shows which URLs have valuable backlinks.' },
              { step: 4, title: 'Create Redirect Rules', desc: 'Go to Redirects -> Add rules for specific paths or use "Generate from Backlinks" for automatic setup.' },
              { step: 5, title: 'Point Domain to This Server', desc: 'Add the domain to Cloudflare and point it to this server\'s IP (proxied).' },
              { step: 6, title: 'Export URLs for Indexing', desc: 'Go to Export -> Get the URL list and submit to indexing services to notify Google of the changes.' },
            ].map((item) => (
              <li key={item.step} className="flex gap-4">
                <span className="flex-shrink-0 w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center font-bold border border-emerald-500/20">
                  {item.step}
                </span>
                <div>
                  <h3 className="font-semibold text-white">{item.title}</h3>
                  <p className="text-slate-400 text-sm mt-1">{item.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Card>

      {/* Cloudflare Setup */}
      <Card className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/20 border border-orange-500/20">
              <Shield className="h-5 w-5 text-orange-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Cloudflare Setup (Per Domain)</h2>
          </div>
          <p className="text-slate-300 mb-4">
            Using Cloudflare hides your server's IP address and provides additional security. Here's how to set up each domain:
          </p>
          <ol className="space-y-3">
            {[
              'Add your domain to Cloudflare (free plan works)',
              'Change nameservers at your registrar to Cloudflare\'s nameservers',
              <>Create an <strong className="text-white">A record</strong>: Name = <code className="bg-slate-800 px-2 py-0.5 rounded text-orange-400">@</code>, Content = <code className="bg-slate-800 px-2 py-0.5 rounded text-orange-400">Your Server IP</code>, Proxy = <strong className="text-white">ON (orange cloud)</strong></>,
              <>Create another <strong className="text-white">A record</strong>: Name = <code className="bg-slate-800 px-2 py-0.5 rounded text-orange-400">www</code>, Content = <code className="bg-slate-800 px-2 py-0.5 rounded text-orange-400">Your Server IP</code>, Proxy = <strong className="text-white">ON</strong></>,
              'Enable "Always Use HTTPS" in SSL/TLS settings',
              'Set SSL mode to "Full" or "Full (Strict)"',
            ].map((item, index) => (
              <li key={index} className="flex gap-3 text-slate-300">
                <span className="font-bold text-orange-400">{index + 1}.</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
          <div className="mt-4 rounded-xl bg-orange-500/10 border border-orange-500/20 p-4">
            <p className="text-orange-400 text-sm flex items-start gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Why Cloudflare?</strong> Google will see Cloudflare's IP addresses instead of your server's IP.
                This makes it less obvious that all your domains are hosted on the same server.
              </span>
            </p>
          </div>
        </div>
      </Card>

      {/* Redirect Types */}
      <Card className="animate-fade-in" style={{ animationDelay: '0.25s' }}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 border border-purple-500/20">
              <ArrowRight className="h-5 w-5 text-purple-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Redirect Types</h2>
          </div>
          <div className="space-y-4">
            {[
              {
                title: 'Full Domain Redirect',
                desc: 'All URLs from the domain redirect to your target. Use when the entire domain has value.',
                example: 'old-domain.com/* -> your-site.com',
              },
              {
                title: 'Path-Specific Redirect',
                desc: 'Only specific URLs redirect. Use when only certain pages have backlinks.',
                example: 'old-domain.com/best-article -> your-site.com/related-post',
              },
              {
                title: 'Regex Redirect',
                desc: 'Pattern matching for flexible redirects.',
                example: '/blog/(.*) -> your-site.com/articles/$1',
              },
            ].map((item, index) => (
              <div key={index} className="border-l-2 border-purple-500/50 pl-4 py-2">
                <h3 className="font-semibold text-white">{item.title}</h3>
                <p className="text-slate-400 text-sm mt-1">{item.desc}</p>
                <code className="mt-2 block text-xs bg-slate-800/50 px-3 py-2 rounded-lg text-purple-300 border border-slate-700/50">
                  {item.example}
                </code>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Ahrefs Import */}
      <Card className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 border border-rose-500/20">
              <ExternalLink className="h-5 w-5 text-rose-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Importing from Ahrefs</h2>
          </div>
          <p className="text-slate-300 mb-4">
            Ahrefs provides detailed backlink data. Here's how to export and import:
          </p>
          <ol className="space-y-2 text-slate-300">
            <li><strong className="text-white">1.</strong> Go to Ahrefs Site Explorer → Enter your expired domain</li>
            <li><strong className="text-white">2.</strong> Navigate to Backlinks → All backlinks</li>
            <li><strong className="text-white">3.</strong> Click "Export" → Choose CSV format</li>
            <li><strong className="text-white">4.</strong> In this tool, go to Backlinks → Select your domain → Upload CSV</li>
            <li><strong className="text-white">5.</strong> Review the imported backlinks and their Domain Rating (DR)</li>
            <li><strong className="text-white">6.</strong> Click "Generate Redirects" to auto-create redirect rules for all backlinked URLs</li>
          </ol>
          <div className="mt-4 rounded-xl bg-rose-500/10 border border-rose-500/20 p-4">
            <p className="text-rose-400 text-sm flex items-start gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Pro Tip:</strong> Focus on backlinks with high DR (Domain Rating) - these pass the most SEO value.
                You can filter by minimum DR when generating redirects.
              </span>
            </p>
          </div>
        </div>
      </Card>

      {/* Export & Indexing */}
      <Card className="animate-fade-in" style={{ animationDelay: '0.35s' }}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 border border-indigo-500/20">
              <Zap className="h-5 w-5 text-indigo-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Export & Indexing</h2>
          </div>
          <p className="text-slate-300 mb-4">
            After setting up redirects, you should notify search engines about the changes:
          </p>
          <div className="space-y-4">
            {[
              {
                title: 'IndexNow',
                desc: 'Instant notification to Bing, Yandex, and other supporting search engines. Export in IndexNow format and submit via their API.',
              },
              {
                title: 'Google Search Console',
                desc: 'Add your domains to GSC and use the URL Inspection tool to request indexing.',
              },
              {
                title: 'Third-party Indexers',
                desc: 'Services like Omega Indexer, IndexMeNow, etc. Export as plain URLs or CSV.',
              },
            ].map((item, index) => (
              <div key={index} className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                <h3 className="font-semibold text-white">{item.title}</h3>
                <p className="text-slate-400 text-sm mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Tips */}
      <Card className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/20 border border-teal-500/20">
              <CheckCircle className="h-5 w-5 text-teal-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Best Practices</h2>
          </div>
          <ul className="space-y-3">
            {[
              'Always use 301 (permanent) redirects for SEO - they pass ~90% of link equity',
              'Redirect to relevant content when possible - matching topics perform better',
              'Set up redirects before the domain fully expires if possible',
              'Monitor your target site\'s rankings and backlink profile after setup',
              'Use Cloudflare\'s proxy to hide your server IP from competitors',
              'Keep domains with high DR backlinks even if traffic is low',
            ].map((tip, index) => (
              <li key={index} className="flex gap-3 text-slate-300">
                <CheckCircle className="h-5 w-5 text-teal-400 flex-shrink-0 mt-0.5" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </div>
  );
}
