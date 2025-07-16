#!/bin/bash
set -e

# Add mongodb to hosts file
echo "Adding mongodb to hosts file..."
echo "127.0.0.1 mongodb" >> /etc/hosts

# Print hosts file for debugging
echo "Contents of /etc/hosts:"
cat /etc/hosts

# Execute the command passed to docker-entrypoint
exec "$@"
