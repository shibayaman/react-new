module.exports = ({ configs }) => {
  if (configs.eslintrc) {
    configs.eslintrc.extends.push('prettier', 'prettier/react');
  }
};
