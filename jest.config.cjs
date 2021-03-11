/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: false,
  coverageDirectory: "coverage",
  collectCoverageFrom: ['**/*.ts'],
  coverageReporters: ["html"],
  testMatch: ["<rootDir>/test/*.ts"]
};