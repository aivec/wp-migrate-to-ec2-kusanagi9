#!/usr/bin/env node
import { getCredentialsConfig } from './config.mjs';
import { nginxConfigure } from './nginx-configure.mjs';

const config = getCredentialsConfig();
nginxConfigure(config);
