"""
In-process telemetry ring buffer for Stockfish, Groq, and ElevenLabs.
Tracks latency, cost estimates, errors, and cache hits per service.
Exposed via GET /api/telemetry for the dev dashboard.
"""
import time
from collections import deque
from dataclasses import dataclass, field
from statistics import median, quantiles
from threading import Lock

# Rough cost estimates (USD per 1000 units)
_GROQ_COST_PER_1K_TOKENS  = 0.00059   # llama-3.3-70b-versatile input+output blended
_TTS_COST_PER_1K_CHARS    = 0.003     # ElevenLabs starter tier

_RING_SIZE = 1000


@dataclass
class _Record:
    service: str
    latency_ms: float
    tokens: int = 0
    chars: int = 0
    error: bool = False
    cache_hit: bool = False
    ts: float = field(default_factory=time.time)


class _Telemetry:
    def __init__(self) -> None:
        self._buf: deque[_Record] = deque(maxlen=_RING_SIZE)
        self._lock = Lock()

    def record(
        self,
        service: str,
        latency_ms: float,
        tokens: int = 0,
        chars: int = 0,
        error: bool = False,
        cache_hit: bool = False,
    ) -> None:
        with self._lock:
            self._buf.append(_Record(service, latency_ms, tokens, chars, error, cache_hit))

    def stats(self) -> dict:
        with self._lock:
            records = list(self._buf)

        services = sorted({r.service for r in records})
        result: dict = {"total_records": len(records), "services": {}}

        for svc in services:
            svc_records = [r for r in records if r.service == svc]
            latencies = sorted(r.latency_ms for r in svc_records if not r.error)
            errors = sum(1 for r in svc_records if r.error)
            hits = sum(1 for r in svc_records if r.cache_hit)
            total_tokens = sum(r.tokens for r in svc_records)
            total_chars  = sum(r.chars  for r in svc_records)

            p50 = median(latencies) if latencies else 0
            p95 = quantiles(latencies, n=20)[18] if len(latencies) >= 20 else (latencies[-1] if latencies else 0)
            p99 = quantiles(latencies, n=100)[98] if len(latencies) >= 100 else (latencies[-1] if latencies else 0)

            est_cost = 0.0
            if svc == "groq":
                est_cost = (total_tokens / 1000) * _GROQ_COST_PER_1K_TOKENS
            elif svc == "elevenlabs":
                est_cost = (total_chars / 1000) * _TTS_COST_PER_1K_CHARS

            result["services"][svc] = {
                "calls": len(svc_records),
                "errors": errors,
                "error_rate": round(errors / len(svc_records), 3) if svc_records else 0,
                "cache_hits": hits,
                "cache_hit_rate": round(hits / len(svc_records), 3) if svc_records else 0,
                "latency_p50_ms": round(p50, 1),
                "latency_p95_ms": round(p95, 1),
                "latency_p99_ms": round(p99, 1),
                "total_tokens": total_tokens,
                "total_chars": total_chars,
                "est_cost_usd": round(est_cost, 6),
            }

        return result


_telemetry = _Telemetry()


def record_latency(service: str, latency_ms: float, tokens: int = 0, chars: int = 0) -> None:
    _telemetry.record(service, latency_ms, tokens=tokens, chars=chars)


def record_error(service: str, latency_ms: float = 0) -> None:
    _telemetry.record(service, latency_ms, error=True)


def record_cache_hit(service: str) -> None:
    _telemetry.record(service, latency_ms=0, cache_hit=True)


def get_stats() -> dict:
    return _telemetry.stats()
