import { configWithoutCloudSupport } from '@n8n/node-cli/eslint';

export default [
	...configWithoutCloudSupport.map((cfg) => {
		if (cfg.rules && cfg.rules['import-x/no-unresolved']) {
			return {
				...cfg,
				rules: {
					...cfg.rules,
					'import-x/no-unresolved': ['error', { ignore: ['@modelcontextprotocol/sdk/.*'] }],
				},
			};
		}
		return cfg;
	}),
	{
		rules: {
			'@n8n/community-nodes/no-runtime-dependencies': 'off',
			'@n8n/community-nodes/valid-peer-dependencies': 'off',
			'@n8n/community-nodes/credential-test-required': 'off',
		},
	},
];
