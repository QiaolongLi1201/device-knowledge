/**
 * Convert device-knowledge priority (lower wins) to Moss platformClaimPriority (higher wins).
 *
 * device-knowledge ranges:
 *   official:  0-99
 *   community: 100-499
 *   user:      500-999
 *
 * Formula: mossPriority = 999 - dkPriority
 *
 * Result:
 *   official  0-99   → 999-900
 *   community 100-499 → 899-500
 *   user      500-999 → 499-0
 */
export function convertDkPriorityToMoss(dkPriority: number): number {
  if (!Number.isInteger(dkPriority)) {
    throw new Error(`dkPriority must be an integer, got ${dkPriority}`);
  }
  if (dkPriority < 0 || dkPriority > 999) {
    throw new Error(`dkPriority must be in range [0, 999], got ${dkPriority}`);
  }
  return 999 - dkPriority;
}
