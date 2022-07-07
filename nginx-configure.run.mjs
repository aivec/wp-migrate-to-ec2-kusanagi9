#!/usr/bin/env node
import { getConfig } from './config.mjs';
import { nginxConfigure } from './nginx-configure.mjs';

const config = getConfig();
nginxConfigure(config);
