"""
LRU cache for coaching responses.
Cache key: sha256(fen | move_uci | persona_id)
In-memory only — resets on server restart (sufficient for demo/portfolio).
"""
import hashlib
from collections import OrderedDict
from threading import Lock

_MAX_SIZE = 512


class _LRUCache:
    def __init__(self, maxsize: int) -> None:
        self._cache: OrderedDict[str, str] = OrderedDict()
        self._maxsize = maxsize
        self._lock = Lock()
        self._hits = 0
        self._misses = 0

    def _make_key(self, fen: str, move_uci: str, persona_id: str) -> str:
        raw = f"{fen}|{move_uci}|{persona_id}"
        return hashlib.sha256(raw.encode()).hexdigest()

    def get(self, fen: str, move_uci: str, persona_id: str) -> str | None:
        key = self._make_key(fen, move_uci, persona_id)
        with self._lock:
            if key in self._cache:
                self._cache.move_to_end(key)
                self._hits += 1
                return self._cache[key]
            self._misses += 1
            return None

    def set(self, fen: str, move_uci: str, persona_id: str, value: str) -> None:
        key = self._make_key(fen, move_uci, persona_id)
        with self._lock:
            if key in self._cache:
                self._cache.move_to_end(key)
            self._cache[key] = value
            if len(self._cache) > self._maxsize:
                self._cache.popitem(last=False)

    def stats(self) -> dict:
        with self._lock:
            total = self._hits + self._misses
            return {
                "size": len(self._cache),
                "maxsize": self._maxsize,
                "hits": self._hits,
                "misses": self._misses,
                "hit_rate": round(self._hits / total, 3) if total else 0,
            }


_coach_cache = _LRUCache(maxsize=_MAX_SIZE)


def get_cached_coaching(context: str, move_uci: str, persona_id: str) -> str | None:
    """context = any stable string representing the coaching situation (e.g. classification+eval)."""
    return _coach_cache.get(context, move_uci, persona_id)


def set_cached_coaching(context: str, move_uci: str, persona_id: str, message: str) -> None:
    _coach_cache.set(context, move_uci, persona_id, message)


def cache_stats() -> dict:
    return _coach_cache.stats()
