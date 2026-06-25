# n8n-nodes-backstage

Query your [Backstage](https://backstage.io) software catalog, TechDocs, and service dependency graphs directly from n8n workflows and AI Agents — powered by the [backctl MCP server](https://github.com/jsolana/backctl).

## Installation

Install this community node in your n8n instance:

```bash
npm install n8n-nodes-backstage
```

Or via the n8n UI: **Settings → Community Nodes → Install → `n8n-nodes-backstage`**

## Prerequisites

A running [backctl MCP server](https://github.com/jsolana/backctl) accessible via HTTP (Streamable HTTP transport). The server exposes Backstage catalog data through the Model Context Protocol.

## Credentials

Configure the **Backstage MCP API** credential with:

| Field | Description |
|-------|-------------|
| MCP Server URL | Full URL of the backctl MCP endpoint (e.g. `http://backctl-mcp:8080/mcp`) |
| Bearer Token | Optional. Required when the MCP server is behind an auth gateway (OIDC/Keycloak). Leave empty for unauthenticated access. |

## Nodes

### Backstage

A regular n8n node for workflow automation. Supports `usableAsTool: true` so it can also be attached to AI Agents directly.

**Operations:**

| Operation | Description | Key Parameters |
|-----------|-------------|----------------|
| Search | Free-text search across catalog and TechDocs | `query`, `searchType`, `limit` |
| Get Entity | Get full entity details by ref | `ref` (e.g. `component:default/my-service`) |
| List Entities | List/filter catalog entities | `kind`, `filter`, `limit`, `cursor` |
| Get TechDocs Page | Fetch a documentation page as text | `ref`, `path` |
| List TechDocs Pages | Table of contents for an entity | `ref` |
| Get Relationships | Traverse dependency graph | `ref`, `direction`, `relationType`, `depth` |
| Execute Command | Run any backctl CLI subcommand | `command` |

### Backstage AI Tool

An AI Tool sub-node designed for use with n8n's AI Agent node. It exposes selected Backstage operations as LangChain-compatible tools that the agent can invoke autonomously during conversations.

Configure which operations the agent can access via the **Available Operations** multi-select.

## Usage Examples

### Workflow Automation

1. **Catalog Audit** — Use a Schedule trigger + Backstage (List Entities) to periodically check for components missing ownership or lifecycle annotations.
2. **Dependency Impact Analysis** — When a service is updated, use Get Relationships to find all downstream consumers and notify their owners.
3. **TechDocs Sync** — Fetch documentation pages and push them to Confluence or Notion.

### AI Agent (RAG)

Connect the Backstage AI Tool node to an AI Agent. The agent can then answer questions like:
- "Who owns the payment-gateway service?"
- "What APIs does the ride-service consume?"
- "Show me the onboarding docs for the driver platform"

## Development

```bash
# Install dependencies
npm install

# Build the node (TypeScript + esbuild bundling)
npm run build

# Build Docker image with the node and run n8n locally
make run

# Or step by step:
make build    # Compile TypeScript + bundle dependencies
make docker   # Build Docker image
make run      # Build + Docker + run n8n at http://localhost:5678

# Lint
npm run lint
```

## License

MIT
