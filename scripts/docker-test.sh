#!/bin/bash
set -e

echo "Starting Docker-based tests for feathers-mongoose..."

# Clean up any existing containers
docker-compose down -v

echo "Building and starting services..."
# Build and start services
docker-compose up --build -d

echo "Waiting for MongoDB to be ready..."
docker-compose exec -T mongo mongosh --eval "db.adminCommand('ping')" --quiet

# Initialize replica set
echo "Initializing MongoDB replica set..."
docker-compose exec -T mongo mongosh --eval "try { rs.initiate({_id: 'rs0', members: [{_id: 0, host: '127.0.0.1:27017'}]}); } catch(e) { if (e.message.includes('already initialized')) { print('Replica set already initialized'); } else { throw e; } }" --quiet

# Wait for replica set to be ready
echo "Waiting for replica set to be ready..."
sleep 5
docker-compose exec -T mongo mongosh --eval "rs.status()" --quiet

echo "Running tests..."
# Run the tests
docker-compose run --rm app

# Capture the exit code
TEST_EXIT_CODE=$?

echo "Cleaning up..."
# Clean up
docker-compose down -v

echo "Tests completed with exit code: $TEST_EXIT_CODE"
exit $TEST_EXIT_CODE
