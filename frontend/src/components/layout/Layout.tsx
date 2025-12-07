import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="lg:pl-64">
        <div className="min-h-screen p-4 pt-16 lg:p-8 lg:pt-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
