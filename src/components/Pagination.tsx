import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Pagination as PaginationInfo } from '../types';
import { btnGhost } from './ui';

interface Props {
  pagination: PaginationInfo;
  onPage: (page: number) => void;
  noun?: string;
}

const Pagination: React.FC<Props> = ({ pagination, onPage, noun = 'results' }) => {
  const { page, page_size: size, total, total_pages: pages } = pagination;
  if (total === 0) return null;
  const from = (page - 1) * size + 1;
  const to = Math.min(page * size, total);
  return (
    <nav aria-label="Pagination" className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 text-sm text-gray-400">
      <p aria-live="polite">Showing {from}-{to} of {total} {noun}</p>
      <div className="flex items-center gap-2">
        <button type="button" className={btnGhost} disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
          <ChevronLeft className="w-4 h-4" aria-hidden="true" /> Previous
        </button>
        <span className="px-2">Page {page} of {pages}</span>
        <button type="button" className={btnGhost} disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page">
          Next <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
};

export default Pagination;
