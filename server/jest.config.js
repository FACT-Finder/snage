module.exports = {
    collectCoverageFrom: ['src/**/*.ts'],
    reporters: [
        'default',
        [
            'jest-junit',
            {
                outputDirectory: 'build',
                outputName: 'junit.xml',
            },
        ],
    ],
    preset: 'ts-jest',
    testEnvironment: 'node',
    globals: {
        'ts-jest': {
            isolatedModules: true,
        },
    },
};
