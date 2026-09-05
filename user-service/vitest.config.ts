import { createVitestConfig } from '../vitest.shared.config';

export default createVitestConfig({
	importMetaUrl: import.meta.url,
	extraAliases: [{ find: /^@prismagen\/(.*)$/, path: 'prisma/generated/$1' }],
});
