#!/usr/bin/env python3
"""Read Dokploy deployment status for the MechVault app.

Kept as a script because the token must never be spliced into a shell
command line, where it lands in shell history and process listings.

Usage: python3 scripts/deploy-status.py [--deploy] [--wait SECONDS]
"""
from __future__ import annotations

import argparse
import json
import pathlib
import sys
import time
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
# The credential file lives one level above the repo, not inside it. Keeping it
# outside the working tree is deliberate: it must never be committable.
AUTH_CANDIDATES = [
    ROOT / "auth.json",
    ROOT.parent / "auth.json",
    pathlib.Path.home() / ".hermes" / "auth.json",
]
APP = "uiLkILKuBKk1ZNdq0lw6W"


def auth() -> tuple[str, str]:
    path = next((p for p in AUTH_CANDIDATES if p.exists()), None)
    if path is None:
        sys.exit(f"no auth.json found; looked in {[str(p) for p in AUTH_CANDIDATES]}")
    cfg = json.loads(path.read_text())
    for entry in cfg.get("credential_pool", {}).get("dokploy", []):
        tok = entry.get("access_token")
        if tok:
            return "http://192.168.29.68:3000", tok
    sys.exit("no dokploy access_token in credential_pool")


def api(path: str, url: str, tok: str, method: str = "GET", body: dict | None = None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        f"{url}{path}", method=method, data=data,
        # x-api-key is the header Dokploy accepts. Bearer and
        # x-dokploy-api-key both return 401 and make a valid key look bad.
        headers={"x-api-key": tok, "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read() or b"null")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--wait", type=int, default=0,
                    help="seconds to keep polling for a terminal status")
    ap.add_argument("--deploy", action="store_true",
                    help="trigger exactly one deployment before polling")
    args = ap.parse_args()
    url, tok = auth()

    # Probe project.all first: 200 proves key AND instance are both fine, so a
    # later failure is a real deploy problem and not an auth artefact. There is
    # no GET /api/application; probing that returns 401 and looks like a bad key.
    api("/api/project.all", url, tok)
    print("auth ok (project.all 200)")

    if args.deploy:
        # Exactly one trigger, never concurrent with an auto-deploy. Firing
        # several is what produced the four consecutive `cancelled` rows.
        #
        # Route is `application.deploy`, verified by probing: this Dokploy
        # version has NO deployment.forceDeploy / deploy.forceDeploy /
        # deployment.create. All four return 404 with a zodError-shaped body,
        # which reads like a bad key if you don't check the status code.
        res = api("/api/application.deploy", url, tok,
                  method="POST", body={"applicationId": APP})
        print(f"application.deploy -> HTTP 200 body={json.dumps(res)[:200]}")
        # Give the row time to appear before the first poll.
        time.sleep(15)

    deadline = time.time() + args.wait
    latest = None
    while True:
        # Route is deployment.all and applicationId is a REQUIRED param.
        try:
            deps = api(f"/api/deployment.all?applicationId={APP}", url, tok)
        except urllib.error.HTTPError as e:
            # A 5xx or 429 mid-poll is a Dokploy hiccup, not a deploy outcome.
            # Surface it and keep waiting instead of killing a long --wait and
            # losing the result the user is waiting on.
            print(f"  poll HTTP {e.code}, retrying")
            time.sleep(10)
            continue
        except (urllib.error.URLError, OSError) as e:
            # The Pi drops LAN connections mid-poll. Losing the socket is not a
            # deploy failure, so retry rather than aborting a long --wait.
            print(f"  poll error ({type(e).__name__}), retrying")
            time.sleep(10)
            continue
        if isinstance(deps, dict):
            deps = deps.get("deployments", [])
        if not deps:
            print("no deployments returned")
        else:
            for d in deps[:5]:
                print(f"  {d.get('status','?'):9} created={d.get('createdAt','?')[:19]}"
                      f"  id={d.get('deploymentId','?')}")
            latest = deps[0].get("status")
            print(f"latest: {latest}")
        if args.wait and time.time() < deadline and latest in (
                "pending", "queued", "building", "running", "in-progress", None):
            time.sleep(10)
            continue
        break
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
