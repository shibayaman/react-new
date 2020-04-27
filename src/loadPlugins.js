const fs = require('fs-extra');
const path = require('path');

//treat babel.config.js as plain json (`module.exports = ${ plainJson }`)
//webpack.config.js has to be treated as js file because it uses js functions
const babelConfig = require('./template/babel.config');

module.exports = preference => {
  const plugins = loadAllPlugins(preference);
  const { configs, devDependencies, scripts } = transform(plugins);
  return {
    configs,
    devDependencies,
    scripts,
  };
};

const loadAllPlugins = ({ eslint, prettier, typescript }) => {
  const scripts = {};
  const devDependencies = [];

  let eslintrc;
  let prettierrc;
  let tsconfig;

  if (eslint) {
    const eslintPlugin = require('./plugins/eslint/plugin');
    eslintrc = eslintPlugin.config;
    Object.assign(scripts, eslintPlugin.scripts);
    devDependencies.push(...eslintPlugin.devDependencies);
  }

  if (prettier) {
    const prettierPlugin = require('./plugins/prettier/plugin');
    prettierrc = prettierPlugin.config;
    Object.assign(scripts, prettierPlugin.scripts);
    devDependencies.push(...prettierPlugin.devDependencies);
  }

  if (typescript) {
    const typescriptPlugin = require('./plugins/typescript/plugin');
    tsconfig = typescriptPlugin.config;
    Object.assign(scripts, typescriptPlugin.scripts);
    devDependencies.push(...typescriptPlugin.devDependencies);
  }

  return {
    scripts,
    devDependencies,
    configs: {
      eslintrc,
      prettierrc,
      tsconfig,
    },
  };
};

const transform = ({ configs, devDependencies, scripts }) => {
  if (configs.prettierrc) {
    require('./plugins/prettier/transformer').call(null, { configs });
  }

  if (configs.tsconfig) {
    ensureBabelConfigLoaded(configs);
    ensureWebPackConfigLoaded(configs);
    require('./plugins/typescript/transformer').call(null, {
      configs,
      scripts,
    });
  }

  return {
    configs,
    devDependencies,
    scripts,
  };
};

const ensureBabelConfigLoaded = configs => {
  if (!configs.babelConfig) {
    configs['babelConfig'] = babelConfig;
  }
};

const ensureWebPackConfigLoaded = configs => {
  if (!configs.webpackConfig) {
    const webpackConfig = fs.readFileSync(
      path.join(__dirname, 'template/webpack.config.js'),
      'utf8'
    );
    configs['webpackConfig'] = webpackConfig;
  }
};
