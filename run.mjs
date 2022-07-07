#!/usr/bin/env node
import { getConfig } from './config.mjs';
import { ec2Init } from './ec2-init.mjs';
import { provision } from './provision.mjs';
import { wpInstall } from './wp-install.mjs';

const config = getConfig();
ec2Init(config, () => {
  provision(config);
  wpInstall(config);
});
