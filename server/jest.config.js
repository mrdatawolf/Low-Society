export default {
  testEnvironment: 'node',
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testMatch: ['**/test/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js', // Exclude main server file
  ],
  coverageDirectory: 'coverage',
  forceExit: true, // Force Jest to exit after all tests complete
};
