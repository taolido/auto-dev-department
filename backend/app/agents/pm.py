"""
PM Agent - 要件定義エージェント
課題から仮説要件定義書を生成する
"""

from typing import Dict, Any
import google.generativeai as genai


REQUIREMENT_PROMPT = """
あなたはプロダクトマネージャーです。以下の課題から、仮説要件定義書を作成してください。

## 課題情報
- タイトル: __TITLE__
- 説明: __DESCRIPTION__
- 背景コンテキスト: __CONTEXT__
- 技術アプローチ案: __TECH_APPROACH__

## 出力形式
以下のMarkdown形式で出力してください：

# 要件定義書: [タイトル]

## 背景・課題
[現状と課題を2-3文で説明]

## 機能要件
1. [機能1]
2. [機能2]
3. [機能3]

## 非機能要件
- 処理時間: [目標]
- 対応環境: [対象]
- セキュリティ: [要件]

## 技術アプローチ
[推奨する技術スタックと実装方針]

## 成功指標
[定量的なKPI]
"""


class PMAgent:
    def __init__(self, api_key: str = None):
        if api_key:
            genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-2.0-flash")

    async def generate(
        self,
        title: str,
        description: str,
        context: str,
        tech_approach: str = "",
    ) -> Dict[str, Any]:
        """課題から要件定義書を生成"""
        try:
            prompt = REQUIREMENT_PROMPT.replace("__TITLE__", title)
            prompt = prompt.replace("__DESCRIPTION__", description)
            prompt = prompt.replace("__CONTEXT__", context)
            prompt = prompt.replace("__TECH_APPROACH__", tech_approach)

            response = self._generate(prompt)
            markdown_content = self._extract_markdown(response)

            return {
                "title": f"要件定義書: {title}",
                "background": context,
                "problem_statement": description,
                "functional_requirements": [],
                "non_functional_requirements": [],
                "tech_approach": tech_approach,
                "markdown_content": markdown_content,
            }
        except Exception as e:
            print(f"PM Agent error: {e}")
            import traceback
            traceback.print_exc()
            return {
                "title": title,
                "background": context,
                "problem_statement": description,
                "functional_requirements": [],
                "non_functional_requirements": [],
                "tech_approach": tech_approach,
                "markdown_content": f"# {title}\n\nエラーが発生しました: {e}",
            }

    def _generate(self, prompt: str) -> str:
        """LLMでテキスト生成"""
        response = self.model.generate_content(prompt)
        return response.text

    def _extract_markdown(self, text: str) -> str:
        """テキストからMarkdown部分を抽出"""
        if "```markdown" in text:
            start = text.find("```markdown") + 11
            end = text.find("```", start)
            return text[start:end].strip()
        return text.strip()
