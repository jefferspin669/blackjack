from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse
import argparse
import datetime as dt
import json
import random


ROOT = Path(__file__).resolve().parent
DATA_FILE = ROOT / "casino_state.json"

EVENTS = [
    "Pit boss is watching this table.",
    "The dealer reshuffles with a fresh shoe.",
    "A high roller walks by and everyone tightens up.",
    "The table cheers for a bold double down.",
    "Lucky lights flicker over the felt.",
    "The dealer says the next hand feels expensive.",
]

DAILY_TITLES = [
    "Beat the House",
    "Hot Seat",
    "Clean Shoe",
    "Chip Climb",
    "Dealer Pressure",
]


def default_state():
    return {
        "profile": {
            "name": "You",
            "bestBankroll": 1000,
            "roundsPlayed": 0,
            "achievements": [],
            "lastSeen": None,
        },
        "leaderboard": [
            {"name": "Vegas Vinnie", "bankroll": 2200, "rounds": 18},
            {"name": "Card Shark Carla", "bankroll": 1850, "rounds": 16},
            {"name": "Lucky Larry", "bankroll": 1325, "rounds": 12},
        ],
    }


def load_state():
    if not DATA_FILE.exists():
        return default_state()

    try:
        return json.loads(DATA_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return default_state()


def save_state(state):
    DATA_FILE.write_text(json.dumps(state, indent=2), encoding="utf-8")


def json_response(handler, status, payload):
    body = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type")
    handler.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    handler.end_headers()
    handler.wfile.write(body)


def daily_challenge():
    today = dt.date.today().isoformat()
    rng = random.Random(today)
    target = rng.choice([1250, 1500, 1750, 2000, 2500])

    return {
        "date": today,
        "title": rng.choice(DAILY_TITLES),
        "target": target,
        "bonus": rng.choice(["Win 3 hands", "Land a blackjack", "Win a split hand", "Reach High Stakes"]),
        "event": rng.choice(EVENTS),
    }


def update_achievements(profile, bankroll, stats):
    earned = set(profile.get("achievements", []))
    checks = [
        (bankroll >= 2500, "High Stakes Invite"),
        (bankroll >= 5000, "VIP Heat"),
        (bankroll >= 10000, "Casino Crusher"),
        (stats.get("streak", 0) >= 3, "Hot Streak"),
        (profile.get("roundsPlayed", 0) >= 10, "Regular"),
        (stats.get("biggestWin", 0) >= 150, "Big Swing"),
    ]

    new_items = []
    for passed, name in checks:
        if passed and name not in earned:
            earned.add(name)
            new_items.append(name)

    profile["achievements"] = sorted(earned)
    return new_items


def sorted_leaderboard(state):
    board = state.get("leaderboard", [])
    return sorted(board, key=lambda row: row.get("bankroll", 0), reverse=True)[:8]


class CasinoHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_OPTIONS(self):
        json_response(self, 200, {"ok": True})

    def do_GET(self):
        path = urlparse(self.path).path

        if path == "/api/profile":
            state = load_state()
            json_response(self, 200, state["profile"])
            return

        if path == "/api/leaderboard":
            state = load_state()
            json_response(self, 200, {"leaderboard": sorted_leaderboard(state)})
            return

        if path == "/api/challenge":
            json_response(self, 200, daily_challenge())
            return

        if path == "/api/event":
            json_response(self, 200, {"message": random.choice(EVENTS)})
            return

        super().do_GET()

    def do_POST(self):
        path = urlparse(self.path).path

        if path != "/api/round":
            json_response(self, 404, {"error": "Not found"})
            return

        length = int(self.headers.get("Content-Length", "0"))
        raw_body = self.rfile.read(length).decode("utf-8") if length else "{}"

        try:
            payload = json.loads(raw_body)
        except json.JSONDecodeError:
            json_response(self, 400, {"error": "Invalid JSON"})
            return

        state = load_state()
        profile = state["profile"]
        bankroll = int(payload.get("bankroll", 0))
        stats = payload.get("stats", {})

        profile["lastSeen"] = dt.datetime.now(dt.timezone.utc).isoformat()
        profile["roundsPlayed"] = int(profile.get("roundsPlayed", 0)) + 1
        profile["bestBankroll"] = max(int(profile.get("bestBankroll", 1000)), bankroll)
        new_achievements = update_achievements(profile, bankroll, stats)

        user_row = {
            "name": profile.get("name", "You"),
            "bankroll": profile["bestBankroll"],
            "rounds": profile["roundsPlayed"],
        }

        board = [row for row in state.get("leaderboard", []) if row.get("name") != user_row["name"]]
        board.append(user_row)
        state["leaderboard"] = sorted(board, key=lambda row: row.get("bankroll", 0), reverse=True)[:8]

        save_state(state)

        json_response(self, 200, {
            "profile": profile,
            "leaderboard": sorted_leaderboard(state),
            "newAchievements": new_achievements,
        })


def main():
    parser = argparse.ArgumentParser(description="Casino Blackjack local backend")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", default=4175, type=int)
    args = parser.parse_args()

    server = ThreadingHTTPServer((args.host, args.port), CasinoHandler)
    print(f"Casino Blackjack backend running at http://{args.host}:{args.port}/")
    server.serve_forever()


if __name__ == "__main__":
    main()
