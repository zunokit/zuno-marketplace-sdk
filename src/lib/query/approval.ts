/**
 * Query options for approval operations
 */


/**
 * Query options for approvals
 */
export function approvalsQueryKey(address: string) {
  return ['approvals', address] as const;
}
