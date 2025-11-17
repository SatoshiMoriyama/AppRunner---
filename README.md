# App Runner サンプルプロジェクト

AWS App Runner で Hono アプリケーションをデプロイするサンプルプロジェクトです。

## プロジェクト構成

このプロジェクトはモノレポ構成で、以下のパッケージを含みます：

- **packages/hono-apprunner**: Hono を使った Web アプリケーション
- **packages/cdk**: AWS CDK によるインフラ定義

## デプロイされるリソース

- **App Runner Service**: GitHub リポジトリから自動デプロイされる Hono アプリケーション
- **Aurora Serverless v2**: MySQL 互換のデータベース（0-1 ACU でスケール）
- **VPC**: 2AZ 構成、NAT Gateway 付き
- **VPC Connector**: App Runner から VPC リソースへの接続

## 前提条件

1. AWS アカウント
2. GitHub リポジトリ
3. App Runner と GitHub の接続（初回のみマネジメントコンソールから設定が必要）

## セットアップ

1. 環境変数の設定

```bash
cp packages/cdk/.env.sample packages/cdk/.env
```

`packages/cdk/.env` ファイルを編集して以下の値を設定：

- `REPOSITORY_URL`: GitHub リポジトリの URL
- `GITHUB_CONNECTION_ARN`: App Runner の GitHub 接続 ARN

2. 依存関係のインストール

```bash
pnpm install
```

## デプロイ

```bash
cd packages/cdk
pnpm cdk deploy
```

## その他のコマンド

- `pnpm run build` - TypeScript をコンパイル
- `pnpm run watch` - ファイル変更を監視してコンパイル
- `pnpm cdk diff` - デプロイ済みスタックとの差分を表示
- `pnpm cdk synth` - CloudFormation テンプレートを生成
- `pnpm cdk destroy` - スタックを削除

※ CDK コマンドは `packages/cdk` ディレクトリで実行してください

## Hono アプリケーション

### エンドポイント

- `GET /`: ヘルスチェック用エンドポイント
- `GET /health`: ヘルスチェック用エンドポイント
- `GET /db-test`: Aurora データベース接続テスト
- `GET /external-test`: 外部通信テスト（NAT Gateway 経由）

### ローカル開発

```bash
cd packages/hono-apprunner
pnpm install
pnpm dev
```

ローカルでは `http://localhost:3000` でアクセス可能です。

## 出力される情報

デプロイ後、以下の情報が出力されます：

- `ServiceUrl`: App Runner サービスの URL
- `ServiceArn`: App Runner サービスの ARN
- `AuroraClusterEndpoint`: Aurora クラスターのエンドポイント
- `AuroraSecretArn`: データベース認証情報の Secrets Manager ARN
