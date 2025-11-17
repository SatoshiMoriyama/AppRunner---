#!/usr/bin/env node
import "dotenv/config";
import * as cdk from "aws-cdk-lib/core";
import { AppRunnerPoC } from "../lib/app-runner";

const app = new cdk.App();
new AppRunnerPoC(app, "AppRunnerPoC", {
  repositoryUrl: process.env.REPOSITORY_URL!,
  githubConnectionArn: process.env.GITHUB_CONNECTION_ARN!,
});
