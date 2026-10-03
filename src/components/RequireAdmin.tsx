import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Only administrators may see the wrapped screen; operators get a clear "not allowed" page.
const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin } = useAuth();
  if (isAdmin) return <>{children}</>;
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <ShieldAlert className="w-10 h-10 text-red-400" aria-hidden="true" />
      <h1 className="text-2xl font-bold text-white">Not allowed</h1>
      <p className="text-gray-400">Only administrators can manage staff. Ask an administrator if you need access.</p>
      <Link to="/" className="text-orange-400 hover:underline">Back to the dashboard</Link>
    </div>
  );
};

export default RequireAdmin;
