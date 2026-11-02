// Metro config for the Kit native playground.
//
// The playground renders Kit's real source from ../source, outside this
// project, so Metro has to watch that folder. The repo root also has its own
// node_modules with a different React; files under ../source would pick that
// copy up and break hooks. Singletons below always resolve from this app.
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const sourceRoot = path.resolve(projectRoot, '../source');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [sourceRoot];

const SINGLETONS = ['react', 'react-native', 'react/jsx-runtime', 'react/jsx-dev-runtime'];

const upstream = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // `@kit/...` → ../source/components/...
  if (moduleName.startsWith('@kit/')) {
    const target = path.join(sourceRoot, 'components', moduleName.slice('@kit/'.length));
    return context.resolveRequest(context, target, platform);
  }
  if (SINGLETONS.includes(moduleName) || moduleName.startsWith('react-native/')) {
    const fromApp = { ...context, originModulePath: path.join(projectRoot, 'index.ts') };
    return (upstream ?? context.resolveRequest)(fromApp, moduleName, platform);
  }
  return (upstream ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
