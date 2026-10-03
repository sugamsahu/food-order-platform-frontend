import React, { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Archive, ArchiveRestore, Loader2, Pencil, Plus, Search } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { usePagedData } from '../hooks/usePagedData';
import { applyFieldErrors, errorMessage } from '../utils/errors';
import { formatMoney } from '../utils/format';
import type { Food } from '../types';
import { foodSchema, type FoodFormValues } from './foodSchema';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews';
import { btnGhost, btnPrimary, cardClass, inputClass, labelClass } from '../components/ui';


const FoodForm: React.FC<{ food: Food | null; categories: string[]; onSaved: () => void; onClose: () => void }> = ({ food, categories, onSaved, onClose }) => {
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<FoodFormValues>({
    resolver: zodResolver(foodSchema),
    defaultValues: {
      name: food?.name ?? '', category: food?.category ?? '', price: food?.price ?? '',
      image_url: food?.image_url ?? '', description: food?.description ?? '', is_available: food?.is_available ?? true,
    },
  });

  const onSubmit = async (v: FoodFormValues) => {
    const body = { ...v, description: v.description || null, image_url: v.image_url || null };
    try {
      if (food) await api.patch(`/foods/${food.id}`, body);
      else await api.post('/foods', body);
      toast.success(food ? 'Food updated' : 'Food added');
      onSaved();
    } catch (err) {
      if (!applyFieldErrors(err, setError)) toast.error(errorMessage(err));
    }
  };

  const field = (id: keyof FoodFormValues, label: string, input: React.ReactNode) => (
    <div>
      <label htmlFor={`food-${id}`} className={labelClass}>{label}</label>
      {input}
      {errors[id] && <p id={`food-${id}-error`} className="mt-1 text-sm text-red-400">{errors[id]?.message as string}</p>}
    </div>
  );
  const aria = (id: keyof FoodFormValues) => ({ id: `food-${id}`, 'aria-invalid': !!errors[id], 'aria-describedby': errors[id] ? `food-${id}-error` : undefined });

  return (
    <Modal title={food ? 'Edit food' : 'Add food'} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {field('name', 'Name', <input type="text" {...aria('name')} {...register('name')} className={inputClass} />)}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field('price', 'Price', <input type="text" inputMode="decimal" placeholder="9.50" {...aria('price')} {...register('price')} className={inputClass} />)}
          {field('category', 'Category', <>
            <input type="text" list="food-categories" {...aria('category')} {...register('category')} className={inputClass} />
            <datalist id="food-categories">{categories.map((c) => <option key={c} value={c} />)}</datalist>
          </>)}
        </div>
        {field('image_url', 'Image URL (optional)', <input type="url" placeholder="https://..." {...aria('image_url')} {...register('image_url')} className={inputClass} />)}
        {field('description', 'Description (optional)', <textarea rows={3} {...aria('description')} {...register('description')} className={inputClass} />)}
        <label className="flex items-center gap-3 text-gray-300">
          <input type="checkbox" {...register('is_available')} className="w-4 h-4 accent-orange-500" /> Available to order
        </label>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className={btnGhost} onClick={onClose}>Cancel</button>
          <button type="submit" className={btnPrimary} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : null} Save food
          </button>
        </div>
      </form>
    </Modal>
  );
};

const Foods: React.FC = () => {
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [availability, setAvailability] = useState('all');
  const [category, setCategory] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);
  const [editing, setEditing] = useState<Food | 'new' | null>(null);
  const [archiving, setArchiving] = useState<Food | null>(null);

  const q = useDebouncedValue(search.trim());
  const { data, loading, error, reload } = usePagedData<Food>('/foods', {
    q, availability, category, include_archived: showArchived, page, page_size: 12,
  });

  const loadCategories = useCallback(async () => {
    try {
      setCategories((await api.get<{ data: string[] }>('/foods/categories')).data.data);
    } catch {
      /* the category filter is optional */
    }
  }, []);
  useEffect(() => {
    let active = true;
    api.get<{ data: string[] }>('/foods/categories')
      .then((res) => { if (active) setCategories(res.data.data); })
      .catch(() => { /* the category filter is optional */ });
    return () => { active = false; };
  }, []);

  const resetPage = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(1); };

  const toggle = async (food: Food) => {
    try {
      await api.patch(`/foods/${food.id}/availability`, { is_available: !food.is_available });
      toast.success(`${food.name} is now ${food.is_available ? 'unavailable' : 'available'}`);
      await reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const archive = async (food: Food) => {
    try {
      await api.patch(`/foods/${food.id}/archive`);
      toast.success(`${food.name} archived`);
      await Promise.all([reload(), loadCategories()]);
    } catch (err) {
      toast.error(errorMessage(err));
      throw err;
    }
  };

  const restore = async (food: Food) => {
    try {
      await api.patch(`/foods/${food.id}/restore`);
      toast.success(`${food.name} restored`);
      await Promise.all([reload(), loadCategories()]);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const saved = () => {
    setEditing(null);
    void reload();
    void loadCategories();
  };

  return (
    <div>
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Menu catalog</h1>
          <p className="text-gray-400">Manage your restaurant&apos;s food offerings.</p>
        </div>
        <button type="button" onClick={() => setEditing('new')} className={btnPrimary}><Plus className="w-4 h-4" aria-hidden="true" /> Add food</button>
      </header>

      <form role="search" onSubmit={(e) => e.preventDefault()} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="relative lg:col-span-2">
          <label htmlFor="food-search" className="sr-only">Search foods</label>
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-500 pointer-events-none" aria-hidden="true" />
          <input id="food-search" type="search" value={search} onChange={(e) => resetPage(setSearch)(e.target.value)} placeholder="Search foods..." className={`${inputClass} pl-10`} />
        </div>
        <div>
          <label htmlFor="food-availability" className="sr-only">Filter by availability</label>
          <select id="food-availability" value={availability} onChange={(e) => resetPage(setAvailability)(e.target.value)} className={inputClass}>
            <option value="all">All availability</option>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </div>
        <div>
          <label htmlFor="food-category-filter" className="sr-only">Filter by category</label>
          <select id="food-category-filter" value={category} onChange={(e) => resetPage(setCategory)(e.target.value)} className={inputClass}>
            <option value="">All categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-300 sm:col-span-2 lg:col-span-4">
          <input type="checkbox" checked={showArchived} onChange={(e) => resetPage(setShowArchived)(e.target.checked)} className="w-4 h-4 accent-orange-500" /> Show archived foods
        </label>
      </form>

      {loading && !data ? <LoadingState label="Loading foods" /> : error ? <ErrorState message={error} onRetry={() => reload()} /> : data && data.data.length === 0 ? (
        <EmptyState message="No foods found." hint={search || availability !== 'all' || category ? 'Try changing your search or filters.' : 'Add your first food to get started.'} />
      ) : data && (
        <>
          <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {data.data.map((food) => (
              <li key={food.id} className={`${cardClass} overflow-hidden flex flex-col ${food.archived_at ? 'opacity-70' : ''} ${!food.is_available && !food.archived_at ? 'border-red-900/50' : ''}`}>
                {food.image_url && <img src={food.image_url} alt="" loading="lazy" className="h-36 w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex justify-between items-start gap-3 mb-1">
                    <h2 className="font-bold text-lg text-white">{food.name}</h2>
                    <span className="font-bold text-orange-400 whitespace-nowrap">{formatMoney(food.price, food.currency)}</span>
                  </div>
                  <p className="text-xs uppercase tracking-wide text-gray-400 mb-3">{food.category}{food.archived_at && <span className="ml-2 text-red-300">Archived</span>}</p>
                  <p className="text-gray-400 text-sm mb-5 line-clamp-2 flex-1">{food.description}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-800 gap-2">
                    <button type="button" onClick={() => toggle(food)} disabled={!!food.archived_at} aria-pressed={food.is_available}
                      aria-label={`${food.name}: ${food.is_available ? 'available' : 'unavailable'}. Click to ${food.is_available ? 'mark unavailable' : 'mark available'}`}
                      className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider border disabled:opacity-50 ${food.is_available ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-red-500/10 text-red-300 border-red-500/30'}`}>
                      {food.is_available ? 'Available' : 'Unavailable'}
                    </button>
                    <div className="flex gap-1">
                      {!food.archived_at && (
                        <button type="button" onClick={() => setEditing(food)} aria-label={`Edit ${food.name}`} className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg">Edit</button>
                      )}
                      {isAdmin && (food.archived_at
                        ? <button type="button" onClick={() => restore(food)} aria-label={`Restore ${food.name}`} className="p-2 text-emerald-300 hover:bg-emerald-900/20 rounded-lg"><ArchiveRestore className="w-4 h-4" aria-hidden="true" /></button>
                        : <button type="button" onClick={() => setArchiving(food)} aria-label={`Archive ${food.name}`} className="p-2 text-red-300 hover:bg-red-900/20 rounded-lg">Delete</button>)}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <Pagination pagination={data.pagination} onPage={setPage} noun="foods" />
        </>
      )}

      {editing && <FoodForm food={editing === 'new' ? null : editing} categories={categories} onSaved={saved} onClose={() => setEditing(null)} />}
      {archiving && (
        <ConfirmDialog title="Archive this food?" confirmLabel="Archive" danger onClose={() => setArchiving(null)} onConfirm={() => archive(archiving)}
          message={<>&quot;{archiving.name}&quot; will be hidden from the menu and can no longer be ordered. Existing orders keep their history, and you can restore it later.</>} />
      )}
    </div>
  );
};

export default Foods;
