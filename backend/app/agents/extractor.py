"""
Extractor Agent - 課題抽出エージェント
会話ログから課題・不満・改善要望を抽出する
"""

import json
from typing import List
import google.generativeai as genai

from app.models.issue import IssueExtracted, PainLevel


EXTRACTION_PROMPT = """
あなたは業務改善の専門家です。以下の会話ログを分析し、業務上の課題・不満・改善要望を抽出してください。

## 抽出ルール
1. 明確な課題や不満を抽出する
2. 単なる雑談は無視する
3. 技術的な解決アプローチを提案する
4. 重要度（high/medium/low）を判断する

## 出力形式
JSON配列で出力してください。各オブジェクトには以下のキーを含めてください：
- title: 課題の簡潔なタイトル
- category: 業務効率化、ミス防止、コスト削減、コミュニケーション、その他のいずれか
- pain_level: high、medium、lowのいずれか
- context: 元の会話の要約
- tech_approach: 技術的な解決アプローチ
- expected_outcome: 期待される成果

## 会話ログ
__CONTENT__
"""


class ExtractorAgent:
    def __init__(self, api_key: str = None):
        if api_key:
            genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-2.0-flash")

    async def extract(self, content: str) -> List[IssueExtracted]:
        """会話ログから課題を抽出"""
        try:
            prompt = EXTRACTION_PROMPT.replace("__CONTENT__", content)
            response = self._generate(prompt)

            print(f"Gemini response: {response[:500]}...")  # デバッグ用

            # JSON部分を抽出
            json_str = self._extract_json(response)
            print(f"Extracted JSON: {json_str[:500]}...")  # デバッグ用

            items = json.loads(json_str)

            return [
                IssueExtracted(
                    title=item["title"],
                    category=item["category"],
                    pain_level=PainLevel(item["pain_level"]),
                    context=item["context"],
                    tech_approach=item["tech_approach"],
                    expected_outcome=item["expected_outcome"],
                )
                for item in items
            ]
        except Exception as e:
            print(f"Extraction error: {e}")
            import traceback
            traceback.print_exc()
            return []

    def _generate(self, prompt: str) -> str:
        """LLMでテキスト生成"""
        response = self.model.generate_content(prompt)
        return response.text

    def _extract_json(self, text: str) -> str:
        """テキストからJSON部分を抽出"""
        # ```json ... ``` を探す
        if "```json" in text:
            start = text.find("```json") + 7
            end = text.find("```", start)
            return text[start:end].strip()
        # [ ... ] を探す
        if "[" in text:
            start = text.find("[")
            end = text.rfind("]") + 1
            return text[start:end]
        return "[]"
