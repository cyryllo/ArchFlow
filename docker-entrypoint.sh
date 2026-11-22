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

# Start the MCP server for AI assistants. It saves through the backend, so it
# needs server storage. With logins (AUTH_MODE=local) people use their own
# ArchFlow tokens; without logins one shared MCP_TOKEN turns it on.
MCP_ARGS=""
if [ "$ENABLE_SERVER_STORAGE" = "true" ] && [ "$AUTH_MODE" = "local" ]; then
    MCP_ARGS="--auth archflow"
    echo "Starting ArchFlow MCP server at /mcp (personal tokens from ArchFlow accounts)..."
elif [ -n "$MCP_TOKEN" ] && [ "$ENABLE_SERVER_STORAGE" = "true" ]; then
    echo "Starting ArchFlow MCP server at /mcp (MCP_TOKEN)..."
elif [ -n "$MCP_TOKEN" ]; then
    echo "MCP_TOKEN is set, but the MCP server needs server storage (ENABLE_SERVER_STORAGE=true) - not started"
else
    echo "MCP server off (set MCP_TOKEN, or turn on logins with AUTH_MODE=local)"
fi
if [ -n "$MCP_ARGS" ] || { [ -n "$MCP_TOKEN" ] && [ "$ENABLE_SERVER_STORAGE" = "true" ]; }; then
    cd /app/packages/archflow-mcp
    ARCHFLOW_URL="http://127.0.0.1:${BACKEND_PORT:-3001}" node dist/index.js --http --port "${MCP_PORT:-3002}" --host 127.0.0.1 $MCP_ARGS &
fi

# Start nginx
echo "Starting nginx..."
nginx -g "daemon off;"