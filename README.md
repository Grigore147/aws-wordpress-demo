# AWS WordPress High Availability Demo Architecture

* [Overview](#overview)
* [Architecture](#architecture)
* [Prerequisites](#prerequisites)
  * [AWS account](#aws-account)
  * [AWS CLI](#aws-cli)
  * [AWS CDK](#aws-cdk)
  * [Node.js](#nodejs)
* [Instructions](#instructions)
  * [Setting up AWS local profile and credentials](#setting-up-aws-local-profile-and-credentials)
  * [Clone this repository to your local machine](#clone-this-repository-to-your-local-machine)
  * [Bootstrap the CDK environment on AWS account](#bootstrap-the-cdk-environment-on-aws-account)
  * [Synthesizing the CloudFormation template](#synthesizing-the-cloudformation-template)
  * [Deploying the application](#deploying-the-application)
  * [Cleaning up](#cleaning-up)
* [Improvements (TODO)](#improvements)

## Overview
Demo CDK app that deploys a HA WordPress architecture on AWS

## Architecture
![architecture](./architecture/architecture.png)

## Prerequisites

### AWS account
You will need an AWS account to deploy this architecture. If you don't have one, you can create one [here](https://aws.amazon.com/).

### AWS CLI
You will need the AWS CLI installed on your machine. You can find instructions on how to install it [here](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html).

### AWS CDK
You will need the AWS CDK installed on your machine. You can find instructions on how to install it [here](https://docs.aws.amazon.com/cdk/latest/guide/work-with-cdk-python.html).

### Node.js
You will need Node.js installed on your machine. You can find instructions on how to install it [here](https://nodejs.org/en/download/) or using NVM [here](https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating)


## Instructions

### Setting up AWS local profile and credentials
Create a new profile in your AWS CLI configuration file:
```bash
aws sso login --profile WordPressSandbox
# or
aws configure sso --profile WordPressSandbox

# Get the AWS account ID and the region
aws sts get-caller-identity --profile WordPressSandbox

# Set local environment variables
export AWS_PROFILE=WordPressSandbox
export AWS_ACCOUNT_ID=<AWS_ACCOUNT_ID>
export AWS_REGION=<AWS_REGION>

export CDK_DEFAULT_ACCOUNT=$AWS_ACCOUNT_ID
export CDK_DEFAULT_REGION=$AWS_REGION
```

### Clone this repository to your local machine

Clone this repository on local machine:
```bash
git clone https://github.com/Grigore147/aws-wordpress-demo.git
``` 
Install the required dependencies:
```bash
cd aws-wordpress-demo/infrastructure/aws/cdk
npm ci
```

### Bootstrap the CDK environment on AWS account
```bash
cdk bootstrap --profile WordPressSandbox
```

### Synthesizing the CloudFormation template
```bash
cdk synth
```

### Deploying the application
```bash
cdk deploy
```

### Cleaning up
```bash
cdk destroy
```


## Improvements
This demo doesn't cover all the best practices for deploying a WordPress architecture on AWS.

Here are some improvements that could be made:
* DNS hosted zone
* Static content serving from S3 and CloudFront
* Caching with ElastiCache
* Enhanced monitoring and logging
* Enhanced security with WAF, Shield and other security services
* CI/CD pipeline
* Automated backups and DR setup
