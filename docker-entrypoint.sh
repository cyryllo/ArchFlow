#!/bin/sh

# Start Node.js backend if server storage is enabled
if [ "$ENABLE_SERVER_STORAGE" = "true" ]; then
    echo "Starting ArchFlow backend server..."
    cd /app/packages/fossflow-backend
    node server.js &
    echo "Backend server started"
else
    echo "Server storage disabled, backend not started"
fi

# Start the MCP server for AI assistants when a token is set. It saves
# through the backend, so it needs server storage.
if [ -n "$MCP_TOKEN" ]; then
    if [ "$ENABLE_SERVER_STORAGE" = "true" ]; then
        echo "Starting ArchFlow MCP server at /mcp..."
        cd /app/packages/archflow-mcp
        ARCHFLOW_URL="http://127.0.0.1:${BACKEND_PORT:-3001}" node dist/index.js --http --port "${MCP_PORT:-3002}" --host 127.0.0.1 &
    else
        echo "MCP_TOKEN is set, but the MCP server needs server storage (ENABLE_SERVER_STORAGE=true) - not started"
    fi
else
    echo "MCP server off (set MCP_TOKEN to turn it on)"
fi

# Start nginx
echo "Starting nginx..."
nginx -g "daemon off;"