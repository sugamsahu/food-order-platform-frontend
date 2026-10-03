import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import Login from './Login';
import api from '../utils/api';
import { apiError, renderAt } from '../test/utils';

vi.mock('../utils/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils/api')>();
  return { ...actual, default: { post: vi.fn(), get: vi.fn() } };
});

const post = vi.mocked(api.post);

describe('Login page', () => {
  beforeEach(() => { post.mockReset(); });

  it('shows field errors and does not call the API for empty or invalid input', async () => {
    renderAt(<Login />, { path: '/login', route: '/login' });
    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Email address'), 'not-an-email');
    await userEvent.type(screen.getByLabelText('Password'), 'x');
    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    expect(await screen.findByText('Please enter a valid email address')).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it('shows the server message when the credentials are wrong', async () => {
    // Created lazily: an eagerly rejected promise would be reported as unhandled while the test types.
    post.mockImplementation(async () => { throw apiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password'); });
    renderAt(<Login />, { path: '/login', route: '/login' });
    await userEvent.type(screen.getByLabelText('Email address'), 'admin@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong-password');
    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
  });

  it('signs in, stores the session and leaves the login page', async () => {
    post.mockResolvedValue({ data: { token: 'jwt-token', user: { id: 1, name: 'Admin User', email: 'admin@example.com', role: 'admin' } } });
    renderAt(<Login />, { path: '/login', route: '/login' });
    await userEvent.type(screen.getByLabelText('Email address'), 'admin@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => expect(screen.getByText('other page')).toBeInTheDocument());
    expect(post).toHaveBeenCalledWith('/auth/staff/login', { email: 'admin@example.com', password: 'password123' });
    expect(localStorage.getItem('adminToken')).toBe('jwt-token');
  });
});
