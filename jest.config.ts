import type { Config } from 'jest';

const config: Config = {
  projects: [
    {
      displayName: 'test',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testPathIgnorePatterns: ['/node_modules/', '/dist/'],
    },
    {
      displayName: 'tolk',
      moduleFileExtensions: ['tolk'],
      testMatch: ['**/*_test.tolk', '**/*.test.tolk'],
      runner: './dist',
    },
  ],
};

export default config;
