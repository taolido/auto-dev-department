"""
Tech Lead Agent - 設計エージェント
要件定義書からファイル構成・実装方針を決定する
"""

from typing import Dict, Any, List
import json
import google.generativeai as genai


DESIGN_PROMPT = """
あなたはテックリードです。以下の要件定義書から、ファイル構成と実装方針を設計してください。

## 要件定義書
{requirement}

## 出力形式
JSON形式で出力してください：

```json
{{
  "project_name": "プロジェクト名",
  "tech_stack": {{
    "language": "使用言語",
    "framework": "フレームワーク",
    "dependencies": ["依存パッケージ"]
  }},
  "file_structure": [
    {{
      "path": "ファイルパス",
      "description": "ファイルの役割",
      "type": "entrypoint|component|utility|config|test"
    }}
  ],
  "implementation_order": ["実装順序"],
  "notes": "特記事項"
}}
```
"""


class TechLeadAgent:
    def __init__(self, api_key: str = None):
        if api_key:
            genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-3-flash-preview")

    async def design(self, requirement: str) -> Dict[str, Any]:
        """要件から設計書を生成"""
        try:
            prompt = DESIGN_PROMPT.format(requirement=requirement)
            response = await self._generate(prompt)
            json_str = self._extract_json(response)
            return json.loads(json_str)
        except Exception as e:
            print(f"Tech Lead Agent error: {e}")
            return {
                "project_name": "unknown",
                "tech_stack": {},
                "file_structure": [],
                "implementation_order": [],
                "notes": f"Error: {e}",
            }

    async def _generate(self, prompt: str) -> str:
        """LLMでテキスト生成"""
        response = self.model.generate_content(prompt)
        return response.text

    def _extract_json(self, text: str) -> str:
        """テキストからJSON部分を抽出"""
        if "```json" in text:
            start = text.find("```json") + 7
            end = text.find("```", start)
            return text[start:end].strip()
        if "{" in text:
            start = text.find("{")
            end = text.rfind("}") + 1
            return text[start:end]
        return "{}"
