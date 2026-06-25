# Changelog

## [0.1.0] - 2025-06-25

### Added

- Initial release
- `Backstage` node with 7 operations: Search, Get Entity, List Entities, Get TechDocs Page, List TechDocs Pages, Get Relationships, Execute Command
- `BackstageAiTool` AI Tool sub-node for use with n8n AI Agents
- `BackstageMcpApi` credential supporting URL + optional Bearer token
- MCP client utility using `@modelcontextprotocol/sdk` Streamable HTTP transport
- esbuild bundling to resolve ESM dependencies for n8n's CommonJS sandbox
