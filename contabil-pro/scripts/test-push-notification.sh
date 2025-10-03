#!/bin/bash

# ============================================
# Test Script: send-push-notification
# ============================================
# Testa a Edge Function localmente

set -e

echo "🧪 Testing send-push-notification Edge Function"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Supabase is running
echo "1️⃣  Checking if Supabase is running..."
if ! curl -s http://localhost:54321/rest/v1/ > /dev/null 2>&1; then
    echo -e "${RED}❌ Supabase is not running!${NC}"
    echo "   Run: npx supabase start"
    exit 1
fi
echo -e "${GREEN}✅ Supabase is running${NC}"
echo ""

# Get ANON_KEY from Supabase
echo "2️⃣  Getting ANON_KEY..."
ANON_KEY=$(npx supabase status | grep "anon key" | awk '{print $3}')
if [ -z "$ANON_KEY" ]; then
    echo -e "${RED}❌ Could not get ANON_KEY${NC}"
    exit 1
fi
echo -e "${GREEN}✅ ANON_KEY obtained${NC}"
echo ""

# Check if function is being served
echo "3️⃣  Checking if function is being served..."
echo -e "${YELLOW}   If not, run in another terminal:${NC}"
echo -e "${YELLOW}   npx supabase functions serve send-push-notification --env-file .env.local${NC}"
echo ""
read -p "Press Enter when function is ready..."
echo ""

# Test payload
echo "4️⃣  Preparing test payload..."
PAYLOAD='{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "🧪 Teste de Notificação",
  "message": "Esta é uma notificação de teste do ContabilPRO!",
  "data": {
    "url": "/notificacoes",
    "type": "test",
    "priority": "normal"
  }
}'
echo -e "${GREEN}✅ Payload ready${NC}"
echo ""

# Send request
echo "5️⃣  Sending request to Edge Function..."
echo "   Endpoint: http://localhost:54321/functions/v1/send-push-notification"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" \
  --location \
  --request POST 'http://localhost:54321/functions/v1/send-push-notification' \
  --header "Authorization: Bearer $ANON_KEY" \
  --header 'Content-Type: application/json' \
  --data "$PAYLOAD")

# Extract HTTP status code and body
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "6️⃣  Response:"
echo "   HTTP Status: $HTTP_CODE"
echo "   Body:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

# Check result
if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Test PASSED!${NC}"
    echo ""
    echo "📊 Summary:"
    echo "$BODY" | jq -r '"   Sent: \(.sent_count), Failed: \(.failed_count)"' 2>/dev/null || echo "   Check response above"
    exit 0
else
    echo -e "${RED}❌ Test FAILED!${NC}"
    echo "   Expected HTTP 200, got $HTTP_CODE"
    exit 1
fi

