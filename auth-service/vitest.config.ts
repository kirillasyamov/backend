import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

export default defineConfig({
	plugins: [
		swc.vite({
			jsc: { target: 'es2022' },
		}),
	],
	test: {
		globals: true,
		environment: 'node',
		include: ['src/**/*.spec.ts'],
	},
});
