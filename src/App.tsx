import React, { lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import RequireAdmin from './components/RequireAdmin';
import Login from './pages/Login';
// Pages behind login are loaded on demand to keep the initial bundle small.
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Foods = lazy(() => import('./pages/Foods'));
const Orders = lazy(() => import('./pages/Orders'));
const OrderDetail = lazy(() => import('./pages/OrderDetail'));
const Staff = lazy(() => import('./pages/Staff'));

const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => (
  <div role="alert" className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-gray-950 text-red-300">
    <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
    <pre className="mb-6 whitespace-pre-wrap bg-gray-900 p-4 rounded-xl border border-red-900/50 text-sm">{error instanceof Error ? error.message : String(error)}</pre>
    <button type="button" onClick={resetErrorBoundary} className="px-6 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-300 rounded-lg border border-red-500/20">Try again</button>
  </div>
);

const RequireAuth: React.FC = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Layout /> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-orange-500/30">
            <Toaster position="top-right" toastOptions={{ style: { background: '#1f2937', color: '#f3f4f6', border: '1px solid #374151' } }} />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={<RequireAuth />}>
                <Route index element={<Dashboard />} />
                <Route path="foods" element={<Foods />} />
                <Route path="orders" element={<Orders />} />
                <Route path="orders/:id" element={<OrderDetail />} />
                <Route path="staff" element={<RequireAdmin><Staff /></RequireAdmin>} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
