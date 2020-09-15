module.exports = {
  env: {
    commonjs: true,
    es6: true,
    mocha: true,
  },
  plugins: [
    'sonarjs',
  ],
  extends: [
    'airbnb-base',
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
