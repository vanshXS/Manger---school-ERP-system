'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

const DEFAULT_PAGE_SIZE = 10;
const ELLIPSIS = 'ellipsis';

function toNumber(value, fallback = 0) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

function getVisiblePages(currentPage, totalPages) {
  const edgePages = 1;
  const siblingPages = 1;
  const visiblePages = [];

  for (let pageIndex = 0; pageIndex < totalPages; pageIndex += 1) {
    const isEdgePage = pageIndex < edgePages || pageIndex >= totalPages - edgePages;
    const isSiblingPage = Math.abs(pageIndex - currentPage) <= siblingPages;

    if (isEdgePage || isSiblingPage) {
      visiblePages.push(pageIndex);
    }
  }

  return visiblePages.reduce((pages, pageIndex, index) => {
    if (index > 0) {
      const previousPage = visiblePages[index - 1];
      if (pageIndex - previousPage > 1) {
        pages.push(ELLIPSIS);
      }
    }

    pages.push(pageIndex);
    return pages;
  }, []);
}

export default function PaginationBar({
  pageData,
  onPageChange,
  itemLabel = 'items',
  className,
  isLoading = false
}) {
  const currentPage = Math.max(0, toNumber(pageData?.number));
  const totalPages = Math.max(0, toNumber(pageData?.totalPages));

  if (totalPages <= 1) {
    return null;
  }

  const totalElements = Math.max(0, toNumber(pageData?.totalElements));
  const pageSize = Math.max(
    1,
    toNumber(pageData?.size, toNumber(pageData?.pageable?.pageSize, DEFAULT_PAGE_SIZE))
  );
  const numberOfElements = Math.max(
    0,
    toNumber(pageData?.numberOfElements, Array.isArray(pageData?.content) ? pageData.content.length : 0)
  );

  const isFirstPage = pageData?.first ?? currentPage <= 0;
  const isLastPage = pageData?.last ?? currentPage >= totalPages - 1;
  const visiblePages = getVisiblePages(currentPage, totalPages);

  const fallbackNumberOfElements = Math.min(
    pageSize,
    Math.max(totalElements - currentPage * pageSize, 0)
  );
  const currentPageCount = numberOfElements || fallbackNumberOfElements;
  const startItem = totalElements === 0 || currentPageCount === 0 ? 0 : currentPage * pageSize + 1;
  const endItem = startItem === 0 ? 0 : Math.min(totalElements, currentPage * pageSize + currentPageCount);

  const handlePageChange = (nextPage) => {
    if (!onPageChange || isLoading) {
      return;
    }

    if (nextPage < 0 || nextPage >= totalPages || nextPage === currentPage) {
      return;
    }

    onPageChange(nextPage);
  };

  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="text-sm text-slate-500">
        <span className="font-semibold text-slate-700">Page {currentPage + 1}</span>
        <span> of </span>
        <span className="font-semibold text-slate-700">{totalPages}</span>
        {startItem > 0 && (
          <span className="hidden sm:inline">
            {' '}
            . Showing {startItem}-{endItem} of {totalElements} {itemLabel}
          </span>
        )}
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={isLoading || isFirstPage}
          className="gap-1 rounded-lg"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="hidden items-center gap-1 sm:flex">
          {visiblePages.map((pageItem, index) => {
            if (pageItem === ELLIPSIS) {
              return (
                <span key={`ellipsis-${index}`} className="px-1 text-slate-400">
                  <MoreHorizontal className="h-4 w-4" />
                </span>
              );
            }

            const isActive = pageItem === currentPage;

            return (
              <Button
                key={pageItem}
                type="button"
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => handlePageChange(pageItem)}
                disabled={isLoading}
                className="min-w-9 rounded-lg px-3"
              >
                {pageItem + 1}
              </Button>
            );
          })}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={isLoading || isLastPage}
          className="gap-1 rounded-lg"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
