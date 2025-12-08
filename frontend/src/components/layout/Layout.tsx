import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function Layout() {
  return (
    <div className="min-h-screen gradient-mesh">
      <Sidebar />
      <main className="lg:pl-72">
        <div className="min-h-screen p-4 pt-20 lg:p-8 lg:pt-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
