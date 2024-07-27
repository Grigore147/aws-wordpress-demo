import 'source-map-support/register';
import 'dotenv/config';

import * as Cdk from 'aws-cdk-lib';

import config from '../stacks/wordpress/config';

import { WordPressStack } from '../stacks';

const app = new Cdk.App();

new WordPressStack(app, 'WordPressStack', {
    stackName: config.stackName,
    description: config.stackDescription,
    env: config.stackEnv,
    tags: config.stackBaseTags
}, config);
