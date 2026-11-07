import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { supabase } from "@/integrations/supabase/client";
import { GUEST_ID } from "@/integrations/supabase/guest-client";

// The local adapter has no cloud session. Public inference needs no bearer;
// authenticated functions still attach the real session and verify it server-side.
const attachWorkspaceAuth = createMiddleware({ type: "function" }).client(async ({ next }) => {
  const { data: identity } = await supabase.auth.getUser();
  if (identity.user?.id === GUEST_ID) return next();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return next({ headers: token ? { Authorization: `Bearer ${token}` } : {} });
});

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachWorkspaceAuth],
  requestMiddleware: [errorMiddleware, csrfMiddleware],
}));
