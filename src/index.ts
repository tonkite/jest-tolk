import { createJestRunner } from 'create-jest-runner';

export = createJestRunner(require.resolve('./run')) as any;
