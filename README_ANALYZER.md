# 取引履歴集計スクリプト

## 概要

このスクリプトは、取引履歴データを解析して、カテゴリ（入金、返金、資金移動）とステータス（完了、拒否されました、処理中）ごとに集計します。

## ファイル構成

- `transaction_analyzer.py` - メインの解析スクリプト
- `run_analyzer.bat` - Windows用の実行バッチファイル
- `transaction_summary_result.txt` - 実行結果が保存されるファイル

## 実行方法

### 方法1: バッチファイルを使用（Windows）

1. `run_analyzer.bat`をダブルクリックして実行

### 方法2: コマンドラインから実行

```bash
python transaction_analyzer.py
```

または

```bash
python3 transaction_analyzer.py
```

## 出力

実行が成功すると、以下のファイルが生成されます：

- `transaction_summary_result.txt` - 集計結果が保存されたテキストファイル

## 集計内容

スクリプトは以下のように集計します：

1. **入金** - 完了/拒否/処理中ごとにJPYとUSDを集計
2. **返金** - 完了/拒否/処理中ごとにJPYとUSDを集計
3. **資金移動** - 完了/拒否/処理中ごとにJPYとUSDを集計
4. **出金** - 完了/拒否/処理中ごとにJPYとUSDを集計

## 注意事項

- Python 3.xが必要です
- データはスクリプト内に含まれています
- 結果は`transaction_summary_result.txt`に保存されます

## トラブルシューティング

### Pythonが見つからない場合

1. Pythonがインストールされているか確認
2. 環境変数PATHにPythonが追加されているか確認
3. オンラインのPython実行環境（例: Repl.it, Google Colab）を使用

### 実行エラーが発生した場合

- スクリプトのエラーメッセージを確認
- データの形式が正しいか確認

