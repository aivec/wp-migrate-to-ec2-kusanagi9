#!/usr/bin/env node
import { getCredentialsConfig } from './config.mjs';
import { finalize } from './finalize.mjs';

const config = getCredentialsConfig();
finalize(config);
