/**
 * Query options for approval operations
 */

import { queryOptions } from '@tanstack/react-query';

/**
 * Query options for approvals
 */
export function approvalsQueryOptions(address: string) {
  return queryOptions({
    queryKey: ['approvals', address] as const,
  });
}
