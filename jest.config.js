module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/UnitTests/**/*.test.js'],
  verbose: true,
  transform: {
    '^.+\.js$': 'babel-jest'
  },
  transformIgnorePatterns: []
};
