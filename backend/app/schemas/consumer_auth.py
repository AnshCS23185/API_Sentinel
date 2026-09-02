from dataclasses import dataclass
from app.models.api_consumer import ApiConsumer
from app.models.api_key import ApiKey


@dataclass
class ConsumerAuthContext:
    """
    Context object constructed upon successful API key authentication.
    Passed downstream to Gateway routing, logging, and policy execution.
    """
    consumer: ApiConsumer
    api_key: ApiKey
    consumer_id: int
    api_key_id: int
