#!/bin/bash

# Test SSE endpoint for gmeet-quiz game events
# Usage: ./scripts/curl.sh

echo "Testing SSE endpoint at http://localhost:3000/events"
echo "Press Ctrl+C to stop"
echo ""

curl -N -H "Accept: text/event-stream" -H "Cache-Control: no-cache" http://localhost:3000/events