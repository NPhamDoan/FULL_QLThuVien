import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: [
    '**/*.test.ts',
    '**/*.property.test.ts',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    '**/*.ts',
    '!tests/**',
    '!**/*.test.ts',
    '!**/*.property.test.ts',
    '!index.ts',
    '!jest.config.ts',
  ],
  coverageDirectory: 'coverage',
};

export default config;
