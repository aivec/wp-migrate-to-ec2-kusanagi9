#!/usr/bin/env node
import { getConfig } from './config.mjs';
import { ec2Init } from './ec2-init.mjs';

const config = getConfig();
ec2Init(config);
