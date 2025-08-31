# zipcode-jp-api

このプロジェクトは、日本郵政の郵便番号データを処理し、Webアプリケーションで利用可能な住所検索APIを構築します。

## 主な機能
- データの正規化: 日本郵政の最新データを自動でダウンロード・処理し、クリーンなJSON/JSONP形式に変換します。
- Web API: 郵便番号から住所を検索する軽量なAPIとして機能します。

## APIの公開と利用
郵便番号APIは以下のURLからアクセスできます。
`https://github.com/ishikawa0727/zipcode-jp-api/blob/main/data/min-json/[郵便番号の先頭3桁].json`

[使用例](https://ishikawa0727.github.io/zipcode-jp-api/)


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

また、出力形式はCSV、JSON、JSONPをサポートしています。

## プロジェクト構造

```
zipcode-jp-api/
├── data/                    # 処理済みデータファイル
│   ├── full-csv/           # 完全版CSVファイル（全フィールド）
│   ├── full-json/          # 完全版JSONファイル（全フィールド）
│   ├── full-jsonp/         # 完全版JSONPファイル（全フィールド）
│   ├── min-csv/            # 最小版CSVファイル（主要フィールドのみ）
│   ├── min-json/           # 最小版JSONファイル（主要フィールドのみ）
│   └── min-jsonp/          # 最小版JSONPファイル（主要フィールドのみ）
├── index.html              # Webアプリケーション（デモ用）
├── script/                 # データ処理スクリプト
│   ├── src/                # ソースコード
│   │   ├── const.ts        # CSVフィールド定義と定数
│   │   ├── normalizeTownNames.ts  # 町名の正規化処理
│   │   ├── save.ts         # データの保存処理
│   │   ├── segmentalizeByZipCodeUpperDigits.ts  # 郵便番号によるセグメント化
│   │   └── utilities.ts    # HTTP通信・エンコーディング変換等のユーティリティ
│   ├── index.ts            # メイン処理スクリプト
│   └── package.json        # 依存関係とスクリプト定義
└── README.md               # このファイル
```

## セットアップ

### 前提条件
- Node.js (v18以上)
- npm

### インストール

1. リポジトリをクローン
```bash
git clone https://github.com/ishikawa0727/zipcode-jp-api.git
cd zipcode-ip-api
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

## データ形式

### CSV形式
日本郵政の公式データ形式に準拠し、以下のフィールドを含みます：
- 全国地方公共団体コード
- 郵便番号（7桁）
- 都道府県名（カタカナ・漢字）
- 市区町村名（カタカナ・漢字）
- 町域名（カタカナ・漢字）
- その他の管理情報

### JSON形式
CSVデータをJSON形式に変換し、Webアプリケーションでの利用に最適化されています。

### JSONP形式
クロスドメインでの利用を可能にするJSONP形式でデータを提供します。
