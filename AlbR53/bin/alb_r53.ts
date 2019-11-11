#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { AlbR53Stack } from '../lib/alb_r53-stack';

const app = new cdk.App();
// new AlbR53Stack(app, 'AlbR53Stack');
new AlbR53Stack(app, 'AlbR53Stack', {env: {
    // account: process.env.CDK_DEFAULT_ACCOUNT,
    // region: process.env.CDK_DEFAULT_REGION
    account: 'xxxxxxxxxx',
    region: 'eu-central-1'
}});
