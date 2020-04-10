const chalk = require('chalk');
const fs = require('fs');
const { Command } = require('commander');
const validateNPMPackageName = require('validate-npm-package-name');
const packageJson = require('../package.json');

module.exports = () => {
  let projectName;
  const program = new Command('react-new')
    .version(packageJson.version, '-v, --version')
    .arguments('<project-name>')
    .action(name => {
      projectName = name;
    });

  program.parse(process.argv);

  if (!isValidProjectName(projectName)) {
    process.exit(1);
  }

  try {
    fs.mkdirSync(projectName);
  } catch (err) {
    if (err.code === 'EEXIST') {
      console.error(
        chalk.red('ERROR: the project already exists in current directory')
      );
    } else {
      console.error(err);
    }
  }
};

const isValidProjectName = name => {
  const validationResult = validateNPMPackageName(name);

  if (!validationResult.validForNewPackages) {
    const errorMessages = [
      ...(validationResult.errors || []),
      ...(validationResult.warnings || []),
    ];

    console.error(chalk.red(`project name ${chalk.cyan(name)} is invalid.`));
    console.error(chalk.red(`it vaiolates following npm naming restrictions`));

    errorMessages.forEach(error => {
      console.error(chalk.red(`  # ${error}`));
    });
    return false;
  }
  return true;
};
