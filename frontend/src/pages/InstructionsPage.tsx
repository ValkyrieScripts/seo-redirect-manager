import { Card } from '@/components/ui';

export function InstructionsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">How to Use This Tool</h1>
        <p className="text-gray-600">Complete guide for managing SEO redirects</p>
      </div>

      {/* Overview */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-600">Overview</h2>
          <p className="text-gray-700 mb-4">
            This tool helps you manage 301 redirects across multiple expired domains to pass SEO value
            (link juice) to your target projects. It's designed for domain investors and SEO professionals
            who want to leverage backlinks from expired domains.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              <strong>Key Benefit:</strong> Instead of losing valuable backlinks when domains expire,
              you can redirect them to your active projects and transfer the SEO authority.
            </p>
          </div>
        </div>
      </Card>

      {/* Workflow */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-green-600">Recommended Workflow</h2>
          <ol className="space-y-4">
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold">1</span>
              <div>
                <h3 className="font-semibold">Create a Project</h3>
                <p className="text-gray-600 text-sm">Go to Projects → Add Project. Enter your target website URL (e.g., https://mysite.com)</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold">2</span>
              <div>
                <h3 className="font-semibold">Add Your Domains</h3>
                <p className="text-gray-600 text-sm">Go to Domains → Add Domain. Enter the expired domain and assign it to a project.</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold">3</span>
              <div>
                <h3 className="font-semibold">Import Backlinks from Ahrefs</h3>
                <p className="text-gray-600 text-sm">Go to Backlinks → Upload your Ahrefs CSV export. This shows which URLs have valuable backlinks.</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold">4</span>
              <div>
                <h3 className="font-semibold">Create Redirect Rules</h3>
                <p className="text-gray-600 text-sm">Go to Redirects → Add rules for specific paths or use "Generate from Backlinks" for automatic setup.</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold">5</span>
              <div>
                <h3 className="font-semibold">Point Domain to This Server</h3>
                <p className="text-gray-600 text-sm">Add the domain to Cloudflare and point it to this server's IP (proxied).</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold">6</span>
              <div>
                <h3 className="font-semibold">Export URLs for Indexing</h3>
                <p className="text-gray-600 text-sm">Go to Export → Get the URL list and submit to indexing services to notify Google of the changes.</p>
              </div>
            </li>
          </ol>
        </div>
      </Card>

      {/* Cloudflare Setup */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-orange-600">Cloudflare Setup (Per Domain)</h2>
          <p className="text-gray-700 mb-4">
            Using Cloudflare hides your server's IP address and provides additional security. Here's how to set up each domain:
          </p>
          <ol className="space-y-3 text-gray-700">
            <li className="flex gap-2">
              <span className="font-bold text-orange-600">1.</span>
              <span>Add your domain to Cloudflare (free plan works)</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-orange-600">2.</span>
              <span>Change nameservers at your registrar to Cloudflare's nameservers</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-orange-600">3.</span>
              <span>Create an <strong>A record</strong>: Name = <code className="bg-gray-100 px-1 rounded">@</code>, Content = <code className="bg-gray-100 px-1 rounded">Your Server IP</code>, Proxy = <strong>ON (orange cloud)</strong></span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-orange-600">4.</span>
              <span>Create another <strong>A record</strong>: Name = <code className="bg-gray-100 px-1 rounded">www</code>, Content = <code className="bg-gray-100 px-1 rounded">Your Server IP</code>, Proxy = <strong>ON</strong></span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-orange-600">5.</span>
              <span>Enable "Always Use HTTPS" in SSL/TLS settings</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-orange-600">6.</span>
              <span>Set SSL mode to "Full" or "Full (Strict)"</span>
            </li>
          </ol>
          <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-orange-800 text-sm">
              <strong>Why Cloudflare?</strong> Google will see Cloudflare's IP addresses instead of your server's IP.
              This makes it less obvious that all your domains are hosted on the same server.
            </p>
          </div>
        </div>
      </Card>

      {/* Redirect Types */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-purple-600">Redirect Types</h2>
          <div className="space-y-4">
            <div className="border-l-4 border-purple-400 pl-4">
              <h3 className="font-semibold">Full Domain Redirect</h3>
              <p className="text-gray-600 text-sm">
                All URLs from the domain redirect to your target. Use when the entire domain has value.
                <br />
                Example: <code className="bg-gray-100 px-1 rounded">old-domain.com/*</code> → <code className="bg-gray-100 px-1 rounded">your-site.com</code>
              </p>
            </div>
            <div className="border-l-4 border-purple-400 pl-4">
              <h3 className="font-semibold">Path-Specific Redirect</h3>
              <p className="text-gray-600 text-sm">
                Only specific URLs redirect. Use when only certain pages have backlinks.
                <br />
                Example: <code className="bg-gray-100 px-1 rounded">old-domain.com/best-article</code> → <code className="bg-gray-100 px-1 rounded">your-site.com/related-post</code>
              </p>
            </div>
            <div className="border-l-4 border-purple-400 pl-4">
              <h3 className="font-semibold">Regex Redirect</h3>
              <p className="text-gray-600 text-sm">
                Pattern matching for flexible redirects.
                <br />
                Example: <code className="bg-gray-100 px-1 rounded">/blog/(.*)</code> → <code className="bg-gray-100 px-1 rounded">your-site.com/articles/$1</code>
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Ahrefs Import */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-red-600">Importing from Ahrefs</h2>
          <p className="text-gray-700 mb-4">
            Ahrefs provides detailed backlink data. Here's how to export and import:
          </p>
          <ol className="space-y-2 text-gray-700">
            <li><strong>1.</strong> Go to Ahrefs Site Explorer → Enter your expired domain</li>
            <li><strong>2.</strong> Navigate to Backlinks → All backlinks</li>
            <li><strong>3.</strong> Click "Export" → Choose CSV format</li>
            <li><strong>4.</strong> In this tool, go to Backlinks → Select your domain → Upload CSV</li>
            <li><strong>5.</strong> Review the imported backlinks and their Domain Rating (DR)</li>
            <li><strong>6.</strong> Click "Generate Redirects" to auto-create redirect rules for all backlinked URLs</li>
          </ol>
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">
              <strong>Pro Tip:</strong> Focus on backlinks with high DR (Domain Rating) - these pass the most SEO value.
              You can filter by minimum DR when generating redirects.
            </p>
          </div>
        </div>
      </Card>

      {/* Export & Indexing */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-indigo-600">Export & Indexing</h2>
          <p className="text-gray-700 mb-4">
            After setting up redirects, you should notify search engines about the changes:
          </p>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">IndexNow</h3>
              <p className="text-gray-600 text-sm">
                Instant notification to Bing, Yandex, and other supporting search engines.
                Export in IndexNow format and submit via their API.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Google Search Console</h3>
              <p className="text-gray-600 text-sm">
                Add your domains to GSC and use the URL Inspection tool to request indexing.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Third-party Indexers</h3>
              <p className="text-gray-600 text-sm">
                Services like Omega Indexer, IndexMeNow, etc. Export as plain URLs or CSV.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Tips */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-teal-600">Best Practices</h2>
          <ul className="space-y-2 text-gray-700">
            <li className="flex gap-2">
              <span className="text-teal-600">✓</span>
              <span>Always use 301 (permanent) redirects for SEO - they pass ~90% of link equity</span>
            </li>
            <li className="flex gap-2">
              <span className="text-teal-600">✓</span>
              <span>Redirect to relevant content when possible - matching topics perform better</span>
            </li>
            <li className="flex gap-2">
              <span className="text-teal-600">✓</span>
              <span>Set up redirects before the domain fully expires if possible</span>
            </li>
            <li className="flex gap-2">
              <span className="text-teal-600">✓</span>
              <span>Monitor your target site's rankings and backlink profile after setup</span>
            </li>
            <li className="flex gap-2">
              <span className="text-teal-600">✓</span>
              <span>Use Cloudflare's proxy to hide your server IP from competitors</span>
            </li>
            <li className="flex gap-2">
              <span className="text-teal-600">✓</span>
              <span>Keep domains with high DR backlinks even if traffic is low</span>
            </li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
