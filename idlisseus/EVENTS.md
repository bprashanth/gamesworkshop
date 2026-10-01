# Editing the expedition

`events.json` contains all 20 event cards. Edit the JSON directly, then run:

```bash
python3 -m unittest discover -s tests -v
python3 -m idlisseus --simulate 1000 --policy adaptive
```

Each event needs a unique `id`, a `phase` (`capability`, `scale`, `shock`,
`collective`, `market`), `title`, route `signal`, short situation `text`, and
`options`. Keep at least two events in each phase. The first four stops offer
two drawn routes; the last draws one unavoidable world change. All draws are
fixed when the expedition starts, including those still in fog.

Each option has `key` (`a`, `b`, optionally `c`), `label`, and ordered
`profiles`. The first profile whose `when` conditions match applies. The last
profile must be unconditional. Conditions may use `brain` (`remote`/`local`),
`data` (`private`/`open`), `guard` (`human`/`judge`), `contract` (boolean), and
`kit` (`dev`/`field`). A stronger model should not win every kind of problem.

```json
{
  "key": "a",
  "label": "Untangle the difficult cases",
  "profiles": [
    {"when": {"brain": "remote"}, "help": 4, "why": "Remote reasoning resolves the exceptions."},
    {"help": 4, "chance": 0.55, "fail_help": 1, "fail_harm": 1,
     "why": "Your local model finds a workable reading.",
     "fail_why": "A crucial exception is missed; only the basic cases get help."}
  ]
}
```

| Field | Meaning |
| --- | --- |
| `help` | Reach gained on success; required nonnegative integer |
| `harm` | Lives lost on success; default 0 |
| `chance` | Success probability, 0–1; default 1 |
| `fail_help`, `fail_harm` | Failure reach/life loss; defaults 0 and 1 |
| `why`, `fail_why` | Consequence explanation; failure text required for a gamble |
| `heal` | Lives recovered on success, capped at 3; cannot undo lethal harm |
| `gain_rebuilds` | Tokens recovered on success, capped at 2 |
| `set_stack` | Component changes on success, such as `{"data":"open"}` |
| `contract` | Set or clear the vendor obligation on success |

An option can require a kit with `require_kit` and spend it with
`consume_kit: true`. The favour is consumed even if that option fails. A kit
option disappears when unavailable or when an ordinary action gives exactly
the same effects for free. Kits do not recharge. Ordinary rebuilds cost one
token; leaving a contracted brain costs two and clears the obligation. Event
choices can offer explicit alternative transitions, such as deploying an open
model with the dev crew.

Strings can contain `{people}`, `{problem}`, `{place}`, or `{unit}` for mission
flavour. Keep signals informative: the player commits to the route before
seeing the complete card. A route's reach ceiling is its highest profile,
which can require a different stack or kit. All immediate odds and costs are
shown after arrival and before committing to an action.

Every gamble at a given seed/stop/event uses the same fixed hidden roll.
Inspecting choices or rebuilding cannot reroll it. Future cards and rolls are
absent from the public observation used by the terminal and test policies.

Keep the rules fictional and legible. A sharing-policy change cannot recall
published data: the preventable exposure card concerns the *next upload*.
Likewise, better advice does not manufacture appointments or drive a van.
