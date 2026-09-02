import hashlib
from app.utils.security import generate_api_key


def test_generate_api_key_format_and_entropy():
    raw_key, key_prefix, key_hash = generate_api_key()

    # Prefix verification
    assert raw_key.startswith("sen_live_")
    assert key_prefix == raw_key[:16]
    assert len(key_prefix) == 16
    assert key_prefix.startswith("sen_live_")

    # Hash verification
    expected_hash = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()
    assert key_hash == expected_hash
    assert len(key_hash) == 64


def test_generate_api_key_uniqueness():
    keys = [generate_api_key() for _ in range(10)]
    raw_keys = {k[0] for k in keys}
    prefixes = {k[1] for k in keys}
    hashes = {k[2] for k in keys}

    assert len(raw_keys) == 10
    assert len(prefixes) == 10
    assert len(hashes) == 10
