import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

interface AliasSpec {
	find: RegExp;
	path: string;
}

interface VitestSharedConfigOptions {
	importMetaUrl: string;
	extraAliases?: AliasSpec[];
	setupFiles?: string[];
}

export function createVitestConfig(options: VitestSharedConfigOptions) {
	const root = dirname(fileURLToPath(options.importMetaUrl));

	const aliases: Array<{ find: RegExp; replacement: string }> = [
		{ find: /^@\/(.*)$/, replacement: resolve(root, 'src/$1') },
		...(options.extraAliases ?? []).map(({ find, path }) => ({
			find,
			replacement: resolve(root, path),
		})),
	];

	return defineConfig({
		plugins: [
			swc.vite({
				jsc: { target: 'es2022' },
			}),
		],
		resolve: {
			alias: aliases,
		},
		test: {
			globals: true,
			environment: 'node',
			include: ['src/**/*.spec.ts'],
			...(options.setupFiles ? { setupFiles: options.setupFiles } : {}),
		},
	});
}
