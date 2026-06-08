export interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  startItem: number;
  endItem: number;
}

export function getPaginationInfo(
  totalItems: number,
  pageSize: number,
  currentPage: number,
): PaginationInfo {
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.ceil(totalItems / safePageSize) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * safePageSize + 1;
  const endItem = Math.min(totalItems, safeCurrentPage * safePageSize);

  return {
    currentPage: safeCurrentPage,
    pageSize: safePageSize,
    totalItems,
    totalPages,
    startItem,
    endItem,
  };
}

export function paginateItems<T>(
  items: T[],
  pageSize: number,
  currentPage: number,
): T[] {
  const { pageSize: safePageSize, currentPage: safeCurrentPage } =
    getPaginationInfo(items.length, pageSize, currentPage);
  const startIndex = (safeCurrentPage - 1) * safePageSize;
  return items.slice(startIndex, startIndex + safePageSize);
}

