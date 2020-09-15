module.exports = {
  env: {
    commonjs: true,
    es6: true,
    mocha: true,
  },
  plugins: [
    'jest',
    'sonarjs',
  ],
  extends: [
    'airbnb-base',
    'plugin:jest/all',
    'plugin:sonarjs/recommended',
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  rules: {
    'no-unused-expressions': 0,
    'no-console': 'off',
  },
};
