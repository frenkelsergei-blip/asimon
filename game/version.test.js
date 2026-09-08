/* The version surface. A phone that lives on a home screen has no address bar
   to pull down, so everything here is what stands between a table and a build
   from three weeks ago: the page says which build it is, the server says which
   build it serves, the two are compared over the wire, and the list of what
   changed in between hangs off the same line.

   node game/version.test.js                                                 */
"use strict";
const { spawn } = require("child_process");
const path = require("path");

const PORT = 3998;
const REMOTE = process.env.ASIMON_BASE || "";
const BASE = REMOTE || ("http://127.0.0.1:" + PORT);
const pkg = require("../package.json");
const bad = [];
const ok = (c, m) => { if(!c) bad.push(m); };
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const server = REMOTE ? null
    : spawn(process.execPath, [path.join(__dirname, "..", "server.js")],
            { env: Object.assign({}, process.env, { PORT:String(PORT) }),
              stdio:["ignore","ignore","inherit"] });
  const cleanup = () => { try{ if(server) server.kill(); }catch(e){} };
  process.on("exit", cleanup);

  try {
    for(let i = 0; i < 60; i++){
      try{ const r = await fetch(BASE + "/"); if(r.ok) break; }catch(e){}
      await wait(REMOTE ? 2000 : 100);
    }

    /* ---- what the server says it is serving ---- */
    const vr = await fetch(BASE + "/api/version");
    const v = await vr.json();
    ok(vr.ok, "/api/version did not answer");
    ok(v.version === pkg.version, "the version served is not the one in package.json: " + v.version);
    ok(/^[0-9a-f]{10}$/.test(String(v.build)), "the build is not a hash: " + v.build);
    ok(vr.headers.get("cache-control") === "no-store",
       "the version answer may be cached — a stale phone would keep hearing its own build back");

    /* ---- and what it says has changed since ---- */
    const cr = await fetch(BASE + "/api/changelog?lang=he");
    const cg = await cr.json();
    ok(cr.ok, "/api/changelog did not answer");
    ok(cr.headers.get("cache-control") === "no-store",
       "the changelog may be cached — a phone would keep reading an old one back");
    ok(Array.isArray(cg.releases) && cg.releases.length > 0, "the changelog came back empty");
    ok(cg.releases[0].v === v.version,
       "the newest release (" + (cg.releases[0] || {}).v + ") is not the version being served (" +
       v.version + ") — run `npm run release`");
    ok(cg.releases[0].lines.length > 0, "the newest release says nothing changed");
    /* the language asked for is the language handed back, or a Hebrew table
       reads its release notes in English */
    const en = await (await fetch(BASE + "/api/changelog?lang=en")).json();
    ok(en.releases[0].lines[0].text !== cg.releases[0].lines[0].text,
       "the changelog came back in the same language for he and en");

    const hz = await (await fetch(BASE + "/healthz")).json();
    ok(hz.build === v.build, "/healthz and /api/version disagree about the build");

    /* asked twice with nothing changed in between, the build must not move —
       a restart or a redeploy of the same files is not a new version */
    const again = await (await fetch(BASE + "/api/version")).json();
    ok(again.build === v.build, "the build changed between two asks with nothing edited");

    /* ---- what the page says it is ---- */
    const pr = await fetch(BASE + "/");
    const html = await pr.text();
    ok(pr.headers.get("cache-control") === "no-store",
       "the page may be cached — then nothing downstream of it can ever be replaced");
    ok(html.indexOf('<meta name="asimon-build" content="' + v.build + '">') >= 0,
       "the page does not carry the build it was served as");
    ok(html.indexOf('<meta name="asimon-version" content="' + pkg.version + '">') >= 0,
       "the page does not carry the version");

    /* every local script and stylesheet must be stamped, or a phone could hold
       an old app.js against a new style.css */
    const refs = [...html.matchAll(/(?:href|src)="(\/[^"]+\.(?:css|js))([^"]*)"/g)];
    ok(refs.length >= 4, "the page loads fewer local files than expected: " + refs.length);
    refs.forEach(m => ok(m[2] === "?v=" + v.build,
      m[1] + " is not stamped with the build: " + (m[2] || "(bare)")));

    /* ---- an asset asked for by build may be kept; anything else may not ---- */
    const stamped = await fetch(BASE + "/app.js?v=" + v.build);
    ok(/immutable/.test(stamped.headers.get("cache-control") || ""),
       "an asset asked for by build is not allowed to be kept: " + stamped.headers.get("cache-control"));
    const stale = await fetch(BASE + "/app.js?v=0000000000");
    ok(stale.headers.get("cache-control") === "no-store",
       "an asset asked for under an old build was handed out as cacheable");
    const bare = await fetch(BASE + "/app.js");
    ok(bare.headers.get("cache-control") === "no-store",
       "an unstamped asset was handed out as cacheable");

    /* ---- and the manifest the home screen installs from ---- */
    const mr = await fetch(BASE + "/manifest.webmanifest");
    ok(mr.ok, "there is no web manifest to install from");
    const man = await mr.json().catch(() => null);
    ok(man && man.start_url === "/" && man.display === "standalone",
       "the manifest does not open the app at the root as its own window");
    ok(man && Array.isArray(man.icons) && man.icons.length > 0, "the manifest has no icon");

  } catch(e){
    bad.push("threw: " + (e && e.message));
  } finally {
    cleanup();
  }

  console.log(bad.length ? "FAIL (" + bad.length + "):\n" + [...new Set(bad)].join("\n")
    : "version ok — the page names its build, the server names its own, and only a matching one may be kept");
  process.exit(bad.length ? 1 : 0);
})();
