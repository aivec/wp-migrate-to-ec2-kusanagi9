#!/usr/bin/env node
import { getCredentialsConfig } from './config.mjs';
import { provision } from './provision.mjs';

const config = getCredentialsConfig();
provision(config);
