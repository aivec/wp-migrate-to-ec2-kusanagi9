#!/usr/bin/env node
import { getConfig } from './config.mjs';
import { wpInstall } from './wp-install.mjs';

const config = getConfig();
wpInstall(config);
