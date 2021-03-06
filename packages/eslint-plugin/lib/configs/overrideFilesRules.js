module.exports = {
  tests: {
    files: ['*.spec.js', '**/mocks/**/*.js', '*.mocks.js', '*.mock.js'],
    rules: {
      'global-require': 'off',
    },
  },
  typescript: {
    files: ['*.ts'],
    plugins: ['@typescript-eslint'],
    parser: '@typescript-eslint/parser',
    rules: {
      'no-useless-constructor': 'off',
      'no-unused-vars': 'off',
      'no-undef': 'off',
      '@typescript-eslint/no-unused-vars': ['error', {
        vars: 'all',
        args: 'after-used',
        ignoreRestSiblings: false,
      }],
    },
  }
};
