const chalk = require('chalk');
const { Command } = require('commander');
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

  const { configs, devDependencies, scripts } = loadPlugins(appPreference);

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

  const packageJson = {
    name: projectName,
    version: '0.1.0',
  };

  const packageJsonPath = path.join(projectPath, 'package.json');
  writeJsonFile(packageJsonPath, packageJson);

  process.chdir(projectPath);

  console.log('installing dependencies, this might take a few minutes.\n');

  //install dependencies and devDependencies in series (avoiding parallel install)
  await [
    [templateJson.dependencies],
    [templateJson.devDependencies, { devInstall: true }],
  ].reduce(async (prev, args) => {
    await prev.catch(() => {
      console.error(chalk.red(`an error occurred when installing packages`));
      process.exit(1);
    });

    return installLatestPackages(...args);
  }, Promise.resolve());

  appendJsonFile(packageJsonPath, { scripts: templateJson.scripts });

  const reactNewPath = path.dirname(
    require.resolve(`react-new`, { paths: [projectPath] })
  );

  const templatePath = path.join(reactNewPath, 'src', 'template');

  fs.copySync(templatePath, projectPath);
  fs.renameSync(
    path.join(projectPath, 'gitignore'),
    path.join(projectPath, '.gitignore')
  );

  console.log(`\nproject abc was successfully created!\n`);
  console.log(
    `now run can \n\n  ${chalk.cyan(
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

const writeJsonFile = (path, contents) => {
  fs.writeFileSync(path, JSON.stringify(contents, null, 2) + os.EOL);
};

const appendJsonFile = (path, contents) => {
  const json = JSON.parse(fs.readFileSync(path, 'utf8'));
  Object.assign(json, contents);
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
