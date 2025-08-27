#!/usr/bin/env node
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const os = require('os');

// --- Logger Setup ---
// We'll log to a file to keep stdout clean for MCP messages.
const logStream = fs.createWriteStream('mcp_server_node.log', { flags: 'a' });
const log = (level, message) => {
    const timestamp = new Date().toISOString();
    logStream.write(`[${timestamp}] [${level.toUpperCase()}] ${message}\n`);
};

class MCPServer {
    /**
     * A comprehensive MCP (Model Context Protocol) server that exposes multiple resource types.
     * Provides access to files, directories, system information, and generated content.
     */
    constructor() {
        /** @private */
        this.resources = new Map();
        
        log('info', 'MCP Server initialized.');
        this._initializeResources();
    }
    
    /**
     * @private
     * Initialize all available resources
     */
    _initializeResources() {
        // File system resources
        this._registerFileResources();
        
        // System information resources
        this._registerSystemResources();
        
        // Generated content resources
        this._registerGeneratedResources();
        
        // Configuration resources
        this._registerConfigResources();
    }

    /**
     * @private
     * Register file system related resources
     */
    _registerFileResources() {
        this.resources.set('file://current-directory', {
            uri: 'file://current-directory',
            name: 'Current Directory Listing',
            description: 'Lists files and directories in the current working directory',
            mimeType: 'application/json',
            getData: () => {
                try {
                    const cwd = process.cwd();
                    const items = fs.readdirSync(cwd).map(item => {
                        const fullPath = path.join(cwd, item);
                        const stats = fs.statSync(fullPath);
                        return {
                            name: item,
                            type: stats.isDirectory() ? 'directory' : 'file',
                            size: stats.isFile() ? stats.size : null,
                            modified: stats.mtime.toISOString()
                        };
                    });
                    return JSON.stringify({ path: cwd, items }, null, 2);
                } catch (error) {
                    return JSON.stringify({ error: error.message });
                }
            }
        });

        this.resources.set('file://package-info', {
            uri: 'file://package-info',
            name: 'Package Information',
            description: 'Information from package.json if it exists',
            mimeType: 'application/json',
            getData: () => {
                try {
                    const packagePath = path.join(process.cwd(), 'package.json');
                    if (fs.existsSync(packagePath)) {
                        const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
                        return JSON.stringify(packageData, null, 2);
                    }
                    return JSON.stringify({ message: 'No package.json found' });
                } catch (error) {
                    return JSON.stringify({ error: error.message });
                }
            }
        });
    }

    /**
     * @private
     * Register system information resources
     */
    _registerSystemResources() {
        this.resources.set('system://info', {
            uri: 'system://info',
            name: 'System Information',
            description: 'Basic system information including OS, architecture, and Node.js version',
            mimeType: 'application/json',
            getData: () => {
                return JSON.stringify({
                    platform: os.platform(),
                    architecture: os.arch(),
                    nodeVersion: process.version,
                    hostname: os.hostname(),
                    uptime: os.uptime(),
                    totalMemory: os.totalmem(),
                    freeMemory: os.freemem(),
                    cpuCount: os.cpus().length,
                    loadAverage: os.loadavg(),
                    userInfo: os.userInfo(),
                    timestamp: new Date().toISOString()
                }, null, 2);
            }
        });

        this.resources.set('system://env', {
            uri: 'system://env',
            name: 'Environment Variables',
            description: 'Non-sensitive environment variables',
            mimeType: 'application/json',
            getData: () => {
                // Filter out sensitive environment variables
                const filteredEnv = Object.keys(process.env)
                    .filter(key => !key.toLowerCase().includes('password') && 
                                 !key.toLowerCase().includes('secret') &&
                                 !key.toLowerCase().includes('key') &&
                                 !key.toLowerCase().includes('token'))
                    .reduce((obj, key) => {
                        obj[key] = process.env[key];
                        return obj;
                    }, {});
                
                return JSON.stringify(filteredEnv, null, 2);
            }
        });
    }

    /**
     * @private
     * Register generated content resources
     */
    _registerGeneratedResources() {
        this.resources.set('generated://lorem', {
            uri: 'generated://lorem',
            name: 'Lorem Ipsum Text',
            description: 'Generated Lorem Ipsum placeholder text',
            mimeType: 'text/plain',
            getData: () => {
                const sentences = [
                    'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
                    'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
                    'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
                    'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum.',
                    'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia.',
                    'Deserunt mollit anim id est laborum sed ut perspiciatis unde omnis.',
                    'Iste natus error sit voluptatem accusantium doloremque laudantium.',
                    'Totam rem aperiam eaque ipsa quae ab illo inventore veritatis.'
                ];
                
                const paragraphCount = Math.floor(Math.random() * 3) + 2;
                const paragraphs = [];
                
                for (let i = 0; i < paragraphCount; i++) {
                    const sentenceCount = Math.floor(Math.random() * 4) + 3;
                    const paragraph = [];
                    
                    for (let j = 0; j < sentenceCount; j++) {
                        paragraph.push(sentences[Math.floor(Math.random() * sentences.length)]);
                    }
                    
                    paragraphs.push(paragraph.join(' '));
                }
                
                return paragraphs.join('\n\n');
            }
        });

        this.resources.set('generated://data', {
            uri: 'generated://data',
            name: 'Sample Data',
            description: 'Generated sample data in various formats',
            mimeType: 'application/json',
            getData: () => {
                const users = [];
                const firstNames = ['John', 'Jane', 'Bob', 'Alice', 'Charlie', 'Diana', 'Eve', 'Frank'];
                const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
                
                for (let i = 0; i < 5; i++) {
                    users.push({
                        id: i + 1,
                        firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
                        lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
                        email: `user${i + 1}@example.com`,
                        age: Math.floor(Math.random() * 50) + 18,
                        active: Math.random() > 0.3,
                        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
                    });
                }
                
                return JSON.stringify({
                    users,
                    meta: {
                        total: users.length,
                        generated: new Date().toISOString()
                    }
                }, null, 2);
            }
        });
    }

    /**
     * @private
     * Register configuration resources
     */
    _registerConfigResources() {
        this.resources.set('config://mcp-server', {
            uri: 'config://mcp-server',
            name: 'MCP Server Configuration',
            description: 'Current MCP server configuration and capabilities',
            mimeType: 'application/json',
            getData: () => {
                return JSON.stringify({
                    version: '1.0.0',
                    capabilities: {
                        resources: true,
                        prompts: false,
                        tools: false
                    },
                    resourceCount: this.resources.size,
                    supportedProtocols: ['stdio'],
                    started: new Date().toISOString()
                }, null, 2);
            }
        });
    }


    /**
     * Sends a JSON-RPC response to the client via stdout.
     * @param {string|number|null} msgId - The ID of the original request message.
     * @param {object} result - The result payload to be sent back.
     */
    sendResponse(msgId, result) {
        const response = {
            jsonrpc: '2.0',
            id: msgId,
            result: result,
        };
        this._sendMessage(response);
        log('info', `Sent response for ID ${msgId}: ${JSON.stringify(result)}`);
    }

    /**
     * Sends a JSON-RPC notification to the client via stdout.
     * @param {string} method - The method name of the notification.
     * @param {object} params - The parameters of the notification.
     */
    sendNotification(method, params) {
        const notification = {
            jsonrpc: '2.0',
            method: method,
            params: params,
        };
        this._sendMessage(notification);
        log('info', `Sent notification ${method}: ${JSON.stringify(params)}`);
    }

    /**
     * Sends a JSON-RPC error to the client via stdout.
     * @param {string|number|null} msgId - The ID of the original request message.
     * @param {number} code - The JSON-RPC error code.
     * @param {string} message - A string describing the error.
     */
    sendError(msgId, code, message) {
        const errorResponse = {
            jsonrpc: '2.0',
            id: msgId,
            error: {
                code: code,
                message: message,
            },
        };
        this._sendMessage(errorResponse);
        log('error', `Sent error for ID ${msgId}: ${message} (code: ${code})`);
    }

    /**
     * @private
     * Internal method to serialize a message to JSON and write to stdout.
     * @param {object} message - The dictionary object representing the JSON-RPC message.
     */
    _sendMessage(message) {
        try {
            const messageStr = JSON.stringify(message);
            // MCP messages are terminated by a newline
            process.stdout.write(messageStr + '\n');
        } catch (e) {
            log('error', `Failed to serialize message: ${JSON.stringify(message)}. Error: ${e.message}`);
        }
    }

    /**
     * Parses and processes a single JSON-RPC message from the client.
     * @param {string} messageStr - The raw string received from stdin.
     */
    handleMessage(messageStr) {
        log('debug', `Received raw message: ${messageStr.trim()}`);
        let message;
        try {
            message = JSON.parse(messageStr);
        } catch (e) {
            log('error', `Failed to decode JSON: ${messageStr}`);
            this.sendError(null, -32700, 'Parse error');
            return;
        }

        const { id: msgId, method, params = {} } = message;

        if (!method) {
            this.sendError(msgId, -32600, "Invalid Request: 'method' is missing");
            return;
        }

        // Route the request to the appropriate handler
        const handlerName = `handle_${method.replace(/[\.\/]/g, '_')}`;
        const handler = this[handlerName];

        if (typeof handler === 'function') {
            try {
                handler.call(this, msgId, params);
            } catch (e) {
                log('error', `Error handling method ${method}: ${e.message}`);
                this.sendError(msgId, -32000, `Server error: ${e.message}`);
            }
        } else {
            log('warn', `No handler found for method: ${method}`);
            this.sendError(msgId, -32601, `Method not found: ${method}`);
        }
    }

    /**
     * Handles the 'initialize' request from the client.
     * @param {string|number|null} msgId
     * @param {object} params
     */
    handle_initialize(msgId, params) {
        log('info', `Handling initialize with params: ${JSON.stringify(params)}`);
        const responseParams = {
            protocolVersion: "2024-11-05",
            capabilities: {
                resources: {
                    subscribe: false,
                    listChanged: false
                }
            },
            serverInfo: {
                name: "Node.js MCP Resource Server",
                version: "1.0.0"
            }
        };
        this.sendResponse(msgId, responseParams);
    }

    /**
     * Handles the 'resources/list' request.
     * @param {string|number|null} msgId
     * @param {object} params
     */
    handle_resources_list(msgId, params) {
        log('info', `Handling resources/list request.`);
        const resourceList = Array.from(this.resources.values()).map(resource => ({
            uri: resource.uri,
            name: resource.name,
            description: resource.description,
            mimeType: resource.mimeType
        }));
        
        this.sendResponse(msgId, { resources: resourceList });
    }

    /**
     * Handles the 'resources/read' request.
     * @param {string|number|null} msgId
     * @param {object} params
     */
    handle_resources_read(msgId, params) {
        log('info', `Handling resources/read with params: ${JSON.stringify(params)}`);
        const { uri } = params;
        
        if (!uri) {
            this.sendError(msgId, -32602, 'Missing required parameter: uri');
            return;
        }

        const resource = this.resources.get(uri);
        if (!resource) {
            this.sendError(msgId, -32001, `Resource not found: ${uri}`);
            return;
        }

        try {
            const content = resource.getData();
            this.sendResponse(msgId, {
                contents: [{
                    uri: resource.uri,
                    mimeType: resource.mimeType,
                    text: content
                }]
            });
        } catch (error) {
            log('error', `Error reading resource ${uri}: ${error.message}`);
            this.sendError(msgId, -32000, `Failed to read resource: ${error.message}`);
        }
    }


    /**
     * Starts the main server loop, reading messages from stdin.
     */
    run() {
        log('info', 'Server is running. Waiting for messages from stdin.');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: false
        });

        rl.on('line', (line) => {
            this.handleMessage(line);
        });

        rl.on('close', () => {
            log('info', 'Server stdin stream closed. Shutting down.');
        });
        
        process.on('SIGINT', () => {
            log('info', 'Caught interrupt signal. Shutting down.');
            process.exit();
        });
    }
}

if (require.main === module) {
    const server = new MCPServer();
    server.run();
}