# App Runner CDK Stack

AWS App Runner のサンプルアプリケーションをデプロイするための CDK プロジェクトです。

## 構成

このスタックは以下のリソースをデプロイします：

- **App Runner Service**: GitHub リポジトリから自動デプロイされる Web アプリケーション
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
cp .env.sample .env
```

`.env` ファイルを編集して以下の値を設定：

- `REPOSITORY_URL`: GitHub リポジトリの URL
- `GITHUB_CONNECTION_ARN`: App Runner の GitHub 接続 ARN

2. 依存関係のインストール

```bash
pnpm install
```

## デプロイ

```bash
pnpm cdk deploy
```

## その他のコマンド

- `pnpm run build` - TypeScript をコンパイル
- `pnpm run watch` - ファイル変更を監視してコンパイル
- `pnpm cdk diff` - デプロイ済みスタックとの差分を表示
- `pnpm cdk synth` - CloudFormation テンプレートを生成
- `pnpm cdk destroy` - スタックを削除

## 出力される情報

デプロイ後、以下の情報が出力されます：

- `ServiceUrl`: App Runner サービスの URL
- `ServiceArn`: App Runner サービスの ARN
- `AuroraClusterEndpoint`: Aurora クラスターのエンドポイント
- `AuroraSecretArn`: データベース認証情報の Secrets Manager ARN
