import { useState } from 'react';

type Section = 'overview' | 'setup' | 'cloudflare' | 'backlinks' | 'blocking';

export default function InstructionsPage() {
  const [activeSection, setActiveSection] = useState<Section>('overview');

  const sections: { id: Section; title: string }[] = [
    { id: 'overview', title: 'Overview' },
    { id: 'setup', title: 'Quick Setup' },
    { id: 'cloudflare', title: 'Cloudflare DNS' },
    { id: 'backlinks', title: 'Backlink Import' },
    { id: 'blocking', title: 'SEO Tool Blocking' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Instructions</h1>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-48 flex-shrink-0">
          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeSection === section.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                {section.title}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-gray-800 rounded-lg p-6">
          {activeSection === 'overview' && <OverviewSection />}
          {activeSection === 'setup' && <SetupSection />}
          {activeSection === 'cloudflare' && <CloudflareSection />}
          {activeSection === 'backlinks' && <BacklinksSection />}
          {activeSection === 'blocking' && <BlockingSection />}
        </div>
      </div>
    </div>
  );
}

function OverviewSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-4">What is SEO Redirect Manager?</h2>
        <p className="text-gray-300 leading-relaxed">
          This tool helps you capture SEO value from expired domains by setting up 301 redirects.
          When you purchase an expired domain that has existing backlinks, you can redirect all
          traffic to your target site, passing along the "link juice" for SEO benefits.
        </p>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-3">How It Works</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-300">
          <li>Purchase an expired domain that has valuable backlinks</li>
          <li>Add the domain to this system with your target URL</li>
          <li>Point the domain's DNS to this server via Cloudflare</li>
          <li>All traffic gets 301 redirected to your target</li>
          <li>Search engines follow the redirect and pass link authority</li>
        </ol>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Key Features</h3>
        <ul className="space-y-2">
          <li className="flex items-start">
            <span className="text-green-400 mr-2">&#10003;</span>
            <span className="text-gray-300"><strong className="text-white">Full Domain Redirect:</strong> All paths redirect to your target URL</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-400 mr-2">&#10003;</span>
            <span className="text-gray-300"><strong className="text-white">Path-Specific Redirect:</strong> Only backlink paths redirect (more control)</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-400 mr-2">&#10003;</span>
            <span className="text-gray-300"><strong className="text-white">SEO Tool Blocking:</strong> Hides redirects from Ahrefs, Moz, SEMrush</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-400 mr-2">&#10003;</span>
            <span className="text-gray-300"><strong className="text-white">Backlink Tracking:</strong> Import and track your backlinks</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-400 mr-2">&#10003;</span>
            <span className="text-gray-300"><strong className="text-white">Cloudflare Integration:</strong> Use CF proxy to mask origin IP</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function SetupSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white mb-4">Quick Setup Guide</h2>

      <div className="space-y-6">
        <Step
          number={1}
          title="Add Your Domain"
          description="Click 'Add Domain' on the Domains page. Enter your expired domain name and the target URL where you want traffic redirected."
        >
          <div className="bg-gray-900 rounded p-3 mt-2">
            <p className="text-gray-400 text-sm">Example:</p>
            <p className="text-gray-300 font-mono text-sm mt-1">
              Domain: <span className="text-yellow-400">old-expired-site.com</span>
            </p>
            <p className="text-gray-300 font-mono text-sm">
              Target: <span className="text-blue-400">https://your-main-site.com</span>
            </p>
          </div>
        </Step>

        <Step
          number={2}
          title="Choose Redirect Mode"
        >
          <div className="space-y-3 mt-2">
            <div className="bg-gray-900 rounded p-3">
              <p className="text-purple-400 font-semibold text-sm">Full Domain</p>
              <p className="text-gray-400 text-sm mt-1">
                All paths on the expired domain redirect to your target. Simple and catches everything.
              </p>
            </div>
            <div className="bg-gray-900 rounded p-3">
              <p className="text-yellow-400 font-semibold text-sm">Path-Specific</p>
              <p className="text-gray-400 text-sm mt-1">
                Only paths with imported backlinks redirect. Other paths return 404 or redirect to homepage (your choice).
              </p>
            </div>
          </div>
        </Step>

        <Step
          number={3}
          title="Configure Cloudflare DNS"
          description="Add your domain to Cloudflare and create A records pointing to our server."
        >
          <div className="bg-gray-900 rounded p-3 mt-2 font-mono text-sm">
            <p className="text-gray-400 mb-2">DNS Records:</p>
            <p className="text-gray-300">@ -&gt; <span className="text-blue-400">89.147.108.50</span> (Proxied)</p>
            <p className="text-gray-300">www -&gt; <span className="text-blue-400">89.147.108.50</span> (Proxied)</p>
          </div>
        </Step>

        <Step
          number={4}
          title="Import Backlinks (Optional)"
          description="If using path-specific mode, import your backlinks so the system knows which paths to redirect."
        />

        <Step
          number={5}
          title="Activate the Domain"
          description="Click the status toggle to activate. The redirect will start working immediately after DNS propagates."
        />

        <Step
          number={6}
          title="Send Links to Indexer"
          description="Copy the linking URLs from your backlinks and submit them to Google for re-indexing so they discover the redirect."
        />
      </div>
    </div>
  );
}

function CloudflareSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white mb-4">Cloudflare DNS Setup</h2>

      <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-4 mb-6">
        <p className="text-blue-200">
          <strong>Why Cloudflare?</strong> Using Cloudflare's proxy hides the origin server IP,
          so Google doesn't see all your redirect domains pointing to the same server.
        </p>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Step 1: Add Domain to Cloudflare</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-300 ml-4">
          <li>Log in to your Cloudflare account</li>
          <li>Click "Add a Site"</li>
          <li>Enter your expired domain name</li>
          <li>Select the Free plan (sufficient for redirects)</li>
          <li>Update nameservers at your domain registrar</li>
        </ol>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Step 2: Configure DNS Records</h3>
        <p className="text-gray-400 mb-3">Add these A records:</p>

        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-left text-gray-300">Type</th>
                <th className="px-4 py-2 text-left text-gray-300">Name</th>
                <th className="px-4 py-2 text-left text-gray-300">Content</th>
                <th className="px-4 py-2 text-left text-gray-300">Proxy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              <tr>
                <td className="px-4 py-3 text-green-400 font-mono">A</td>
                <td className="px-4 py-3 text-yellow-400 font-mono">@</td>
                <td className="px-4 py-3 text-blue-400 font-mono">89.147.108.50</td>
                <td className="px-4 py-3 text-orange-400">Proxied</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-green-400 font-mono">A</td>
                <td className="px-4 py-3 text-yellow-400 font-mono">www</td>
                <td className="px-4 py-3 text-blue-400 font-mono">89.147.108.50</td>
                <td className="px-4 py-3 text-orange-400">Proxied</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Step 3: SSL/TLS Settings</h3>
        <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4">
          <p className="text-yellow-200 mb-2">
            <strong>Important:</strong> Go to SSL/TLS settings and set encryption mode to:
          </p>
          <p className="text-2xl font-mono text-white">Full</p>
          <p className="text-yellow-200/70 text-sm mt-2">
            Do NOT use "Full (Strict)" as we don't have SSL certificates for each domain on the origin server.
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Step 4: Wait for DNS Propagation</h3>
        <p className="text-gray-300">
          DNS changes can take up to 24-48 hours to propagate worldwide, though it's often much faster.
          You can check propagation at{' '}
          <a href="https://dnschecker.org" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
            dnschecker.org
          </a>
        </p>
      </div>
    </div>
  );
}

function BacklinksSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white mb-4">Backlink Import</h2>

      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Import Format</h3>
        <p className="text-gray-300 mb-3">
          Paste your backlinks in CSV format with two columns:
        </p>

        <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm">
          <p className="text-gray-400 mb-2"># Format: linking_url,path_on_expired_domain</p>
          <p className="text-gray-300">https://blog.example.com/post-about-topic,/old-page</p>
          <p className="text-gray-300">https://news-site.org/article,/another-path</p>
          <p className="text-gray-300">https://forum.example.net/thread/123,/</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Column Explanation</h3>
        <div className="space-y-3">
          <div className="bg-gray-900 rounded p-3">
            <p className="text-blue-400 font-semibold">linking_url (Column 1)</p>
            <p className="text-gray-400 text-sm mt-1">
              The full URL of the page that contains a backlink to your expired domain.
              This is the page you'll send to an indexer so Google re-crawls it.
            </p>
          </div>
          <div className="bg-gray-900 rounded p-3">
            <p className="text-yellow-400 font-semibold">path (Column 2)</p>
            <p className="text-gray-400 text-sm mt-1">
              The path on your expired domain that the backlink points to.
              Include the leading slash. Use "/" for the homepage.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Getting Backlink Data</h3>
        <p className="text-gray-300 mb-3">
          Export backlinks from your preferred SEO tool:
        </p>
        <ul className="space-y-2 text-gray-300">
          <li className="flex items-center">
            <span className="text-gray-500 mr-2">&#8226;</span>
            <strong className="text-white mr-2">Ahrefs:</strong> Site Explorer → Backlinks → Export
          </li>
          <li className="flex items-center">
            <span className="text-gray-500 mr-2">&#8226;</span>
            <strong className="text-white mr-2">Moz:</strong> Link Explorer → Inbound Links → Export
          </li>
          <li className="flex items-center">
            <span className="text-gray-500 mr-2">&#8226;</span>
            <strong className="text-white mr-2">SEMrush:</strong> Backlink Analytics → Export
          </li>
        </ul>
        <p className="text-gray-400 text-sm mt-3">
          Then format the data as shown above (linking URL + target path).
        </p>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-3">After Importing</h3>
        <p className="text-gray-300">
          Backlinks are grouped by path in the domain detail view. You can:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-300 mt-2 ml-4">
          <li>Expand each path to see all linking URLs</li>
          <li>Copy linking URLs to send to an indexer</li>
          <li>Delete individual backlinks or clear all</li>
        </ul>
      </div>
    </div>
  );
}

function BlockingSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white mb-4">SEO Tool Blocking</h2>

      <div className="bg-green-900/30 border border-green-600 rounded-lg p-4 mb-6">
        <p className="text-green-200">
          <strong>Built-in Protection:</strong> The redirect server automatically blocks
          SEO crawler bots while allowing search engines through.
        </p>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Why Block SEO Tools?</h3>
        <p className="text-gray-300">
          SEO tools like Ahrefs and SEMrush constantly crawl the web to update their backlink databases.
          If they detect that your expired domain redirects to your main site, they may:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-300 mt-2 ml-4">
          <li>Update their database to show the redirect</li>
          <li>Flag the backlinks as redirected</li>
          <li>Make it obvious to competitors what you're doing</li>
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Blocked Crawlers</h3>
        <p className="text-gray-400 mb-2">These bots receive a 404 response (domain appears dead):</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            'AhrefsBot',
            'MJ12bot (Majestic)',
            'SemrushBot',
            'DotBot (Moz)',
            'BLEXBot',
            'DataForSeoBot',
            'Screaming Frog',
            'Serpstatbot',
          ].map((bot) => (
            <div key={bot} className="bg-red-900/30 border border-red-800 rounded px-3 py-2 text-red-300 text-sm font-mono">
              {bot}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Allowed Crawlers</h3>
        <p className="text-gray-400 mb-2">These bots receive the 301 redirect (pass link juice):</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            'Googlebot',
            'Bingbot',
            'DuckDuckBot',
            'Yandexbot',
            'Facebot',
            'Twitterbot',
            'LinkedInBot',
            'Applebot',
          ].map((bot) => (
            <div key={bot} className="bg-green-900/30 border border-green-800 rounded px-3 py-2 text-green-300 text-sm font-mono">
              {bot}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Regular Visitors</h3>
        <p className="text-gray-300">
          Normal users with web browsers also receive the 301 redirect and are sent to your target URL.
          Only known SEO crawler bots are blocked.
        </p>
      </div>
    </div>
  );
}

interface StepProps {
  number: number;
  title: string;
  description?: string;
  children?: React.ReactNode;
}

function Step({ number, title, description, children }: StepProps) {
  return (
    <div className="flex">
      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mr-4">
        {number}
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {description && <p className="text-gray-400 mt-1">{description}</p>}
        {children}
      </div>
    </div>
  );
}
