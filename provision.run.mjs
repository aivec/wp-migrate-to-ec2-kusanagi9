#!/usr/bin/env node
import { getConfig } from './config.mjs';
import { provision } from './provision.mjs';

const config = getConfig();
provision(config);
