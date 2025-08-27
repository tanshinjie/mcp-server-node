# MCP Server Node

A comprehensive MCP (Model Context Protocol) server implementation in Node.js that exposes multiple resource types including file system information, system details, and generated content.

## Features

This MCP server provides access to various types of resources without requiring any external APIs:

### 🗂️ File System Resources
- **Current Directory Listing** (`file://current-directory`) - Lists files and directories in the current working directory with metadata
- **Package Information** (`file://package-info`) - Displays package.json information if available

### 💻 System Information Resources
- **System Info** (`system://info`) - Comprehensive system information including OS, architecture, Node.js version, memory usage, CPU count, load average, and user info
- **Environment Variables** (`system://env`) - Non-sensitive environment variables (automatically filters out passwords, secrets, keys, and tokens)

### 📝 Generated Content Resources
- **Lorem Ipsum Text** (`generated://lorem`) - Dynamically generated Lorem Ipsum placeholder text with random paragraph and sentence counts
- **Sample Data** (`generated://data`) - Generated sample user data in JSON format with realistic fake data

### ⚙️ Configuration Resources
- **MCP Server Config** (`config://mcp-server`) - Current server configuration, capabilities, and metadata

## Installation & Usage

### Using npx (Recommended)
```bash
npx mcp-server-node
```

### Global Installation
```bash
npm install -g mcp-server-node
mcp-server-node
```

### Local Installation
```bash
npm install mcp-server-node
npx mcp-server-node
```

## MCP Protocol Usage

The server communicates via JSON-RPC over stdin/stdout following the Model Context Protocol specification.

### Initialize the Server
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {}
}
```

### List Available Resources
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "resources/list",
  "params": {}
}
```

### Read a Specific Resource
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "resources/read",
  "params": {
    "uri": "system://info"
  }
}
```

## Example Responses

### Resource List Response
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "resources": [
      {
        "uri": "file://current-directory",
        "name": "Current Directory Listing",
        "description": "Lists files and directories in the current working directory",
        "mimeType": "application/json"
      },
      {
        "uri": "system://info",
        "name": "System Information",
        "description": "Basic system information including OS, architecture, and Node.js version",
        "mimeType": "application/json"
      }
    ]
  }
}
```

### Resource Read Response
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "contents": [
      {
        "uri": "system://info",
        "mimeType": "application/json",
        "text": "{\n  \"platform\": \"darwin\",\n  \"architecture\": \"arm64\",\n  \"nodeVersion\": \"v18.17.0\",\n  \"hostname\": \"example-host\",\n  \"uptime\": 12345,\n  \"totalMemory\": 17179869184,\n  \"freeMemory\": 8589934592,\n  \"cpuCount\": 8,\n  \"loadAverage\": [1.5, 1.8, 2.1],\n  \"timestamp\": \"2024-01-01T12:00:00.000Z\"\n}"
      }
    ]
  }
}
```

## Integration with Claude Desktop

To use this MCP server with Claude Desktop, add it to your Claude Desktop configuration:

### macOS
Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mcp-server-node": {
      "command": "npx",
      "args": ["mcp-server-node"]
    }
  }
}
```

### Windows
Edit `%APPDATA%\\Claude\\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mcp-server-node": {
      "command": "npx",
      "args": ["mcp-server-node"]
    }
  }
}
```

## Testing the Server

You can test the server locally using command line tools:

```bash
# Test initialization
echo '{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {}}' | npx mcp-server-node

# Test resource listing
echo '{"jsonrpc": "2.0", "id": 2, "method": "resources/list", "params": {}}' | npx mcp-server-node

# Test reading system info
echo '{"jsonrpc": "2.0", "id": 3, "method": "resources/read", "params": {"uri": "system://info"}}' | npx mcp-server-node

# Test reading generated content
echo '{"jsonrpc": "2.0", "id": 4, "method": "resources/read", "params": {"uri": "generated://lorem"}}' | npx mcp-server-node
```

## Security Features

- **Environment Variable Filtering**: Automatically filters out sensitive environment variables containing keywords like "password", "secret", "key", or "token"
- **No External Dependencies**: Uses only Node.js built-in modules
- **Read-Only Operations**: All resources are read-only and don't modify system state
- **Sandboxed Execution**: Only accesses local system information and current directory

## Requirements

- **Node.js**: Version 12.0.0 or higher
- **Platform**: Cross-platform (Windows, macOS, Linux)

## Logging

The server logs activities to `mcp_server_node.log` in the current working directory. This keeps stdout clean for MCP protocol communication while providing debugging information.

## Contributing

This is a simple, self-contained MCP server implementation. Feel free to fork and modify for your specific use cases.

## License

MIT License - see the package.json file for details.

## Related

- [Model Context Protocol Specification](https://spec.modelcontextprotocol.io/)
- [Claude Desktop](https://claude.ai/desktop)
- [MCP Servers Repository](https://github.com/modelcontextprotocol/servers)