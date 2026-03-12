#!/bin/bash

# CORS Fix Verification Script
# Run this after deploying to Render to verify CORS is working

echo "🔍 CORS Fix Verification Script"
echo "================================"
echo ""

BACKEND_URL="https://backend-lexilearn.onrender.com"
FRONTEND_URL="https://lexilearn-lige.onrender.com"

echo "Backend URL: $BACKEND_URL"
echo "Frontend URL: $FRONTEND_URL"
echo ""

# Test 1: Health Check
echo "📋 Test 1: Health Check"
echo "------------------------"
curl -s "$BACKEND_URL/health" | jq '.'
echo ""

# Test 2: CORS Test Endpoint
echo "📋 Test 2: CORS Test Endpoint"
echo "------------------------------"
curl -s -H "Origin: $FRONTEND_URL" "$BACKEND_URL/api/cors-test" | jq '.'
echo ""

# Test 3: Preflight Request (OPTIONS)
echo "📋 Test 3: Preflight Request (OPTIONS)"
echo "---------------------------------------"
curl -s -X OPTIONS \
  -H "Origin: $FRONTEND_URL" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization" \
  -v "$BACKEND_URL/api/teachers/assessments" 2>&1 | grep -i "access-control"
echo ""

# Test 4: Teacher Assessments Endpoint
echo "📋 Test 4: Teacher Assessments Endpoint (requires auth)"
echo "--------------------------------------------------------"
echo "Note: This will fail without a valid token, but should show CORS headers"
curl -s -H "Origin: $FRONTEND_URL" \
  -H "Authorization: Bearer test-token" \
  -v "$BACKEND_URL/api/teachers/assessments" 2>&1 | grep -i "access-control"
echo ""

# Test 5: AI Chat Conversations Endpoint
echo "📋 Test 5: AI Chat Conversations Endpoint (requires auth)"
echo "----------------------------------------------------------"
curl -s -H "Origin: $FRONTEND_URL" \
  -H "Authorization: Bearer test-token" \
  -v "$BACKEND_URL/api/ai-chat/all-conversations" 2>&1 | grep -i "access-control"
echo ""

# Test 6: Auth Register Endpoint
echo "📋 Test 6: Auth Register Endpoint"
echo "----------------------------------"
curl -s -X POST \
  -H "Origin: $FRONTEND_URL" \
  -H "Content-Type: application/json" \
  -v "$BACKEND_URL/api/auth/register" 2>&1 | grep -i "access-control"
echo ""

echo "================================"
echo "✅ Verification Complete"
echo ""
echo "Expected Results:"
echo "- All requests should show 'Access-Control-Allow-Origin: $FRONTEND_URL'"
echo "- All requests should show 'Access-Control-Allow-Credentials: true'"
echo "- OPTIONS requests should return 200 OK"
echo ""
echo "If you see these headers, CORS is configured correctly! 🎉"
