/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
export const preset = 'ts-jest';
export const collectCoverage = true;
export const collectCoverageFrom = ['src/**/*.ts'];
export const coverageReporters = ['html', 'json', 'lcov', 'text'];
