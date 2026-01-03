"""
Coder Agent - 実装エージェント
設計書に基づいてコードを生成する
"""

from typing import Dict, Any, List
import json
import google.generativeai as genai

from app.models.development import GeneratedFile


CODE_PROMPT = """
あなたはシニアソフトウェアエンジニアです。以下の設計に基づいてコードを実装してください。

## 設計書
{design}

## 実装対象ファイル
{file_path}

## 指示
- プロダクションレベルのコードを書いてください
- エラーハンドリングを含めてください
- コメントは必要最低限にしてください
- 型アノテーションを使用してください（該当言語の場合）

## 出力形式
コードのみを出力してください（説明不要）：

```{language}
[コード]
```
"""


class CoderAgent:
    def __init__(self, api_key: str = None):
        if api_key:
            genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-3-flash-preview")

    async def generate_code(
        self,
        design: Dict[str, Any],
        file_path: str,
        language: str = "python",
    ) -> GeneratedFile:
        """設計からコードを生成"""
        try:
            prompt = CODE_PROMPT.format(
                design=json.dumps(design, ensure_ascii=False, indent=2),
                file_path=file_path,
                language=language,
            )
            response = await self._generate(prompt)
            code = self._extract_code(response, language)

            return GeneratedFile(
                path=file_path,
                content=code,
                language=language,
            )
        except Exception as e:
            print(f"Coder Agent error: {e}")
            return GeneratedFile(
                path=file_path,
                content=f"# Error: {e}",
                language=language,
            )

    async def generate_all(
        self,
        design: Dict[str, Any],
    ) -> List[GeneratedFile]:
        """設計からすべてのファイルを生成"""
        files = []
        file_structure = design.get("file_structure", [])
        tech_stack = design.get("tech_stack", {})
        language = tech_stack.get("language", "python")

        for file_info in file_structure:
            file = await self.generate_code(
                design=design,
                file_path=file_info["path"],
                language=language,
            )
            files.append(file)

        return files

    async def _generate(self, prompt: str) -> str:
        """LLMでテキスト生成"""
        response = self.model.generate_content(prompt)
        return response.text

    def _extract_code(self, text: str, language: str) -> str:
        """テキストからコード部分を抽出"""
        marker = f"```{language}"
        if marker in text:
            start = text.find(marker) + len(marker)
            end = text.find("```", start)
            return text[start:end].strip()
        if "```" in text:
            start = text.find("```") + 3
            # 言語名をスキップ
            newline = text.find("\n", start)
            if newline != -1:
                start = newline + 1
            end = text.find("```", start)
            return text[start:end].strip()
        return text.strip()
