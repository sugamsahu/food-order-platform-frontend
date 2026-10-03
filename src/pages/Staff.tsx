import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { KeyRound, Loader2, Pencil, Plus, Search, ShieldAlert, UserCheck, UserX } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { usePagedData } from '../hooks/usePagedData';
import { applyFieldErrors, errorMessage } from '../utils/errors';
import { formatDateTime } from '../utils/format';
import type { StaffUser } from '../types';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews';
import { btnGhost, btnPrimary, cardClass, inputClass, labelClass } from '../components/ui';

const nameField = z.string().trim().min(1, 'Name is required').max(100, 'Name must be 100 characters or fewer');
const emailField = z.string().trim().min(1, 'Email is required').pipe(z.email('Enter a valid email address'));
const passwordField = z.string().min(8, 'Password must be at least 8 characters').max(72, 'Password must be at most 72 characters');
const roleField = z.enum(['admin', 'operator']);

const createSchema = z.object({ name: nameField, email: emailField, password: passwordField, role: roleField });
const editSchema = z.object({ name: nameField, email: emailField, role: roleField });
const resetSchema = z.object({ password: passwordField, confirm: z.string() }).refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'Passwords do not match' });

type CreateValues = z.infer<typeof createSchema>;
type EditValues = z.infer<typeof editSchema>;
type ResetValues = z.infer<typeof resetSchema>;

const FieldError: React.FC<{ id: string; message?: string }> = ({ id, message }) => (message ? <p id={id} className="mt-1 text-sm text-red-400">{message}</p> : null);

const StaffForm: React.FC<{ staff: StaffUser | null; onSaved: () => void; onClose: () => void }> = ({ staff, onSaved, onClose }) => {
  const isEdit = !!staff;
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<CreateValues>({
    resolver: zodResolver(isEdit ? (editSchema as unknown as typeof createSchema) : createSchema),
    defaultValues: { name: staff?.name ?? '', email: staff?.email ?? '', password: '', role: staff?.role ?? 'operator' },
  });
  const submit = async (v: CreateValues | EditValues) => {
    try {
      if (staff) await api.patch(`/staff-users/${staff.id}`, { name: v.name, email: v.email, role: v.role });
      else await api.post('/staff-users', v);
      toast.success(staff ? 'Staff member updated' : 'Staff member created');
      onSaved();
    } catch (err) {
      if (!applyFieldErrors(err, setError)) toast.error(errorMessage(err));
    }
  };
  const a11y = (k: keyof CreateValues) => ({ id: `staff-${k}`, 'aria-invalid': !!errors[k], 'aria-describedby': errors[k] ? `staff-${k}-error` : undefined });
  return (
    <Modal title={isEdit ? 'Edit staff member' : 'Add staff member'} onClose={onClose}>
      <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
        <div><label htmlFor="staff-name" className={labelClass}>Name</label><input type="text" {...a11y('name')} {...register('name')} className={inputClass} /><FieldError id="staff-name-error" message={errors.name?.message} /></div>
        <div><label htmlFor="staff-email" className={labelClass}>Email</label><input type="email" {...a11y('email')} {...register('email')} className={inputClass} /><FieldError id="staff-email-error" message={errors.email?.message} /></div>
        {!isEdit && <div><label htmlFor="staff-password" className={labelClass}>Initial password</label><input type="password" autoComplete="new-password" {...a11y('password')} {...register('password')} className={inputClass} /><FieldError id="staff-password-error" message={errors.password?.message} /></div>}
        <div>
          <label htmlFor="staff-role" className={labelClass}>Role</label>
          <select {...a11y('role')} {...register('role')} className={inputClass}><option value="operator">Operator</option><option value="admin">Administrator</option></select>
          <FieldError id="staff-role-error" message={errors.role?.message} />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className={btnGhost} onClick={onClose}>Cancel</button>
          <button type="submit" className={btnPrimary} disabled={isSubmitting}>{isSubmitting && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}{isEdit ? 'Save changes' : 'Create staff member'}</button>
        </div>
      </form>
    </Modal>
  );
};

const ResetPasswordDialog: React.FC<{ staff: StaffUser; onClose: () => void }> = ({ staff, onClose }) => {
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<ResetValues>({ resolver: zodResolver(resetSchema) });
  const submit = async (v: ResetValues) => {
    try {
      await api.post(`/staff-users/${staff.id}/reset-password`, { password: v.password });
      toast.success(`Password reset for ${staff.name}. Their sessions have been signed out.`);
      onClose();
    } catch (err) {
      if (!applyFieldErrors(err, setError)) toast.error(errorMessage(err));
    }
  };
  return (
    <Modal title={`Reset password for ${staff.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
        <p className="text-sm text-gray-400">Choose a new password and share it with {staff.name} securely. Any signed-in sessions will end.</p>
        <div><label htmlFor="reset-password" className={labelClass}>New password</label><input id="reset-password" type="password" autoComplete="new-password" aria-invalid={!!errors.password} aria-describedby={errors.password ? 'reset-password-error' : undefined} {...register('password')} className={inputClass} /><FieldError id="reset-password-error" message={errors.password?.message} /></div>
        <div><label htmlFor="reset-confirm" className={labelClass}>Confirm new password</label><input id="reset-confirm" type="password" autoComplete="new-password" aria-invalid={!!errors.confirm} aria-describedby={errors.confirm ? 'reset-confirm-error' : undefined} {...register('confirm')} className={inputClass} /><FieldError id="reset-confirm-error" message={errors.confirm?.message} /></div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className={btnGhost} onClick={onClose}>Cancel</button>
          <button type="submit" className={btnPrimary} disabled={isSubmitting}>Reset password</button>
        </div>
      </form>
    </Modal>
  );
};

const Staff: React.FC = () => {
  const { user: me } = useAuth();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [active, setActive] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<StaffUser | 'new' | null>(null);
  const [resetting, setResetting] = useState<StaffUser | null>(null);
  const [deactivating, setDeactivating] = useState<StaffUser | null>(null);

  const q = useDebouncedValue(search.trim());
  const { data, loading, error, reload } = usePagedData<StaffUser>('/staff-users', { q, role, is_active: active, page, page_size: 15 });

  const change = (set: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { set(e.target.value); setPage(1); };

  const deactivate = async (s: StaffUser) => {
    try {
      await api.patch(`/staff-users/${s.id}/deactivate`);
      toast.success(`${s.name} deactivated`);
      await reload();
    } catch (err) {
      toast.error(errorMessage(err));
      throw err;
    }
  };
  const activate = async (s: StaffUser) => {
    try {
      await api.patch(`/staff-users/${s.id}/activate`);
      toast.success(`${s.name} reactivated`);
      await reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div>
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Staff management</h1>
          <p className="text-gray-400">Manage administrators and operators.</p>
        </div>
        <button type="button" onClick={() => setForm('new')} className={btnPrimary}><Plus className="w-4 h-4" aria-hidden="true" /> Add staff member</button>
      </header>

      <form role="search" onSubmit={(e) => e.preventDefault()} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="relative">
          <label htmlFor="staff-search" className="sr-only">Search staff</label>
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-500 pointer-events-none" aria-hidden="true" />
          <input id="staff-search" type="search" value={search} onChange={change(setSearch)} placeholder="Search name or email..." className={`${inputClass} pl-10`} />
        </div>
        <div><label htmlFor="staff-role-filter" className="sr-only">Filter by role</label><select id="staff-role-filter" value={role} onChange={change(setRole)} className={inputClass}><option value="">All roles</option><option value="admin">Administrators</option><option value="operator">Operators</option></select></div>
        <div><label htmlFor="staff-active-filter" className="sr-only">Filter by status</label><select id="staff-active-filter" value={active} onChange={change(setActive)} className={inputClass}><option value="">Active and inactive</option><option value="true">Active</option><option value="false">Inactive</option></select></div>
      </form>

      {loading && !data ? <LoadingState label="Loading staff" /> : error ? <ErrorState message={error} onRetry={() => reload()} /> : data && data.data.length === 0 ? (
        <EmptyState message="No staff members found." hint="Try changing your search or filters." />
      ) : data && (
        <>
          <div className={`${cardClass} overflow-x-auto`}>
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Staff members</caption>
              <thead className="text-gray-400 border-b border-gray-800">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Name</th>
                  <th scope="col" className="px-4 py-3 font-medium">Role</th>
                  <th scope="col" className="px-4 py-3 font-medium">Status</th>
                  <th scope="col" className="px-4 py-3 font-medium">Created</th>
                  <th scope="col" className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {data.data.map((s) => {
                  const isMe = s.id === me?.id;
                  return (
                    <tr key={s.id} className="hover:bg-gray-800/40">
                      <td className="px-4 py-3 text-gray-200">{s.name}{isMe && <span className="ml-2 text-xs text-gray-400">(you)</span>}<span className="block text-xs text-gray-400">{s.email}</span></td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase border ${s.role === 'admin' ? 'bg-purple-500/10 text-purple-300 border-purple-500/30' : 'bg-blue-500/10 text-blue-300 border-blue-500/30'}`}>
                          {s.role === 'admin' && <ShieldAlert className="w-3 h-3" aria-hidden="true" />}{s.role}
                        </span>
                      </td>
                      <td className="px-4 py-3"><span className={s.is_active ? 'text-emerald-300' : 'text-red-300'}>{s.is_active ? 'Active' : 'Inactive'}</span></td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{formatDateTime(s.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button type="button" onClick={() => setForm(s)} aria-label={`Edit ${s.name}`} className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg"><Pencil className="w-4 h-4" aria-hidden="true" /></button>
                          <button type="button" onClick={() => setResetting(s)} aria-label={`Reset password for ${s.name}`} className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg"><KeyRound className="w-4 h-4" aria-hidden="true" /></button>
                          {s.is_active
                            ? <button type="button" onClick={() => setDeactivating(s)} disabled={isMe} title={isMe ? 'You cannot deactivate yourself' : undefined} aria-label={`Deactivate ${s.name}`} className="p-2 text-red-300 hover:bg-red-900/20 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"><UserX className="w-4 h-4" aria-hidden="true" /></button>
                            : <button type="button" onClick={() => activate(s)} aria-label={`Reactivate ${s.name}`} className="p-2 text-emerald-300 hover:bg-emerald-900/20 rounded-lg"><UserCheck className="w-4 h-4" aria-hidden="true" /></button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination pagination={data.pagination} onPage={setPage} noun="staff members" />
        </>
      )}

      {form && <StaffForm staff={form === 'new' ? null : form} onClose={() => setForm(null)} onSaved={() => { setForm(null); void reload(); }} />}
      {resetting && <ResetPasswordDialog staff={resetting} onClose={() => setResetting(null)} />}
      {deactivating && <ConfirmDialog title="Deactivate this staff member?" confirmLabel="Deactivate" danger onClose={() => setDeactivating(null)} onConfirm={() => deactivate(deactivating)} message={<>{deactivating.name} will be signed out immediately and will not be able to sign in until reactivated.</>} />}
    </div>
  );
};

export default Staff;
