"""API integration tests using FastAPI's ASGI interface without external dependencies."""

import asyncio
from ai.vision.api import app


async def simulate_get(path: str) -> dict:
    scope = {
        "type": "http",
        "method": "GET",
        "path": path,
        "raw_path": path.encode(),
        "query_string": b"",
        "headers": [(b"host", b"testserver")],
        "server": ("testserver", 80),
    }

    response_headers = []
    response_body = bytearray()
    status_code = 0

    async def receive():
        return {"type": "http.request", "body": b"", "more_body": False}

    async def send(message):
        nonlocal status_code, response_headers, response_body
        if message["type"] == "http.response.start":
            status_code = message["status"]
            response_headers = message.get("headers", [])
        elif message["type"] == "http.response.body":
            response_body.extend(message.get("body", b""))

    await app(scope, receive, send)

    import json
    return {
        "status_code": status_code,
        "json": json.loads(response_body.decode("utf-8")),
    }


def main():
    print("==================================================")
    print("           FASTAPI ENDPOINT INTEGRATION TESTS      ")
    print("==================================================\n")

    # 1. Test Health
    print("Testing GET /api/v1/health ...")
    health = asyncio.run(simulate_get("/api/v1/health"))
    print(f"Status: {health['status_code']}, Body: {health['json']}")
    assert health["status_code"] == 200
    assert health["json"]["status"] == "healthy"
    print("Health check PASSED\n")

    # 2. Test Presets
    print("Testing GET /api/v1/studio/presets ...")
    presets = asyncio.run(simulate_get("/api/v1/studio/presets"))
    print(f"Status: {presets['status_code']}")
    assert presets["status_code"] == 200
    assert "categories" in presets["json"]
    print(f"Categories: {list(presets['json']['categories'].keys())}")
    print("Presets check PASSED\n")

    print("==================================================")
    print("            ALL API TESTS PASSED!                 ")
    print("==================================================")


if __name__ == "__main__":
    main()
