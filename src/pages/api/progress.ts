import type { APIRoute } from "astro";
import { getSessionSafe, type AuthUser } from "../../lib/auth";
import { readStates, updateTopic, updateProblem } from "../../lib/tracker/store";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function currentUser(request: Request): Promise<string | null> {
  const session = await getSessionSafe(request.headers);
  if (!session) return null;
  const user = session.user as AuthUser;
  return user?.id ?? null;
}

export const GET: APIRoute = async ({ request }) => {
  const userId = await currentUser(request);
  if (!userId) return json(401, { error: "unauthorized" });
  try {
    return json(200, await readStates(userId));
  } catch (e) {
    // Surface the real cause: a tracker that silently reads "0%" because the
    // DB is unreachable is worse than one that says it failed.
    return json(500, { error: (e as Error).message });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const userId = await currentUser(request);
  if (!userId) return json(401, { error: "unauthorized" });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: "invalid JSON body" });
  }

  const payload = body as {
    kind?: string;
    key?: string;
    state?: string;
    hintLevel?: number;
    errorReason?: string | null;
  };

  if (!payload?.kind || !payload.key || !payload.state) {
    return json(400, { error: "kind, key and state are required" });
  }

  try {
    const result =
      payload.kind === "topic"
        ? await updateTopic(userId, {
            key: payload.key,
            state: payload.state,
            errorReason: payload.errorReason ?? null,
          })
        : payload.kind === "problem"
          ? await updateProblem(userId, {
              key: payload.key,
              state: payload.state,
              hintLevel: payload.hintLevel,
              errorReason: payload.errorReason ?? null,
            })
          : { ok: false, error: `Unknown kind: ${payload.kind}` };

    if (!result.ok) return json(400, { error: result.error });
    return json(200, { ok: true });
  } catch (e) {
    return json(500, { error: (e as Error).message });
  }
};
