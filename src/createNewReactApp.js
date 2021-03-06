const chalk = require('chalk');
const { Command } = require('commander');
const { execSync } = require('child_process');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const spawn = require('cross-spawn');
const validateNPMPackageName = require('validate-npm-package-name');

const loadPlugins = require('./loadPlugins');
const propmtAppPreference = require('./prompt');
const templateJson = require('./template.json');
const { version: reactNewVersion } = require('../package.json');

module.exports = async () => {
  let projectName;
  const program = new Command('react-new')
    .version(reactNewVersion, '-v, --version')
    .arguments('<project-name>')
    .action(name => {
      projectName = name;
    });

  program.parse(process.argv);

  if (!isValidProjectName(projectName)) {
    process.exit(1);
  }

  const projectPath = path.resolve(projectName);

  console.clear();
  console.log(`creating project ${chalk.cyan(projectName)}\n`);

  const appPreference = await propmtAppPreference().catch(() => {
    console.log('an error occurred while creating the app');
    process.exit(1);
  });

  const plugins = loadPlugins(appPreference);

  try {
    fs.mkdirSync(projectPath);
  } catch (err) {
    if (err.code === 'EEXIST') {
      console.error(
        chalk.red(
          `ERROR: the directory named ${chalk.cyan(
            `${projectName}`
          )} already exists in current directory`
        )
      );
    } else {
      console.error(err);
    }
    process.exit(1);
  }

  initialize({ projectName, projectPath, plugins, appPreference }).catch(
    err => {
      console.error(chalk.red(err));
      cleanAndExit(1, projectPath);
    }
  );
};

const initialize = async ({
  projectName,
  projectPath,
  plugins,
  appPreference,
}) => {
  const packageJson = {
    name: projectName,
    version: '0.1.0',
  };

  const packageJsonPath = path.join(projectPath, 'package.json');
  writeJsonFile(packageJsonPath, packageJson);

  process.chdir(projectPath);

  console.log('\ninstalling dependencies, this might take a few minutes.\n');

  const devDependencies = [
    ...templateJson.devDependencies,
    ...plugins.devDependencies,
  ];

  //install dependencies and devDependencies in series (avoiding parallel install)
  await [
    [templateJson.dependencies],
    [devDependencies, { devInstall: true }],
  ].reduce(async (prev, args) => {
    await prev.catch(() => {
      throw new Error('an error occurred when installing packages');
    });

    return installLatestPackages(...args);
  }, Promise.resolve());

  const scripts = Object.assign(templateJson.scripts, plugins.scripts);
  appendJsonFile(packageJsonPath, { scripts });

  const templatePath = path.join(__dirname, 'template');

  fs.copySync(templatePath, projectPath);

  Object.keys(plugins.configs).forEach(key => {
    const config = plugins.configs[key];
    writeJsonFile(path.join(projectPath, config.filename), config.content);
  });

  if (plugins.configsToTransform.babelConfig) {
    fs.writeFileSync(
      path.join(projectPath, 'babel.config.js'),
      `module.exports = ${JSON.stringify(
        plugins.configsToTransform.babelConfig,
        null,
        2
      )}` + os.EOL
    );
  }

  if (plugins.configsToTransform.webpackConfig) {
    fs.writeFileSync(
      path.join(projectPath, 'webpack.config.js'),
      plugins.configsToTransform.webpackConfig
    );
  }

  if (appPreference.typescript) {
    fs.renameSync(
      path.join(projectPath, 'src', 'App.js'),
      path.join(projectPath, 'src', 'App.tsx')
    );
  }

  fs.renameSync(
    path.join(projectPath, 'gitignore'),
    path.join(projectPath, '.gitignore')
  );

  const isGitInitialized = initializeGit();
  if (isGitInitialized) {
    const isGitCommited = gitCommit();
    if (!isGitCommited) {
      fs.removeSync(path.join(projectPath, '.git'));
      console.log('removed .git');
    }
  }

  console.log(`\nproject abc was successfully created!\n`);
  console.log(
    `now run can cd in the directory and run \n\n  ${chalk.cyan(
      'npm run dev'
    )}\n\nto start the development server\n`
  );
};

const isValidProjectName = name => {
  const validationResult = validateNPMPackageName(name);

  if (!validationResult.validForNewPackages) {
    const errorMessages = [
      ...(validationResult.errors || []),
      ...(validationResult.warnings || []),
    ];

    console.error(
      chalk.red(`ERROR: project name ${chalk.cyan(name)} is invalid.`)
    );
    console.error(chalk.red(`it vaiolates following npm naming restrictions`));

    errorMessages.forEach(error => {
      console.error(chalk.red(`  # ${error}`));
    });
    return false;
  }
  return true;
};

const writeJsonFile = (path, content) => {
  fs.writeFileSync(path, JSON.stringify(content, null, 2) + os.EOL);
};

const appendJsonFile = (path, content) => {
  const json = JSON.parse(fs.readFileSync(path, 'utf8'));
  Object.assign(json, content);
  writeJsonFile(path, json);
};

const installLatestPackages = (packages, { devInstall = false } = {}) => {
  const saveOption = devInstall ? '--save-dev' : '--save';
  return new Promise((resolve, reject) => {
    const childProcess = spawn('npm', ['install', saveOption, ...packages], {
      stdio: 'inherit',
    });
    childProcess.on('close', code => {
      if (code !== 0) {
        reject();
      }
      resolve();
    });
  });
};

const initializeGit = () => {
  try {
    execSync('git --version', { stdio: 'ignore' });
    execSync('git init', { stdio: 'inherit' });
    return true;
  } catch (e) {
    console.log(`${chalk.yellow(`\ngit was not initialized\n ${e}`)}\n`);
    return false;
  }
};

const gitCommit = () => {
  try {
    execSync('git add -A', { stdio: 'ignore' });
    execSync('git commit -m "Initial Commit"', {
      stdio: 'ignore',
    });
    console.log('created initial git commit');
    return true;
  } catch (e) {
    console.log(`${chalk.yellow(`\nunable to create git commit\n ${e}`)}\n`);
    return false;
  }
};

const cleanAndExit = (status, projectPath) => {
  fs.removeSync(projectPath);
  process.exit(1);
};
