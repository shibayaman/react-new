module.exports = ({ configs }) => {
  if (configs.eslintrc) {
    configs.eslintrc.content.extends.push('prettier', 'prettier/react');
  }
};
