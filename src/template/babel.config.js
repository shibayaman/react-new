module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        modules: false,
      },
    ],
    '@babel/preset-react',
    '@babel/preset-typescript',
  ],
  env: {
    test: {
      plugins: ['transform-es2015-modules-commonjs'],
    },
  },
};
