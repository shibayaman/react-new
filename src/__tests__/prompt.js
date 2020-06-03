const { resolveLinterOptions, linterOptions } = require('../prompt');

describe('resolveLinterOptions', () => {
  it('should resolve prompt answer', () => {
    expect(
      resolveLinterOptions({
        linter: linterOptions.eslintPrettier,
        typescript: true,
      })
    ).toEqual({
      eslint: true,
      prettier: true,
      typescript: true,
    });

    expect(
      resolveLinterOptions({
        linter: linterOptions.prettier,
        typescript: true,
      })
    ).toEqual({
      eslint: false,
      prettier: true,
      typescript: true,
    });

    expect(
      resolveLinterOptions({
        linter: linterOptions.none,
        typescript: false,
      })
    ).toEqual({
      eslint: false,
      prettier: false,
      typescript: false,
    });
  });
});
