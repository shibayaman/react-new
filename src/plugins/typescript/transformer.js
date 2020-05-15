const esprima = require('esprima');
const estraverse = require('estraverse');
const escodegen = require('escodegen');

module.exports = ({ configs, configsToTransform, scripts }) => {
  const { eslintrc, prettierrc } = configs;
  const { babelConfig, webpackConfig } = configsToTransform;
  if (eslintrc) {
    scripts.lint = 'eslint --ext .js,.jsx,.ts,.tsx .';
    eslintrc.content.plugins.push('@typescript-eslint');
    Object.assign(eslintrc.content, {
      parser: '@typescript-eslint/parser',
      overrides: [
        {
          files: ['*.+(ts|tsx)'],
          extends: [
            'plugin:@typescript-eslint/eslint-recommended',
            'plugin:@typescript-eslint/recommended',
            'prettier/@typescript-eslint',
          ],
        },
      ],
    });

    Object.assign(scripts, {
      lint: 'eslint --ext .js,.jsx,.ts,.tsx .',
    });
  }

  if (prettierrc) {
    scripts.format = 'prettier --write "**/*.+(js|jsx|json|ts|tsx)"';
    Object.assign(scripts, {
      format: 'prettier --write "**/*.+(js|jsx|json|ts|tsx)"',
    });
  }

  babelConfig.presets.push('@babel/preset-typescript');
  configsToTransform.webpackConfig = transformWebpackConfig(webpackConfig);
};

const transformWebpackConfig = webpackConfig => {
  const targetAst = esprima.parseScript(webpackConfig);

  estraverse.traverse(targetAst, {
    enter: node => {
      if (!(node.type === 'Program' || node.type === 'ExpressionStatement')) {
        return estraverse.VisitorOption.Skip;
      }
    },
    leave: node => {
      if (
        node.type === 'ExpressionStatement' &&
        node.expression.type === 'AssignmentExpression'
      ) {
        if (
          node.expression.left.type === 'MemberExpression' &&
          node.expression.left.object.name === 'module' &&
          node.expression.left.property.name === 'exports'
        ) {
          node.expression.right.body.properties.forEach(p => {
            if (p.key.name === 'entry') {
              p.value.value = './src/App.tsx';
            }

            if (p.key.name === 'resolve') {
              p.value.properties.forEach(p => {
                if (p.key.name === 'extensions') {
                  const ts = esprima.parseScript("'.ts'").body[0].expression;
                  const tsx = esprima.parseScript("'.tsx'").body[0].expression;
                  p.value.elements.push(ts);
                  p.value.elements.push(tsx);
                }
              });
            }

            if (p.key.name === 'module') {
              p.value.properties.forEach(p => {
                if (p.key.name === 'rules') {
                  p.value.elements.forEach(p => {
                    if (p.properties[1].value.value === 'babel-loader') {
                      const test = esprima.parseScript('/.(js|jsx|ts|tsx)$/')
                        .body[0].expression;
                      p.properties[0].value = test;
                    }
                  });
                }
              });
            }
          });
        }
      }
    },
  });
  return escodegen.generate(targetAst, { format: { indent: { style: '  ' } } });
};
