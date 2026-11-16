"use strict";

const { createHmac, createHash, randomBytes, timingSafeEqual } = require("node:crypto");

const sessionName = "asimon_between";
const stateName = "asimon_between_oauth";
const sessionSeconds = 7 * 86400;
const stateSeconds = 600;

function auth(env) {
  const { GOOGLE_CLIENT_ID: clientId, GOOGLE_CLIENT_SECRET: clientSecret, SESSION_SECRET: secret } = env;
  const enabled = !!(clientId && clientSecret && secret?.length >= 32);

  function sign(payload, seconds) {
    const text = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + seconds * 1000 })).toString("base64url");
    return `${text}.${createHmac("sha256", secret).update(text).digest("base64url")}`;
  }

  function read(request, key) {
    if (!enabled) return null;
    const raw = request.headers.get("cookie")?.split(/;\s*/).find(cookie => cookie.startsWith(`${key}=`));
    if (!raw || raw.length > 1600) return null;
    const [text, signature, extra] = raw.slice(key.length + 1).split(".");
    if (!text || !signature || extra !== undefined) return null;
    const expected = createHmac("sha256", secret).update(text).digest();
    const actual = Buffer.from(signature, "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    try {
      const value = JSON.parse(Buffer.from(text, "base64url"));
      return value.exp > Date.now() ? value : null;
    } catch { return null; }
  }

  function origin(request) {
    return new URL(env.PUBLIC_ORIGIN || request.url).origin;
  }

  function cookie(request, key, value, age) {
    const secure = origin(request).startsWith("https:") ? "; Secure" : "";
    return `${key}=${value}; Path=/api/between; HttpOnly; SameSite=Lax; Max-Age=${age}${secure}`;
  }

  function redirect(location, values = []) {
    const headers = new Headers({ location, "cache-control": "no-store" });
    for (const value of values) headers.append("set-cookie", value);
    return new Response(null, { status: 303, headers });
  }

  function start(request) {
    const code = new URL(request.url).searchParams.get("room");
    const room = /^[A-Z0-9]{4}$/.test(code || "") ? code : "";
    const state = randomBytes(24).toString("base64url");
    const verifier = randomBytes(32).toString("base64url");
    const challenge = createHash("sha256").update(verifier).digest("base64url");
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.search = new URLSearchParams({
      client_id: clientId, redirect_uri: `${origin(request)}/api/between/auth/callback`,
      response_type: "code", scope: "openid", state,
      code_challenge: challenge, code_challenge_method: "S256"
    }).toString();
    return redirect(url.href, [cookie(request, stateName, sign({ state, verifier, room }, stateSeconds), stateSeconds)]);
  }

  async function finish(request, register) {
    const url = new URL(request.url);
    const saved = read(request, stateName);
    const returnTo = saved?.room ? `/between?room=${saved.room}` : "/between";
    const cookies = [cookie(request, stateName, "", 0)];
    try {
      if (!saved || !url.searchParams.get("code") || saved.state !== url.searchParams.get("state")) throw new Error("oauth_state");
      const token = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST", signal: AbortSignal.timeout(10_000),
        body: new URLSearchParams({ code: url.searchParams.get("code"), client_id: clientId,
          client_secret: clientSecret, code_verifier: saved.verifier, grant_type: "authorization_code",
          redirect_uri: `${origin(request)}/api/between/auth/callback` })
      });
      if (!token.ok) throw new Error("oauth_token");
      const { access_token: accessToken } = await token.json();
      if (!accessToken) throw new Error("oauth_token");
      const identity = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
        headers: { authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(10_000)
      });
      if (!identity.ok) throw new Error("oauth_identity");
      const { sub } = await identity.json();
      if (typeof sub !== "string" || !/^[0-9]{1,40}$/.test(sub)) throw new Error("oauth_identity");
      await register(sub);
      cookies.push(cookie(request, sessionName, sign({ user: sub }, sessionSeconds), sessionSeconds));
      return redirect(returnTo, cookies);
    } catch {
      return redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}auth=failed`, cookies);
    }
  }

  return {
    enabled, user: request => read(request, sessionName)?.user || null,
    start, finish, logout: request => cookie(request, sessionName, "", 0)
  };
}

module.exports = { auth };
