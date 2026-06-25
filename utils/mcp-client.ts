import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

export interface McpClientOptions {
	mcpUrl: string;
	token?: string;
}

export interface McpToolContent {
	type: string;
	text?: string;
	[key: string]: unknown;
}

/**
 * Call a tool on the Backstage MCP server via Streamable HTTP transport.
 * Creates a new session per invocation (stateless).
 */
export async function callBackstageTool(
	options: McpClientOptions,
	toolName: string,
	args: Record<string, unknown>,
): Promise<McpToolContent[]> {
	const headers: Record<string, string> = {};
	if (options.token) {
		headers['Authorization'] = `Bearer ${options.token}`;
	}

	const transport = new StreamableHTTPClientTransport(new URL(options.mcpUrl), {
		requestInit: { headers },
	});
	const client = new Client({ name: 'n8n-backstage-mcp', version: '1.0.0' });

	await client.connect(transport);
	try {
		const result = await client.callTool({ name: toolName, arguments: args });
		return (result.content ?? []) as McpToolContent[];
	} finally {
		await client.close();
	}
}
