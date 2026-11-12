const { betaVersion } = require('./scripts/beta-version');

module.exports = ({ config }) => {
  if (!process.env.KAPITALY_BETA_TAG) return config;

  const beta = betaVersion(process.env.KAPITALY_BETA_TAG, config.version);
  return {
    ...config,
    version: beta.versionName,
    android: { ...config.android, versionCode: beta.versionCode },
  };
};
