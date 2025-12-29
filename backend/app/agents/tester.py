"""
Tester Agent - テスト・修正エージェント
生成されたコードをテストし、エラーを修正する
"""

import subprocess
import tempfile
import os
from typing import Dict, Any, Tuple, List
import google.generativeai as genai

from app.models.development import GeneratedFile


FIX_PROMPT = """
あなたはシニアソフトウェアエンジニアです。以下のコードにエラーがあります。修正してください。

## 元のコード
```{language}
{code}
```

## エラー内容
```
{error}
```

## 指示
- エラーを修正したコードのみを出力してください
- 説明は不要です

## 出力形式
```{language}
[修正後のコード]
```
"""


class TesterAgent:
    MAX_RETRIES = 3

    def __init__(self, api_key: str = None):
        if api_key:
            genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-2.0-flash")

    async def test_and_fix(
        self,
        file: GeneratedFile,
    ) -> Tuple[GeneratedFile, bool, str]:
        """
        コードをテストし、必要に応じて修正する

        Returns:
            Tuple[GeneratedFile, bool, str]: (修正後のファイル, 成功フラグ, メッセージ)
        """
        current_file = file
        retry_count = 0

        while retry_count < self.MAX_RETRIES:
            success, error = self._run_syntax_check(current_file)

            if success:
                return current_file, True, "テスト成功"

            # エラーがあれば修正を試みる
            retry_count += 1
            print(f"修正試行 {retry_count}/{self.MAX_RETRIES}: {error}")

            fixed_file = await self._fix_code(current_file, error)
            current_file = fixed_file

        return current_file, False, f"最大リトライ回数({self.MAX_RETRIES})に達しました"

    def _run_syntax_check(self, file: GeneratedFile) -> Tuple[bool, str]:
        """構文チェックを実行"""
        try:
            with tempfile.NamedTemporaryFile(
                mode="w",
                suffix=self._get_extension(file.language),
                delete=False,
            ) as f:
                f.write(file.content)
                temp_path = f.name

            try:
                if file.language == "python":
                    result = subprocess.run(
                        ["python", "-m", "py_compile", temp_path],
                        capture_output=True,
                        text=True,
                        timeout=30,
                    )
                elif file.language in ["javascript", "typescript"]:
                    # Node.jsで構文チェック
                    result = subprocess.run(
                        ["node", "--check", temp_path],
                        capture_output=True,
                        text=True,
                        timeout=30,
                    )
                else:
                    # その他の言語は成功とみなす
                    return True, ""

                if result.returncode == 0:
                    return True, ""
                return False, result.stderr or result.stdout
            finally:
                os.unlink(temp_path)

        except Exception as e:
            return False, str(e)

    async def _fix_code(
        self,
        file: GeneratedFile,
        error: str,
    ) -> GeneratedFile:
        """エラーを修正"""
        try:
            prompt = FIX_PROMPT.format(
                language=file.language,
                code=file.content,
                error=error,
            )
            response = await self._generate(prompt)
            fixed_code = self._extract_code(response, file.language)

            return GeneratedFile(
                path=file.path,
                content=fixed_code,
                language=file.language,
            )
        except Exception as e:
            print(f"Fix error: {e}")
            return file

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
            newline = text.find("\n", start)
            if newline != -1:
                start = newline + 1
            end = text.find("```", start)
            return text[start:end].strip()
        return text.strip()

    def _get_extension(self, language: str) -> str:
        """言語から拡張子を取得"""
        extensions = {
            "python": ".py",
            "javascript": ".js",
            "typescript": ".ts",
            "html": ".html",
            "css": ".css",
        }
        return extensions.get(language, ".txt")
