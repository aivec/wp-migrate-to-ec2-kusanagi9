#!/usr/bin/env node
import { getConfig, getCredentialsConfig } from './config.mjs';
import { ec2Init } from './ec2-init.mjs';
import { provision } from './provision.mjs';
import { wpInstall } from './wp-install.mjs';
import { nginxConfigure } from './nginx-configure.mjs';

const config = getConfig();
ec2Init(config, () => {
  provision(getCredentialsConfig());
  wpInstall(getCredentialsConfig());
  nginxConfigure(getCredentialsConfig());
});
