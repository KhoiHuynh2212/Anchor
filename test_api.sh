#!/bin/bash

# Test script for Anchor API
BASE_URL="http://localhost:8000"

echo "🧪 Testing Anchor API"
echo "===================="

# 1. Health check
echo -e "\n✓ Health check:"
curl -s $BASE_URL/health | jq

# 2. Register user (will fail if already exists - that's OK)
echo -e "\n✓ Register test user:"
curl -s -X POST $BASE_URL/auth/sync \
  -H "Content-Type: application/json" \
  | jq

# You'll need a real JWT token from Supabase for the rest
# Get it by logging in via the frontend, then:
# 1. Open browser dev tools
# 2. Application > Local Storage > supabase.auth.token
# 3. Copy the access_token

echo -e "\n💡 To test authenticated endpoints:"
echo "1. Login via frontend"
echo "2. Get JWT from browser/app storage"
echo "3. Export it: export TOKEN='your-jwt-here'"
echo "4. Then run:"
echo "   curl -H 'Authorization: Bearer \$TOKEN' $BASE_URL/auth/me | jq"

echo -e "\n📚 View all endpoints:"
echo "   open $BASE_URL/docs"
