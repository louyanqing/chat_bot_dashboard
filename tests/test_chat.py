from __future__ import annotations

from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


def test_root_returns_greeting():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "loaded_rows" in data


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_chat_empty_message_rejected():
    response = client.post("/chat", json={"message": ""})
    assert response.status_code == 400


def test_chat_returns_answer():
    response = client.post("/chat", json={"message": "What is a tenbagger?"})
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert isinstance(data["matches"], list)


def test_reload():
    response = client.post("/reload")
    assert response.status_code == 200
    assert "loaded_rows" in response.json()
