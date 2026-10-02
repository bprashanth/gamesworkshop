"""Keep observed survey evidence separate from invented puzzle conditions."""
from __future__ import annotations

from functools import lru_cache
import json
from pathlib import Path


ROOT = Path(__file__).parent


@lru_cache(None)
def dataset() -> dict:
    return json.loads((ROOT / "data" / "districts.json").read_text())


@lru_cache(None)
def problems() -> dict:
    return json.loads((ROOT / "problems.json").read_text())


@lru_cache(None)
def research() -> dict:
    return json.loads((ROOT / "research.json").read_text())


def problem_choices(district: dict) -> list[str]:
    """Two entry points, not a ranking of social importance.

    Prefer unsuppressed and adequately sampled indicators. Among those, show
    larger within-indicator coverage gaps first, without combining rates from
    different populations into a deprivation score.
    """
    available = [key for key in problems() if district["indicators"].get(key) is not None
                 and district["indicators"][key] < 100]
    return sorted(available, key=lambda key: (bool(district.get("flags", {}).get(key)),
                                             district["indicators"][key], key))[:2]


def fact(district: dict, problem: str) -> dict:
    if problem not in problems():
        raise ValueError("Unknown problem")
    meta = dataset()["indicators"][problem]
    value = district["indicators"].get(problem)
    return {
        "value": value, "label": meta["label"], "full_label": meta["source_label"],
        "flag": district.get("flags", {}).get(problem),
        "source_url": district.get("source_url", dataset()["metadata"]["resource_url"]),
        "scope": f"{district['name']} district, {district['state']}",
        "period": dataset()["metadata"]["survey_period"],
        "text": f"{meta['label']}: {value:.1f}%" if value is not None else
                f"{meta['label']}: estimate withheld",
    }
