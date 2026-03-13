#!/bin/bash

# Monitor Render Deployment and Test CORS
# Run this script to check if deployment is complete and CORS is working

BACKEND_URL="https://backend-lexilearn.onrender.com"
FRONTEND_URL="https://lexilearn-lige.onrender.com"

echo "🔍 Monitoring Render Deployment"
echo "================================"
echo ""
echo "Backend: $BACKEND_URL"
echo "Frontend: $FRONTEND_URL"
echo ""

# Function to test CORS
test_cors() {
    echo "📋 Testing CORS..."
    echo ""
    
    # Test 1: Health check
    echo "1. Health Check:"
    curl -s "$BACKEND_URL/health" | grep -q "success" && echo "   ✅ Server is running" || echo "   ❌ Server not responding"
    echo ""
    
    # Test 2: CORS test endpoint
    echo "2. CORS Test Endpoint:"
    RESPONSE=$(curl -s -H "Origin: $FRONTEND_URL" "$BACKEND_URL/api/cors-test")
    echo "$RESPONSE" | grep -q "CORS is working correctly" && echo "   ✅ CORS test passed" || echo "   ❌ CORS test failed"
    echo ""
    
    # Test 3: Check CORS headers
    echo "3. CORS Headers Check:"
    HEADERS=$(curl -s -I -H "Origin: $FRONTEND_URL" "$BACKEND_URL/api/cors-test")
    echo "$HEADERS" | grep -i "access-control-allow-origin" && echo "   ✅ CORS headers present" || echo "   ❌ CORS headers missing"
    echo ""
    
    # Test 4: Preflight request
    echo "4. Preflight Request (OPTIONS):"
    PREFLIGHT=$(curl -s -I -X OPTIONS \
        -H "Origin: $FRONTEND_URL" \
        -H "Access-Control-Request-Method: GET" \
        -H "Access-Control-Request-Headers: Authorization" \
        "$BACKEND_URL/api/teachers/assessments")
    echo "$PREFLIGHT" | grep -i "access-control-allow-origin" && echo "   ✅ Preflight successful" || echo "   ❌ Preflight failed"
    echo ""
}

# Monitor loop
echo "⏳ Waiting for deployment to complete..."
echo "   (This usually takes 2-5 minutes)"
echo ""

COUNTER=0
MAX_ATTEMPTS=30

while [ $COUNTER -lt $MAX_ATTEMPTS ]; do
    COUNTER=$((COUNTER+1))
    echo "Attempt $COUNTER/$MAX_ATTEMPTS..."
    
    # Check if server is responding
    if curl -s "$BACKEND_URL/health" | grep -q "success"; then
        echo ""
        echo "✅ Server is responding!"
        echo ""
        test_cors
        
        # Check if CORS is working
        if curl -s -H "Origin: $FRONTEND_URL" "$BACKEND_URL/api/cors-test" | grep -q "CORS is working correctly"; then
            echo "================================"
            echo "🎉 DEPLOYMENT SUCCESSFUL!"
            echo "================================"
            echo ""
            echo "✅ Server is running"
            echo "✅ CORS is configured correctly"
            echo "✅ Ready to test Teacher Dashboard"
            echo ""
            echo "Next steps:"
            echo "1. Open: $FRONTEND_URL/teacher-dashboard"
            echo "2. Check browser console (should be no CORS errors)"
            echo "3. Verify data loads correctly"
            exit 0
        fi
    fi
    
    sleep 10
done

echo ""
echo "⚠️  Deployment taking longer than expected"
echo ""
echo "Please check:"
echo "1. Render Dashboard for deployment status"
echo "2. Render logs for any errors"
echo "3. Try manual deploy if needed"

