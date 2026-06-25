import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class BackstageMcpApi implements ICredentialType {
	name = 'backstageMcpApi';
	displayName = 'Backstage MCP API';
	documentationUrl = 'https://github.com/jsolana/n8n-nodes-backstage';
	icon = 'file:../nodes/BackstageCatalog/backstage.svg' as const;

	properties: INodeProperties[] = [
		{
			displayName: 'MCP Server URL',
			name: 'mcpUrl',
			type: 'string',
			default: '',
			required: true,
			placeholder: 'http://backctl-mcp.backstage.svc.cluster.local/mcp',
			description:
				'Full URL of the Backstage MCP server endpoint (Streamable HTTP transport)',
		},
		{
			displayName: 'Bearer Token',
			name: 'token',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description:
				'Optional Bearer token for authentication. Required when accessing the MCP server externally (e.g. through an OIDC/Keycloak gateway). Leave empty for unauthenticated access.',
		},
	];
}
