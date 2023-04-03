
/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
    preset: 'ts-jest',
    collectCoverage: false,
    collectCoverageFrom: ['src/**/*.ts'],
    coverageReporters: ['html', 'json', 'lcov', 'text'],
}