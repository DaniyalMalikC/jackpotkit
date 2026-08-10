/** @type {import('jest').Config} */
module.exports = {
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
  passWithNoTests: true,
  preset: '@react-native/jest-preset',
  testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}'],
};
