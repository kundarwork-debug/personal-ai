const ALLOWED_EMAILS = new Set([
  "kundar701@gmail.com",
  "kundar.work@gmail.com"
]);

const ACCESS_COOKIE = "nova_at";
const REFRESH_COOKIE = "nova_rt";

function readCookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  const entry = header.split(";").map((part) => part.trim()).find((part) => part.startsWith(name + "="));
  return entry ? entry.slice(name.length + 1) : "";
}

function cookie(name, value, maxAge) {
  return `${name}=${value}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

function clearCookie(name) {
  return `${name}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...extraHeaders }
  });
}

async function getSupabaseUser(accessToken, env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY || !accessToken) return null;
  try {
    const response = await fetch(`${env.SUPABASE_URL.replace(/\/$/, "")}/auth/v1/user`, {
      headers: {
        apikey: env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken}`
      }
    });
    if (!response.ok) return null;
    const user = await response.json();
    const email = String(user.email || "").trim().toLowerCase();
    return ALLOWED_EMAILS.has(email) ? user : null;
  } catch {
    return null;
  }
}

async function authorize(request, env) {
  const accessToken = readCookie(request, ACCESS_COOKIE);
  const refreshToken = readCookie(request, REFRESH_COOKIE);

  if (accessToken) {
    const user = await getSupabaseUser(accessToken, env);
    if (user) return { user, cookies: [] };
  }

  if (!refreshToken || !env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return null;

  try {
    const response = await fetch(`${env.SUPABASE_URL.replace(/\/$/, "")}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: {
        apikey: env.SUPABASE_ANON_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ refresh_token: refreshToken })
    });
    if (!response.ok) return null;
    const session = await response.json();
    const user = await getSupabaseUser(session.access_token, env);
    if (!user || !session.refresh_token) return null;
    return {
      user,
      cookies: [
        cookie(ACCESS_COOKIE, session.access_token, Math.max(60, Number(session.expires_in) || 3600)),
        cookie(REFRESH_COOKIE, session.refresh_token, 60 * 60 * 24 * 30)
      ]
    };
  } catch {
    return null;
  }
}

async function loginPage(env, request) {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    return new Response("NOVA sign-in is not configured yet. Add SUPABASE_URL and SUPABASE_ANON_KEY to the Worker variables.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }
    });
  }
  const asset = await env.ASSETS.fetch(new Request(new URL("/login.html", request.url)));
  const html = (await asset.text())
    .replaceAll("__SUPABASE_URL__", env.SUPABASE_URL)
    .replaceAll("__SUPABASE_ANON_KEY__", env.SUPABASE_ANON_KEY);
  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, private",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-Robots-Tag": "noindex, nofollow"
    }
  });
}

function withCookies(response, cookies = []) {
  const headers = new Headers(response.headers);
  for (const value of cookies) headers.append("Set-Cookie", value);
  headers.set("Cache-Control", "private, no-store");
  headers.set("X-Robots-Tag", "noindex, nofollow");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return json({ ok: true, authConfigured: Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY) });
    }

    if (url.pathname === "/auth/session" && request.method === "POST") {
      if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return json({ error: "Authentication is not configured." }, 503);
      let body;
      try { body = await request.json(); } catch { return json({ error: "Invalid request." }, 400); }
      const user = await getSupabaseUser(body.access_token, env);
      if (!user || !body.refresh_token) return json({ error: "This Google account is not authorized for NOVA." }, 403);
      return withCookies(json({ ok: true }), [
        cookie(ACCESS_COOKIE, body.access_token, 3600),
        cookie(REFRESH_COOKIE, body.refresh_token, 60 * 60 * 24 * 30)
      ]);
    }

    if (url.pathname === "/auth/logout") {
      const headers = new Headers({ Location: "/login", "Cache-Control": "no-store" });
      headers.append("Set-Cookie", clearCookie(ACCESS_COOKIE));
      headers.append("Set-Cookie", clearCookie(REFRESH_COOKIE));
      return new Response(null, { status: 302, headers });
    }

    if (url.pathname === "/auth/me") {
      const auth = await authorize(request, env);
      if (!auth) return json({ error: "Sign-in required." }, 401);
      return withCookies(json({ email: auth.user.email, id: auth.user.id }), auth.cookies);
    }

    if (url.pathname === "/login" || url.pathname === "/auth/callback") {
      const auth = await authorize(request, env);
      if (auth) return Response.redirect(new URL("/", request.url), 302);
      return loginPage(env, request);
    }

    const auth = await authorize(request, env);
    if (!auth) return loginPage(env, request);

    const assetResponse = await env.ASSETS.fetch(request);
    return withCookies(assetResponse, auth.cookies);
  }
};
