export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    lastPage: number;
  };
}

export function paginate(page = 1, limit = 20) {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 100);
  return {
    skip: (safePage - 1) * safeLimit,
    take: safeLimit,
  };
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  page = 1,
  limit = 20,
): PaginatedResult<T> {
  return {
    data,
    meta: {
      total,
      page,
      limit,
      lastPage: Math.ceil(total / limit),
    },
  };
}
