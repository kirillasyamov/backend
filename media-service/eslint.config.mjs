import rootConfig from '../eslint.config.mjs';

/** @type {import('eslint').Linter.Config[]} */
export default [
	...rootConfig,
	{
		ignores: ['dist/**', 'coverage/**'],
	},
	{
		files: ['src/**/*.ts'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
];
