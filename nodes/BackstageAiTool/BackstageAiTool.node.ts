import type {
	INodeType,
	INodeTypeDescription,
	ISupplyDataFunctions,
	SupplyData,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

import { callBackstageTool, type McpClientOptions } from '../../utils/mcp-client';

export class BackstageAiTool implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Backstage AI Tool',
		name: 'backstageAiTool',
		icon: { light: 'file:backstage.svg', dark: 'file:backstage.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: 'Backstage AI Tool',
		description: 'Query Backstage catalog and TechDocs as an AI Agent tool via MCP',
		defaults: {
			name: 'Backstage AI Tool',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Tools'],
			},
		},
		inputs: [],
		outputs: [NodeConnectionTypes.AiTool],
		outputNames: ['Tool'],
		credentials: [
			{
				name: 'backstageMcpApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Available Operations',
				name: 'operations',
				type: 'multiOptions',
				options: [
					{ name: 'Get Entity Details', value: 'get_entity' },
					{ name: 'Get Relationships', value: 'get_relationships' },
					{ name: 'Get TechDocs Page', value: 'get_techdocs_page' },
					{ name: 'List Entities', value: 'list_entities' },
					{ name: 'List TechDocs Pages', value: 'list_techdocs_pages' },
					{ name: 'Search Catalog & TechDocs', value: 'search' },
				],
				default: ['search', 'get_entity', 'get_techdocs_page'],
				description: 'Which Backstage operations the AI Agent can invoke',
			},
		],
	};

	async supplyData(this: ISupplyDataFunctions): Promise<SupplyData> {
		const credentials = await this.getCredentials('backstageMcpApi');
		const mcpOptions: McpClientOptions = {
			mcpUrl: credentials.mcpUrl as string,
			token: (credentials.token as string) || undefined,
		};

		const selectedOps = this.getNodeParameter('operations', 0) as string[];

		const toolDefinitions: Record<
			string,
			{ name: string; description: string; schema: z.ZodObject<z.ZodRawShape>; mcpTool: string }
		> = {
			search: {
				name: 'backstage_search',
				description:
					'Search the Backstage catalog and TechDocs by free-text query. Returns lightweight summaries with entity refs.',
				schema: z.object({
					query: z.string().describe('Free-text search term'),
					type: z
						.enum(['software-catalog', 'techdocs'])
						.optional()
						.describe("Filter by type: 'software-catalog' or 'techdocs'"),
					limit: z.number().optional().describe('Maximum number of results (default 25)'),
				}),
				mcpTool: 'search',
			},
			get_entity: {
				name: 'backstage_get_entity',
				description:
					'Get full details of a Backstage entity by its ref. Returns metadata, spec, relations, and status.',
				schema: z.object({
					ref: z.string().describe('Entity ref in format kind:[namespace/]name'),
				}),
				mcpTool: 'get_entity',
			},
			list_entities: {
				name: 'backstage_list_entities',
				description: 'List and filter entities in the Backstage catalog.',
				schema: z.object({
					kind: z
						.enum(['Component', 'API', 'System', 'Domain', 'Resource', 'Group', 'User'])
						.optional()
						.describe('Filter by entity kind'),
					filter: z
						.string()
						.optional()
						.describe("Filter expression (e.g. 'spec.type=openapi')"),
					limit: z
						.number()
						.optional()
						.describe('Max entities to return (default 50, max 200)'),
				}),
				mcpTool: 'list_entities',
			},
			get_techdocs_page: {
				name: 'backstage_get_techdocs_page',
				description:
					'Fetch content of a TechDocs documentation page as plain text. Use list_techdocs_pages first to discover available pages.',
				schema: z.object({
					ref: z.string().describe('Entity ref that owns the docs'),
					path: z.string().optional().describe("Page path (e.g. 'getting-started')"),
				}),
				mcpTool: 'get_techdocs_page',
			},
			list_techdocs_pages: {
				name: 'backstage_list_techdocs_pages',
				description: 'List all documentation pages (table of contents) for an entity.',
				schema: z.object({
					ref: z.string().describe('Entity ref that owns the docs'),
				}),
				mcpTool: 'list_techdocs_pages',
			},
			get_relationships: {
				name: 'backstage_get_relationships',
				description:
					'Traverse the dependency graph starting from an entity. Returns related entities with metadata.',
				schema: z.object({
					ref: z.string().describe('Root entity ref'),
					direction: z
						.enum(['outbound', 'inbound', 'both'])
						.optional()
						.describe("Traversal direction (default 'outbound')"),
					relation_type: z
						.string()
						.optional()
						.describe("Filter by relation type (e.g. 'dependsOn', 'consumesApi')"),
					depth: z.number().optional().describe('Max traversal depth (default 3, max 5)'),
				}),
				mcpTool: 'get_relationships',
			},
		};

		const tools: DynamicStructuredTool[] = [];

		for (const opKey of selectedOps) {
			const def = toolDefinitions[opKey];
			if (!def) continue;

			tools.push(
				new DynamicStructuredTool({
					name: def.name,
					description: def.description,
					schema: def.schema,
					func: async (input: Record<string, unknown>): Promise<string> => {
						const args: Record<string, unknown> = {};
						for (const [key, value] of Object.entries(input)) {
							if (value !== undefined && value !== null && value !== '') {
								args[key] = value;
							}
						}
						const content = await callBackstageTool(mcpOptions, def.mcpTool, args);
						const textParts = content
							.filter((c) => c.type === 'text' && c.text)
							.map((c) => c.text as string);
						return textParts.join('\n') || JSON.stringify(content);
					},
				}),
			);
		}

		return { response: tools };
	}
}
