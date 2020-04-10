const chalk = require('chalk');
const fs = require('fs');
const { Command } = require('commander');
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
