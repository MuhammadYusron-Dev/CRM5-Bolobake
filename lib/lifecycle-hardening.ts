export const roleCache: Record<string, { role: string; expiresAt: number }> = {};

export const eventLock: Record<string, { lockedBy: string; expiresAt: number }> = {};

export const allowedTransitions: Record<string, string[]> = {
  ADMIN: ["PRODUCTION"],
  PRODUCTION: ["PACKING"],
  PACKING: ["DELIVERY"],
  DELIVERY: ["COMPLETED"],
  COMPLETED: []
};
