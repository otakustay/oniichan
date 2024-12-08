import {ViteUserConfig} from 'vitest/config';

const config: ViteUserConfig = {
    test: {
        include: ['src/**/*.test.ts'],
        coverage: {
            enabled: true,
            all: false,
        },
        passWithNoTests: true,
    },
};

export default config;
