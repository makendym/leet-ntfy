
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        environment: 'node', // Changed from jsdom to node for service testing
        globals: true,
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
        // Explicitly include our test files
        include: ['src/__tests__/**/*.test.ts'],
    },
});
