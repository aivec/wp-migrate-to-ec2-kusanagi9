#!/usr/bin/env node
import { getCredentialsConfig } from './config.mjs';
import { wpInstall } from './wp-install.mjs';

const config = getCredentialsConfig();
wpInstall(config);
