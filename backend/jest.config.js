/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  collectCoverageFrom: ["src/**/*.js"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov"],
  testTimeout: 15000,
  // Prevent open handles from keeping Jest alive
  forceExit: true,
  // Clear mocks between each test
  clearMocks: true,
  restoreMocks: true,
};
