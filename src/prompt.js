console.clear();
const { prompt } = require('enquirer');

const linterOptions = {
  eslintPrettier: 'ESLint + Prettier',
  eslint: 'ESLint Only',
  prettier: 'Prettier Only',
  none: 'None',
};

const questions = [
  {
    type: 'select',
    name: 'linter',
    message: 'select linter & formatter preference',
    choices: [
      { name: linterOptions.eslintPrettier },
      { name: linterOptions.eslint },
      { name: linterOptions.prettier },
      { name: linterOptions.none },
    ],
  },
  {
    type: 'Toggle',
    name: 'typescript',
    message: 'Use Typescript?',
  },
];

const promptAppPreference = async () => {
  const answer = await prompt(questions);
  return resolveLinterOptions(answer);
};

const resolveLinterOptions = answer => {
  const option = {
    prettier:
      answer.linter === linterOptions.eslintPrettier ||
      answer.linter === linterOptions.prettier,
    eslint:
      answer.linter === linterOptions.eslintPrettier ||
      answer.linter === linterOptions.eslint,
  };

  const newAnswer = Object.assign({}, answer, option);
  delete newAnswer['linter'];

  return newAnswer;
};

module.exports = promptAppPreference;
