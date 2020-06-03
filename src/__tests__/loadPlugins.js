const { loadAllPlugins } = require('../loadPlugins');
const loadPlugins = require('../loadPlugins');

describe('loadAllPlugins', () => {
  it('should load selected plugins', () => {
    const preference = { eslint: true, prettier: true, typescript: true };
    let configKeys = Object.keys(loadAllPlugins(preference).configs);
    expect(configKeys).toEqual(['eslintrc', 'prettierrc', 'tsconfig']);

    preference.eslint = false;
    configKeys = Object.keys(loadAllPlugins(preference).configs);
    expect(configKeys).toEqual(['prettierrc', 'tsconfig']);

    preference.prettier = false;
    preference.typescript = false;
    expect(loadAllPlugins(preference).configs).toEqual({});
  });
});

describe('loadPlugins integration test', () => {
  describe('eslint', () => {
    it('should return unedited eslintrc when no other plugins loaded', () => {
      const preference = { eslint: true, prettier: false, typescript: false };
      expect(loadPlugins(preference).configs.eslintrc).toMatchSnapshot();
    });

    it('should modify eslintrc properly when prettier loaded', () => {
      const preference = { eslint: true, prettier: true, typescript: false };
      expect(loadPlugins(preference).configs.eslintrc).toMatchSnapshot();
    });

    it('should modify eslintrc properly when prettier & ts loaded', () => {
      const preference = { eslint: true, prettier: true, typescript: true };
      expect(loadPlugins(preference).configs.eslintrc).toMatchSnapshot();
    });
  });

  describe('babel config', () => {
    it('should not add babelConfig to configsToTransoform when ts not loaded', () => {
      const preference = { eslint: true, prettier: true, typescript: false };
      expect(
        loadPlugins(preference).configsToTransform.babelConfig
      ).toBeUndefined();
    });

    it('should modify babel config properly when ts loaded', () => {
      const preference = { eslint: true, prettier: true, typescript: true };
      expect(
        loadPlugins(preference).configsToTransform.babelConfig
      ).toMatchSnapshot();
    });
  });

  describe('webpack config', () => {
    it('should not add webpackConfig to configsToTransoform when ts not loaded', () => {
      const preference = { eslint: true, prettier: true, typescript: false };
      expect(
        loadPlugins(preference).configsToTransform.webpackConfig
      ).toBeUndefined();
    });

    it('should modify webpack config properly when ts loaded', () => {
      const preference = { eslint: true, prettier: true, typescript: true };
      expect(
        loadPlugins(preference).configsToTransform.webpackConfig
      ).toMatchSnapshot();
    });
  });
});
