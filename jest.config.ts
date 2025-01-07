/* eslint-disable */
export default {
  displayName: 'new-api',
  //   preset: '../../jest.preset.js',
  // globals: {
  //   "ts-jest": {
  //     tsconfig: "<rootDir>/tsconfig.spec.json"
  //   }
  // },
  moduleNameMapper: {
    '~/(.*)': '<rootDir>/src/$1',
  },
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/api-server',
  testTimeout: 15000,
};
