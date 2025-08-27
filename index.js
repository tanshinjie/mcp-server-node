#!/usr/bin/env node
const readline = require('readline');
const fs = require('fs');

// --- Logger Setup ---
// We'll log to a file to keep stdout clean for MCP messages.
const logStream = fs.createWriteStream('mcp_server_node.log', { flags: 'a' });
const log = (level, message) => {
    const timestamp = new Date().toISOString();
    logStream.write(`[${timestamp}] [${level.toUpperCase()}] ${message}\n`);
};

class MCPServer {
    /**
     * A simple MCP (Multi-Client Protocol) server in Node.js that communicates over stdio.
     * It handles JSON-RPC 2.0 messages for MCP negotiations and resource reporting.
     */
    constructor() {
        /** @private */
        // Define which packages are supported and their enabled status
        this.supportedPackages = {
            'mcp-negotiate': false,
            'dns-com-vmoo-client-info': false,
            'mcp-resource-status': false,
        };

        /** @private */
        // Mock resource data
        this.resources = {
            cpu: 0.5,
            memory: { used: 512, total: 2048 },
        };

        log('info', 'MCP Server initialized.');
        this._startResourceSimulation();
    }
    
    /**
     * @private
     * Simulates resource usage changing over time.
     */
    _startResourceSimulation() {
        setInterval(() => {
            // Fluctuate CPU usage
            this.resources.cpu = Math.random();
            // Fluctuate memory usage
            this.resources.memory.used = 100 + Math.floor(Math.random() * (this.resources.memory.total - 200));
            
            // If the package is enabled, send a notification
            if (this.supportedPackages['mcp-resource-status']) {
                this.sendNotification('mcp.resource.status', this.resources);
            }
        }, 5000); // Update every 5 seconds
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
        const handlerName = `handle_${method.replace(/\./g, '_')}`;
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
     * Handles the 'mcp.version' request from the client.
     * @param {string|number|null} msgId
     * @param {object} params
     */
    handle_mcp_version(msgId, params) {
        log('info', `Handling mcp.version with params: ${JSON.stringify(params)}`);
        const responseParams = {
            version: '2.1',
            min_version: '2.1',
            packages: {
                'mcp-negotiate': '1.0',
                'dns-com-vmoo-client-info': '1.0',
                'mcp-resource-status': '1.0' // Advertise the new package
            },
        };
        this.sendResponse(msgId, responseParams);

        this.sendNotification('dns-com-vmoo-client-info', {
            name: 'Node.js MCP Server with Resources',
            version: '0.2',
        });
    }

    /**
     * Handles the 'mcp.negotiate' request.
     * @param {string|number|null} msgId
     * @param {object} params
     */
    handle_mcp_negotiate(msgId, params) {
        log('info', `Handling mcp.negotiate with params: ${JSON.stringify(params)}`);
        const packagesToEnable = params.packages || [];

        for (const pkg of packagesToEnable) {
            if (this.supportedPackages.hasOwnProperty(pkg)) {
                this.supportedPackages[pkg] = true; // Enable the package
                log('info', `Package '${pkg}' enabled.`);
            } else {
                log('warn', `Client requested unsupported package: ${pkg}`);
            }
        }

        this.sendResponse(msgId, {});
    }
    
    /**
     * Handles the 'mcp.resource.status' request.
     * @param {string|number|null} msgId
     * @param {object} params
     */
    handle_mcp_resource_status(msgId, params) {
        log('info', `Handling mcp.resource.status request.`);
        if (!this.supportedPackages['mcp-resource-status']) {
            this.sendError(msgId, -32001, 'Package mcp-resource-status not negotiated.');
            return;
        }
        // Respond with the current resource status
        this.sendResponse(msgId, this.resources);
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