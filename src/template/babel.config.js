module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        modules: false,
      },
    ],
    '@babel/preset-react',
  ],
  plugins: ['@babel/plugin-transform-runtime'],
  env: {
    test: {
      plugins: ['transform-es2015-modules-commonjs'],
    },
  },
};
