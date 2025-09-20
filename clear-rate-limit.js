// Clear rate limit cache script
// Run this if you're getting rate limited during development

const fs = require('fs');
const path = require('path');

// This script clears the in-memory rate limit store
// Since it's in-memory, restarting the server will also clear it

console.log('🔄 Rate limit cache will be cleared when you restart the server');
console.log('📝 To restart the server:');
console.log('   1. Stop the current server (Ctrl+C)');
console.log('   2. Run: npm run dev');
console.log('');
console.log('✅ Rate limiting has been increased for development:');
console.log('   - Development: 100 requests per 15 minutes');
console.log('   - Production: 5 requests per 15 minutes');
console.log('');
console.log('🔧 Connection testing now uses /manifest.json instead of /api/services');
console.log('   This should prevent rate limiting issues during connection tests');
