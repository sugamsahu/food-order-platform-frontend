import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../context/AuthContext';
import { TOKEN_KEY, USER_KEY } from '../utils/api';

export const signIn = (role: 'admin' | 'operator' = 'admin') => {
  localStorage.setItem(TOKEN_KEY, 'test-token');
  localStorage.setItem(USER_KEY, JSON.stringify({ id: 1, name: 'Test User', email: 'test@example.com', role }));
};

// Renders a page inside the router, auth provider and toaster, at the given URL.
export const renderAt = (ui: ReactElement, { path = '/', route = '/' }: { path?: string; route?: string } = {}) =>
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={[route]}>
        <Toaster />
        <Routes>
          <Route path={path} element={ui} />
          <Route path="*" element={<div>other page</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );

// Mimics an axios error: an Error that carries the server response.
export const apiError = (status: number, code: string, message: string) =>
  Object.assign(new Error(`Request failed with status code ${status}`), { response: { status, data: { error: { code, message } } } });
