const chalk = require('chalk');
const { Command } = require('commander');
const fs = require('fs');
const os = require('os');
const path = require('path');
const spawn = require('cross-spawn');
const validateNPMPackageName = require('validate-npm-package-name');

const { version: reactNewVersion } = require('../package.json');
const templateJson = require('./template.json');

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

  createPackageJson(projectPath, packageJson);

  process.chdir(projectPath);

  await installLatestPackages([
    ...templateJson.dependencies,
    ...templateJson.devDependencies,
  ]).catch(() =>
    console.error(chalk.red(`un error occurred when installing packages`))
  );

  console.log(chalk.green('success!'));
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

const createPackageJson = (root, json) => {
  const packageJsonPath = path.join(root, 'package.json');
  fs.writeFileSync(packageJsonPath, JSON.stringify(json, null, 2) + os.EOL);
};

const installLatestPackages = packages => {
  return new Promise((resolve, reject) => {
    const childProcess = spawn('npm', ['install', '--save', ...packages], {
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
