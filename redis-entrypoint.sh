#!/bin/sh
set -e

# Create redis.conf from env variables
cat > /tmp/redis.conf << EOF
requirepass ${REDIS_PASSWORD}
maxmemory ${REDIS_MAXMEMORY}
appendonly ${REDIS_APPENDONLY}
save ${REDIS_SAVE}
EOF

# Start redis-server with the generated config
exec redis-server /tmp/redis.conf
