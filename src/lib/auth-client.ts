import { createAuthClient } from "better-auth/client";
import { usernameClient } from "better-auth/client/plugins";

const origin =
  typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:4321";

export const authClient = createAuthClient({
  baseURL: `${origin}/api/auth`,
  plugins: [usernameClient()],
});
