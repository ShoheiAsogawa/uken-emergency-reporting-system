@echo off
echo Pythonスクリプトを実行中...
python transaction_analyzer.py
if %errorlevel% neq 0 (
    echo Pythonが見つかりません。python3を試します...
    python3 transaction_analyzer.py
    if %errorlevel% neq 0 (
        echo Pythonが見つかりませんでした。
        echo 以下のいずれかの方法で実行してください:
        echo 1. Pythonをインストールする
        echo 2. オンラインのPython実行環境を使用する
        echo 3. 別の環境でスクリプトを実行する
        pause
    )
)
pause

