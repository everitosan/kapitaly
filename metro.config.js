// https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
// Las migraciones de Drizzle (drizzle/*.sql) se incluyen en el bundle.
config.resolver.sourceExts.push('sql');

module.exports = config;
