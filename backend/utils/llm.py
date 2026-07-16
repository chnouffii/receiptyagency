"""Drop-in replacement for emergentintegrations.llm.chat, backed by litellm.

emergentintegrations was removed from requirements.txt for security reasons
(the PyPI package was flagged as malicious). This module keeps the exact
same call shape (LlmChat(...).with_model(...).send_message(...)) so route
files don't need to change anything except their import line.

Uses ANTHROPIC_API_KEY from the environment.
"""
import os
import litellm

DEFAULT_MODEL = "claude-sonnet-4-5-20250929"
DEFAULT_TIMEOUT = 30.0


class UserMessage:
    def __init__(self, text: str):
        self.text = text


class LlmChat:
    def __init__(self, api_key: str = None, session_id: str = None, system_message: str = ""):
        self.session_id = session_id
        self.system_message = system_message
        self.model = DEFAULT_MODEL

    def with_model(self, provider: str, model: str):
        self.model = model
        return self

    async def send_message(self, user_message: "UserMessage", timeout: float = DEFAULT_TIMEOUT) -> str:
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        response = await litellm.acompletion(
            model=f"anthropic/{self.model}",
            api_key=api_key,
            messages=[
                {"role": "system", "content": self.system_message},
                {"role": "user", "content": user_message.text},
            ],
            timeout=timeout,
        )
        return response.choices[0].message.content
