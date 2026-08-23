import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import swc from 'unplugin-swc';

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	plugins: [
		swc.vite({
			jsc: { target: 'es2022' },
		}),
	],
	resolve: {
		alias: [
			{ find: '@/', replacement: resolve(root, 'src/') },
			{ find: '@prismagen/', replacement: resolve(root, 'prisma/generated/') },
		],
	},
	test: {
		globals: true,
		environment: 'node',
		include: ['src/**/*.spec.ts'],
	},
});
