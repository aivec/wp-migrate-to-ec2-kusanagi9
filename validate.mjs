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

  if (!config.host) {
    console.log("'host' is required.");
    process.exit(1);
  }

  validateHost(config.host);
};
