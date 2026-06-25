import { build } from 'esbuild';
import { readdirSync } from 'fs';
import { join } from 'path';

const nodesDirs = readdirSync('./dist/nodes', { withFileTypes: true })
	.filter((d) => d.isDirectory())
	.map((d) => d.name);

const entryPoints = [
	...nodesDirs.map((dir) => {
		const files = readdirSync(join('./dist/nodes', dir));
		const nodeFile = files.find((f) => f.endsWith('.node.js'));
		return join('./dist/nodes', dir, nodeFile);
	}),
	'./dist/credentials/BackstageMcpApi.credentials.js',
];

await build({
	entryPoints,
	bundle: true,
	platform: 'node',
	target: 'node18',
	format: 'cjs',
	outdir: './dist',
	outbase: './dist',
	allowOverwrite: true,
	external: ['n8n-workflow', 'n8n-core', '@langchain/*'],
	logLevel: 'info',
});
