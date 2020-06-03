const fs = require('fs-extra');
const path = require('path');

//treat babel.config.js as plain json (`module.exports = ${ plainJson }`)
//webpack.config.js has to be treated as js file because it uses js functions
const babelConfig = require('./template/babel.config');

module.exports = preference => {
  const plugins = loadAllPlugins(preference);
  const transformedPlugins = transform(plugins);
  return transformedPlugins;
};

const loadAllPlugins = ({ eslint, prettier, typescript }) => {
  const scripts = {};
  const devDependencies = [];

  const configs = {};

  if (eslint) {
    const eslintPlugin = require('./plugins/eslint/plugin');
    configs.eslintrc = eslintPlugin.config;
    Object.assign(scripts, eslintPlugin.scripts);
    devDependencies.push(...eslintPlugin.devDependencies);
  }

  if (prettier) {
    const prettierPlugin = require('./plugins/prettier/plugin');
    configs.prettierrc = prettierPlugin.config;
    Object.assign(scripts, prettierPlugin.scripts);
    devDependencies.push(...prettierPlugin.devDependencies);
  }

  if (typescript) {
    const typescriptPlugin = require('./plugins/typescript/plugin');
    configs.tsconfig = typescriptPlugin.config;
    Object.assign(scripts, typescriptPlugin.scripts);
    devDependencies.push(...typescriptPlugin.devDependencies);
  }

  return {
    scripts,
    devDependencies,
    configs,
  };
};

const transform = ({ configs, devDependencies, scripts }) => {
  const configsToTransform = {};
  if (configs.prettierrc) {
    require('./plugins/prettier/transformer').call(null, { configs });
  }

  if (configs.tsconfig) {
    ensureBabelConfigLoaded(configsToTransform);
    ensureWebPackConfigLoaded(configsToTransform);
    require('./plugins/typescript/transformer').call(null, {
      configs,
      configsToTransform,
      scripts,
    });
  }

  return {
    configs,
    configsToTransform,
    devDependencies,
    scripts,
  };
};

const ensureBabelConfigLoaded = configsToTransform => {
  if (!configsToTransform.babelConfig) {
    configsToTransform['babelConfig'] = babelConfig;
  }
};

const ensureWebPackConfigLoaded = configsToTransform => {
  if (!configsToTransform.webpackConfig) {
    const webpackConfig = fs.readFileSync(
      path.join(__dirname, 'template/webpack.config.js'),
      'utf8'
    );
    configsToTransform['webpackConfig'] = webpackConfig;
  }
};

//exports for test
module.exports.loadAllPlugins = loadAllPlugins;
