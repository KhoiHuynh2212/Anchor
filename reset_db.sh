#!/bin/bash

echo "🗑️  Reset Database"
echo "================="
echo "This will DELETE ALL DATA and start fresh."
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "Cancelled."
  exit 0
fi

echo -e "\nDropping database..."
mongosh accountability_ai --eval "db.dropDatabase()"

echo -e "\n✅ Database reset!"
echo "Restart the backend to recreate indexes."
echo "Register a new user to start fresh."
