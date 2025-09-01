# zipcode-jp-api

このプロジェクトは、日本郵政の郵便番号データを処理し、Webアプリケーションで利用可能な住所検索APIを構築します。

## 主な機能
- データの正規化: 日本郵政の最新データを自動でダウンロード・処理し、クリーンなJSON/JSONP形式に変換します。
- Web API: 郵便番号から住所を検索する軽量なAPIとして機能します。

## APIの公開と利用
郵便番号APIは以下の形式のURLからアクセスできます。

`https://github.com/ishikawa0727/zipcode-jp-api/blob/main/data/[データ形式]/[郵便番号の先頭3桁].json`

データ形式は以下の6パターンが用意されています。

| データ形式 | 概要                                                            | 
| ---------- | --------------------------------------------------------------- | 
| full-csv   | 旧郵便番号や仮名表記を等を含むCSVデータ                         | 
| full-json  | 旧郵便番号や仮名表記を等を含むオブジェクト形式のJSONデータ      | 
| full-jsonp | 旧郵便番号や仮名表記を等を含むオブジェクト形式のJSONPデータ     | 
| min-csv   | 郵便番号、都道府県、市区町村、町域名のみのCSVデータ             | 
| min-json  | 郵便番号、都道府県、市区町村、町域名のみの配列形式のJSONデータ  | 
| min-jsonp | 郵便番号、都道府県、市区町村、町域名のみの配列形式のJSONPデータ | 

以下は、Webアプリケーションでの使用例です。

[https://ishikawa0727.github.io/zipcode-jp-api/](https://ishikawa0727.github.io/zipcode-jp-api/)

サンプルコード
```html
<script>
  // 例: 郵便番号100-0001のデータを取得
  fetch('https://ishikawa0727.github.io/zipcode-jp-api/data/min-json/100.json')
    .then(response => response.json())
    .then(data => {
      // 郵便番号1000001のレコードを検索
      const record = data.find(item => item.zip_code === '1000001');
      if (record) {
        console.log(`住所: ${record.prefecture}${record.city}${record.town}`);
        // 出力例: 住所: 東京都千代田区千代田
      }
    });
</script>
```

## プロジェクト構造

```
zipcode-jp-api/
│
├── index.html # Webアプリケーション（デモ用）
│
├── data # 処理済みデータファイル
│   ├── full-csv/ # 完全版CSVファイル（全フィールド）
│   ├── full-json/ # 完全版JSONファイル（全フィールド）
│   ├── full-jsonp/ # 完全版JSONPファイル（全フィールド）
│   ├── min-csv/ # 最小版CSVファイル（主要フィールドのみ）
│   ├── min-json/ # 最小版JSONファイル（主要フィールドのみ）
│   └── min-jsonp/ # 最小版JSONPファイル（主要フィールドのみ）
│
├── script/ # データ処理スクリプト
│   ├── bin/ # 実行ファイル
│   │   └── cli.ts # メイン処理スクリプト
│   ├── src/ # ソースコード
│   │   ├── const.ts # 定数ファイル
│   │   ├── error.ts # エラー定義
│   │   ├── indexByZipCodePrefix.ts # 郵便番号上3桁にによるインデックス化
│   │   ├── normalizeTownNames.ts # 町名の正規化処理
│   │   ├── output.ts # データの更新処理
│   │   └── utilities.ts # HTTP通信・エンコーディング変換等のユーティリティ
│   ├── package.json # 依存関係とスクリプト定義
│   ├── package-lock.json # 依存関係
│   └── tsconfig.json # TypeScriptの設定
│
├── .github/ # Github設定
│   └── workflows #GithubActions CI設定
│       ├── test.yml # push時のテスト
│       └── update-zipcode-data.yml 郵便番号データ定期更新処理
│
└── README.md # このファイル
```

## セットアップ

### 前提条件
- Node.js (v18以上)
- npm

### インストール

1. リポジトリをクローン
```bash
git clone https://github.com/ishikawa0727/zipcode-jp-api.git
cd zipcode-jp-api
```

2. 依存関係をインストール
```bash
cd script
npm install
```

## 使用方法

### データ処理の実行

郵便番号データのダウンロードと処理を実行するには：

```bash
cd script
npm run exec
```

このコマンドにより以下が実行されます：
1. 日本郵政から最新の郵便番号データをダウンロード
2. CSVデータの解析と正規化
3. 重複データの除去
4. 郵便番号上位3桁によるセグメント化
5. 複数形式でのデータ出力

### GitHub Actionsによる自動更新

このプロジェクトでは、GitHub Actionsを使用して郵便番号データの自動更新を行っています。

#### 設定済みのワークフロー

- **基本的な更新**: `.github/workflows/update-zipcode-data.yml`

#### 使用方法

1. **自動実行**: 設定は不要で、毎週月曜日の午前9時（JST）に実行されます
2. **手動実行**: 
   - GitHubのActionsタブを開く
   - 「Update Zipcode Data」ワークフローを選択
   - 「Run workflow」をクリック
   - 必要に応じて「Force update」オプションを有効化

#### 注意事項

- データファイルの変更は自動的にコミット・プッシュされます
- エラーが発生した場合は、自動的にIssueが作成されます
