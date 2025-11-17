import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";
import * as apprunner from "aws-cdk-lib/aws-apprunner";
import * as apprunnerAlpha from "@aws-cdk/aws-apprunner-alpha";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";

export interface AppRunnerPoCProps extends cdk.StackProps {
  readonly repositoryUrl: string;
  readonly githubConnectionArn: string;
}

export class AppRunnerPoC extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AppRunnerPoCProps) {
    super(scope, id, props);

    // VPC
    const vpc = new ec2.Vpc(this, "AppRunnerVpc", {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "Public",
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: "Private",
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // VPCコネクタ
    const vpcConnectorSg = new ec2.SecurityGroup(this, "VpcConnectorSg", {
      vpc,
      description: "Security group for App Runner VPC Connector",
      allowAllOutbound: true,
    });

    const vpcConnector = new apprunnerAlpha.VpcConnector(this, "VpcConnector", {
      vpc,
      vpcSubnets: vpc.selectSubnets({
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      }),
      securityGroups: [vpcConnectorSg],
    });

    // Aurora Serverless
    const dbSecurityGroup = new ec2.SecurityGroup(this, "AuroraSecurityGroup", {
      vpc,
      description: "Security group for Aurora Serverless v2",
      allowAllOutbound: true,
    });

    // App Runnerからの接続を許可
    dbSecurityGroup.addIngressRule(
      vpcConnectorSg,
      ec2.Port.tcp(3306),
      "Allow MySQL access from App Runner"
    );

    const dbCluster = new rds.DatabaseCluster(this, "AuroraCluster", {
      engine: rds.DatabaseClusterEngine.auroraMysql({
        version: rds.AuroraMysqlEngineVersion.VER_3_08_0,
      }),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [dbSecurityGroup],
      serverlessV2MinCapacity: 0,
      serverlessV2MaxCapacity: 1,
      enableDataApi: true,
      writer: rds.ClusterInstance.serverlessV2("writer"),
      credentials: rds.Credentials.fromGeneratedSecret("admin"),
    });

    // App Runner
    const autoScalingConfig = new apprunnerAlpha.AutoScalingConfiguration(
      this,
      "AutoScalingConfig",
      {
        maxConcurrency: 5,
        maxSize: 2,
        minSize: 1,
      }
    );
    const service = new apprunnerAlpha.Service(this, "HonoAppRunnerService", {
      source: apprunnerAlpha.Source.fromGitHub({
        repositoryUrl: props.repositoryUrl,
        branch: "main",
        configurationSource: apprunnerAlpha.ConfigurationSourceType.API,
        codeConfigurationValues: {
          runtime: apprunnerAlpha.Runtime.NODEJS_22,
          buildCommand: "npm install && npm run build",
          startCommand: "npm start",
          port: "8080",
          environment: {
            PORT: "8080",
            DB_HOST: dbCluster.clusterEndpoint.hostname,
            DB_NAME: "mysql",
          },
          environmentSecrets: dbCluster.secret
            ? {
                DB_USER: apprunnerAlpha.Secret.fromSecretsManager(
                  dbCluster.secret,
                  "username"
                ),
                DB_PASSWORD: apprunnerAlpha.Secret.fromSecretsManager(
                  dbCluster.secret,
                  "password"
                ),
              }
            : undefined,
        },
        connection: apprunnerAlpha.GitHubConnection.fromConnectionArn(
          props.githubConnectionArn
        ),
      }),
      vpcConnector,
      autoScalingConfiguration: autoScalingConfig,
      healthCheck: apprunnerAlpha.HealthCheck.http({
        path: "/health",
      }),
    });

    // モノレポ対応と自動デプロイ設定
    const cfnService = service.node.defaultChild as apprunner.CfnService;
    cfnService.addPropertyOverride(
      "SourceConfiguration.CodeRepository.SourceDirectory",
      "packages/hono-apprunner"
    );
    cfnService.addPropertyOverride(
      "SourceConfiguration.AutoDeploymentsEnabled",
      true
    );

    // 出力
    new cdk.CfnOutput(this, "ServiceUrl", {
      value: service.serviceUrl,
      description: "App Runner Service URL",
    });

    new cdk.CfnOutput(this, "ServiceArn", {
      value: service.serviceArn,
      description: "App Runner Service ARN",
    });

    new cdk.CfnOutput(this, "AuroraClusterEndpoint", {
      value: dbCluster.clusterEndpoint.hostname,
      description: "Aurora Cluster Endpoint",
    });

    new cdk.CfnOutput(this, "AuroraSecretArn", {
      value: dbCluster.secret?.secretArn || "N/A",
      description: "Aurora Credentials Secret ARN",
    });
  }
}
