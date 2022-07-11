import { existsSync, readFileSync, writeFileSync } from 'fs';

export const validateHost = (host) => {
  if (/^(http|https):\/\//.test(host)) {
    console.log('Scheme (http:// or https://) for host must be omitted.');
    process.exit(1);
  }
};

export const validateConfig = (config) => {
  if (
    !config ||
    config === true ||
    Array.isArray(config) ||
    config.length !== undefined ||
    typeof config === "number"
  ) {
    console.log("Configuration file is not valid.");
    process.exit(1);
  }

  if (!config.ec2) {
    console.log("'ec2' is required.");
    process.exit(1);
  }

  if (!config.ec2.host) {
    console.log("'ec2.host' is required.");
    process.exit(1);
  }

  validateHost(config.ec2.host);
};

export const getConfigPath = () => {
  const args = process.argv.slice(2);
  const rawconfigf = args[0] ? args[0] : null;
  return rawconfigf;
}

export const getConfig = () => {
  const args = process.argv.slice(2);
  const rawconfigf = args[0] ? args[0] : null;

  if (rawconfigf === null) {
    console.log('A path to a valid JSON file is required as the first argument.');
    process.exit(1);
  }

  if (!existsSync(rawconfigf)) {
    console.log(`${rawconfigf} doesnt exist`);
    process.exit(1);
  }

  const rawconfig = JSON.parse(readFileSync(rawconfigf, 'utf8'));
  validateConfig(rawconfig);

  return rawconfig;
}

export const getCredentialsConfigPath = () => {
  const confp = getConfigPath();
  const pathp = confp.split('.json');
  pathp.pop();
  return `${pathp.join('')}.credentials.json`;
}

export const getCredentialsConfig = () => {
  const cpath = getCredentialsConfigPath();
  if (!existsSync(cpath)) {
    console.log(`${cpath} doesnt exist`);
    process.exit(1);
  }

  const config = JSON.parse(readFileSync(cpath, 'utf8'));
  validateConfig(config);

  return config;
}

export const updateConfigFile = (config) => {
  writeFileSync(getCredentialsConfigPath(), JSON.stringify(config, null, 2));
}
