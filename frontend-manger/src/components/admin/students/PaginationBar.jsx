'use client';

import React from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis
} from '@/components/ui/pagination';

export default function PaginationBar({ page, totalPages, router, pathname, searchParams }) {
  // Guard clause: Don't render if 1 page or invalid data
  if (totalPages <= 1) return null;

  const handlePageChange = (newPageIdx) => {
    // 1. Create a FRESH params object from the current readonly searchParams
    const params = new URLSearchParams(searchParams.toString());
    
    // 2. Set the new page (Backend 0-indexed -> URL 1-indexed)
    params.set('page', (newPageIdx + 1).toString());
    
    // 3. Push
    router.push(`${pathname}?${params.toString()}`);
  };

  /**
   * Generates the array of visible pages [0, 1, -1, 10, 11]
   */
  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 0; i < totalPages; i++) {
      if (i === 0 || i === totalPages - 1 || (i >= page - delta && i <= page + delta)) {
        range.push(i);
      }
    }

    range.forEach(i => {
      if (l !== undefined) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push(-1);
        }
      }
      rangeWithDots.push(i);
      l = i;
    });

    return rangeWithDots;
  };

  return (
    <div className="flex justify-end py-4">
      <Pagination>
        <PaginationContent>
          
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => handlePageChange(page - 1)} 
              className={page <= 0 ? "pointer-events-none opacity-50" : "cursor-pointer"} 
            />
          </PaginationItem>

          {getVisiblePages().map((pageIdx, i) => (
            <PaginationItem key={i}>
              {pageIdx === -1 ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  onClick={() => handlePageChange(pageIdx)}
                  isActive={pageIdx === page}
                  className="cursor-pointer"
                >
                  {pageIdx + 1}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext 
              onClick={() => handlePageChange(page + 1)} 
              className={page >= totalPages - 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} 
            />
          </PaginationItem>

        </PaginationContent>
      </Pagination>
    </div>
  );
}