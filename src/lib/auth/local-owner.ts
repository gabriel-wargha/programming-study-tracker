export const LOCAL_OWNER_ID = "local-owner";
export const LOCAL_OWNER_NAME = "Local owner";

type LocalOwnerEnvironment = {
  NODE_ENV?: string;
  LOCAL_OWNER_MODE?: string;
  VERCEL?: string;
  DATABASE_URL?: string;
};

/**
 * The local owner exists only for `next dev` on the owner's machine before
 * Neon Auth is connected. Every other combination fails closed.
 */
export function isLocalOwnerAllowed(env: LocalOwnerEnvironment) {
  return (
    env.NODE_ENV === "development" &&
    env.LOCAL_OWNER_MODE === "1" &&
    !env.VERCEL &&
    !env.DATABASE_URL
  );
}
