import os
import sys

# Ensure backend dir is importable as package root for tests
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.sync_worker import parse_time_elapsed


def test_none():
    assert parse_time_elapsed(None) == 0


def test_numeric_minutes():
    assert parse_time_elapsed(90) == 90
    assert parse_time_elapsed(90.4) == 90
    assert parse_time_elapsed(90.5) == 91


def test_numeric_string():
    assert parse_time_elapsed("90.5") == 91


def test_mmss():
    # "MM:SS" -> minutes + seconds/60 rounded half-up
    assert parse_time_elapsed("2:30") == 3


def test_hhmmss():
    # "HH:MM:SS"
    assert parse_time_elapsed("1:02:03") == 62


def test_zero():
    assert parse_time_elapsed("0") == 0
