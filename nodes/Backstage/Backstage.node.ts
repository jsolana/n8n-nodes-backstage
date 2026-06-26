import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { callBackstageTool, type McpClientOptions } from '../../utils/mcp-client';

export class Backstage implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Backstage',
		name: 'backstage',
		icon: { light: 'file:backstage.svg', dark: 'file:backstage.dark.svg' },
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Query Backstage software catalog and TechDocs via MCP',
		defaults: {
			name: 'Backstage',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'backstageMcpApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Catalog', value: 'catalog' },
					{ name: 'CLI', value: 'cli' },
					{ name: 'TechDoc', value: 'techdoc' },
				],
				default: 'catalog',
			},

			// --- Catalog operations ---
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['catalog'],
					},
				},
				options: [
					{
						name: 'Get Entity',
						value: 'getEntity',
						description: 'Get full details of a Backstage entity by ref',
						action: 'Get an entity',
					},
					{
						name: 'Get Relationships',
						value: 'getRelationships',
						description: 'Traverse the dependency graph from an entity',
						action: 'Get relationships for an entity',
					},
					{
						name: 'List Entities',
						value: 'listEntities',
						description: 'List and filter entities in the catalog',
						action: 'List entities in the catalog',
					},
					{
						name: 'Search',
						value: 'search',
						description: 'Search the catalog and TechDocs by free-text query',
						action: 'Search the catalog',
					},
				],
				default: 'search',
			},

			// --- TechDocs operations ---
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['techdoc'],
					},
				},
				options: [
					{
						name: 'Get Page',
						value: 'getTechDocsPage',
						description: 'Fetch content of a TechDocs documentation page',
						action: 'Get a techdocs page',
					},
					{
						name: 'List Pages',
						value: 'listTechDocsPages',
						description: 'List all documentation pages for an entity',
						action: 'List techdocs pages',
					},
				],
				default: 'getTechDocsPage',
			},

			// --- CLI operations ---
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['cli'],
					},
				},
				options: [
					{
						name: 'Execute Command',
						value: 'execute',
						description: 'Run an arbitrary backctl CLI command',
						action: 'Execute a backctl command',
					},
				],
				default: 'execute',
			},

			// --- Catalog: Search fields ---
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'e.g. payment service',
				description: 'Free-text search term',
				displayOptions: {
					show: {
						resource: ['catalog'],
						operation: ['search'],
					},
				},
			},
			{
				displayName: 'Search Type',
				name: 'searchType',
				type: 'options',
				default: '',
				options: [
					{ name: 'All', value: '' },
					{ name: 'Software Catalog', value: 'software-catalog' },
					{ name: 'TechDocs', value: 'techdocs' },
				],
				description: 'Filter results by type',
				displayOptions: {
					show: {
						resource: ['catalog'],
						operation: ['search'],
					},
				},
			},
			{
				displayName: 'Limit',
				name: 'searchLimit',
				type: 'number',
				default: 25,
				typeOptions: { minValue: 1, maxValue: 200 },
				description: 'Maximum number of results to return',
				displayOptions: {
					show: {
						resource: ['catalog'],
						operation: ['search'],
					},
				},
			},

			// --- Catalog: Get Entity fields ---
			{
				displayName: 'Entity Ref',
				name: 'ref',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'component:default/my-service',
				description: 'Entity ref in format kind:[namespace/]name',
				displayOptions: {
					show: {
						resource: ['catalog'],
						operation: ['getEntity'],
					},
				},
			},

			// --- Catalog: List Entities fields ---
			{
				displayName: 'Kind',
				name: 'kind',
				type: 'options',
				default: '',
				options: [
					{ name: 'All', value: '' },
					{ name: 'API', value: 'API' },
					{ name: 'Component', value: 'Component' },
					{ name: 'Domain', value: 'Domain' },
					{ name: 'Group', value: 'Group' },
					{ name: 'Resource', value: 'Resource' },
					{ name: 'System', value: 'System' },
					{ name: 'User', value: 'User' },
				],
				description: 'Filter by entity kind',
				displayOptions: {
					show: {
						resource: ['catalog'],
						operation: ['listEntities'],
					},
				},
			},
			{
				displayName: 'Filter',
				name: 'filter',
				type: 'string',
				default: '',
				placeholder: 'spec.type=openapi',
				description: 'Additional filter expression',
				displayOptions: {
					show: {
						resource: ['catalog'],
						operation: ['listEntities'],
					},
				},
			},
			{
				displayName: 'Limit',
				name: 'listLimit',
				type: 'number',
				default: 50,
				typeOptions: { minValue: 1, maxValue: 200 },
				description: 'Maximum number of entities to return',
				displayOptions: {
					show: {
						resource: ['catalog'],
						operation: ['listEntities'],
					},
				},
			},
			{
				displayName: 'Cursor',
				name: 'cursor',
				type: 'string',
				default: '',
				description: 'Pagination cursor from a previous response',
				displayOptions: {
					show: {
						resource: ['catalog'],
						operation: ['listEntities'],
					},
				},
			},

			// --- Catalog: Get Relationships fields ---
			{
				displayName: 'Entity Ref',
				name: 'relRef',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'component:default/my-service',
				description: 'Root entity ref to traverse from',
				displayOptions: {
					show: {
						resource: ['catalog'],
						operation: ['getRelationships'],
					},
				},
			},
			{
				displayName: 'Direction',
				name: 'direction',
				type: 'options',
				default: 'outbound',
				options: [
					{ name: 'Both', value: 'both' },
					{ name: 'Inbound', value: 'inbound' },
					{ name: 'Outbound', value: 'outbound' },
				],
				description: 'Traversal direction for relationships',
				displayOptions: {
					show: {
						resource: ['catalog'],
						operation: ['getRelationships'],
					},
				},
			},
			{
				displayName: 'Relation Type',
				name: 'relationType',
				type: 'string',
				default: '',
				placeholder: 'dependsOn',
				description: 'Filter by relation type (e.g. dependsOn, consumesApi)',
				displayOptions: {
					show: {
						resource: ['catalog'],
						operation: ['getRelationships'],
					},
				},
			},
			{
				displayName: 'Depth',
				name: 'depth',
				type: 'number',
				default: 3,
				typeOptions: { minValue: 1, maxValue: 5 },
				description: 'Maximum traversal depth',
				displayOptions: {
					show: {
						resource: ['catalog'],
						operation: ['getRelationships'],
					},
				},
			},

			// --- TechDocs: Get Page fields ---
			{
				displayName: 'Entity Ref',
				name: 'techDocsRef',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'component:default/my-service',
				description: 'Entity ref that owns the documentation',
				displayOptions: {
					show: {
						resource: ['techdoc'],
						operation: ['getTechDocsPage'],
					},
				},
			},
			{
				displayName: 'Page Path',
				name: 'pagePath',
				type: 'string',
				default: '',
				placeholder: 'getting-started',
				description: 'Page path within the docs. Leave empty for the index page.',
				displayOptions: {
					show: {
						resource: ['techdoc'],
						operation: ['getTechDocsPage'],
					},
				},
			},

			// --- TechDocs: List Pages fields ---
			{
				displayName: 'Entity Ref',
				name: 'techDocsListRef',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'component:default/my-service',
				description: 'Entity ref that owns the documentation',
				displayOptions: {
					show: {
						resource: ['techdoc'],
						operation: ['listTechDocsPages'],
					},
				},
			},

			// --- CLI: Execute fields ---
			{
				displayName: 'Command',
				name: 'command',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'catalog facets --facet spec.type',
				description:
					'The backctl subcommand and arguments to execute (e.g. "catalog ancestry component:default/my-service")',
				displayOptions: {
					show: {
						resource: ['cli'],
						operation: ['execute'],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials('backstageMcpApi');
		const mcpOptions: McpClientOptions = {
			mcpUrl: credentials.mcpUrl as string,
			token: (credentials.token as string) || undefined,
		};

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;

				let toolName: string;
				const args: Record<string, unknown> = {};

				switch (operation) {
					case 'search': {
						toolName = 'search';
						args.query = this.getNodeParameter('query', i) as string;
						const searchType = this.getNodeParameter('searchType', i) as string;
						if (searchType) args.type = searchType;
						const limit = this.getNodeParameter('searchLimit', i) as number;
						if (limit !== 25) args.limit = limit;
						break;
					}
					case 'getEntity': {
						toolName = 'get_entity';
						args.ref = this.getNodeParameter('ref', i) as string;
						break;
					}
					case 'listEntities': {
						toolName = 'list_entities';
						const kind = this.getNodeParameter('kind', i) as string;
						if (kind) args.kind = kind;
						const filter = this.getNodeParameter('filter', i) as string;
						if (filter) args.filter = filter;
						const listLimit = this.getNodeParameter('listLimit', i) as number;
						if (listLimit !== 50) args.limit = listLimit;
						const cursor = this.getNodeParameter('cursor', i) as string;
						if (cursor) args.cursor = cursor;
						break;
					}
					case 'getTechDocsPage': {
						toolName = 'get_techdocs_page';
						args.ref = this.getNodeParameter('techDocsRef', i) as string;
						const pagePath = this.getNodeParameter('pagePath', i) as string;
						if (pagePath) args.path = pagePath;
						break;
					}
					case 'listTechDocsPages': {
						toolName = 'list_techdocs_pages';
						args.ref = this.getNodeParameter('techDocsListRef', i) as string;
						break;
					}
					case 'getRelationships': {
						toolName = 'get_relationships';
						args.ref = this.getNodeParameter('relRef', i) as string;
						const direction = this.getNodeParameter('direction', i) as string;
						if (direction !== 'outbound') args.direction = direction;
						const relationType = this.getNodeParameter('relationType', i) as string;
						if (relationType) args.relation_type = relationType;
						const depth = this.getNodeParameter('depth', i) as number;
						if (depth !== 3) args.depth = depth;
						break;
					}
					case 'execute': {
						toolName = 'execute';
						args.command = this.getNodeParameter('command', i) as string;
						break;
					}
					default:
						throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, {
							itemIndex: i,
						});
				}

				const content = await callBackstageTool(mcpOptions, toolName, args);

				const textContent = content
					.filter((c) => c.type === 'text' && c.text)
					.map((c) => c.text as string)
					.join('\n');

				let json: IDataObject;
				try {
					json = JSON.parse(textContent) as IDataObject;
				} catch {
					json = { result: textContent };
				}

				returnData.push({
					json,
					pairedItem: { item: i },
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}

				throw new NodeApiError(this.getNode(), error as unknown as JsonObject, {
					itemIndex: i,
					message: (error as Error).message,
				});
			}
		}

		return [returnData];
	}
}
