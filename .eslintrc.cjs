module.exports = {
  root: true,
  env: {
    es2021: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'script'
  },
  ignorePatterns: [
    'server/node_modules/',
    'game/images/'
  ],
  overrides: [
    {
      files: [
        'server/*.js'
      ],
      env: {
        node: true
      }
    },
    {
      files: [
        'game/src/*.js'
      ],
      env: {
        browser: true
      },
      globals: {
        Movement: 'readonly',
        io: 'readonly'
      }
    }
  ],
  rules: {
    'no-unused-vars': [
      'error',
      {
        args: 'none'
      }
    ]
  }
};