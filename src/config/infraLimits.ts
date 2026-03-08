/**
 * Free-tier infrastructure limits.
 * Checked at runtime to log warnings before hitting billing.
 * See docs/INFRA.md for upgrade paths.
 *
 * @module infraLimits
 */

export const INFRA_LIMITS = {
  vercel: {
    /** Serverless function invocations per month (Hobby) */
    functionInvocationsPerMonth: 100_000,
    /** Bandwidth GB per month */
    bandwidthGbPerMonth: 100,
    /** Cron job invocations per day */
    cronInvocationsPerDay: 1,
  },
  supabase: {
    /** Database size MB */
    dbMb: 500,
    /** Monthly egress GB */
    egressGbPerMonth: 2,
    /** Max concurrent connections */
    maxConnections: 60,
  },
  upstash: {
    /** Commands per day on free tier */
    commandsPerDay: 10_000,
    /** Max database size MB */
    maxDataMb: 256,
  },
  flyio: {
    /** RAM MB on free shared CPU machine */
    ramMb: 256,
    /** Free machine hours per month */
    machineHoursPerMonth: 2_160,
  },
} as const;

/**
 * Thresholds at which to log a WARNING (percentage of free limit).
 * E.g. 0.8 = warn when 80 % of limit is reached.
 */
export const WARN_THRESHOLD = 0.8;
