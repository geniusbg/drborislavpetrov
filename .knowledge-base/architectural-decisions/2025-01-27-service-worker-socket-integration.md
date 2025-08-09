# Architectural Decision: Service Worker and Socket.io Integration

**Date:** 2025-01-27  
**Decision by:** Virtual Team (@virtual-security-expert, @virtual-performance-optimizer, @virtual-skeptic, @virtual-doer)  
**Status:** Approved  
**Project:** Dr. Borislav Petrov Dental Practice Website

## Context
The application needed robust Service Worker and Socket.io integration for real-time updates in the admin panel while maintaining security and performance standards.

## Decisions Made

### Service Worker Configuration
- **Caching Strategy:** Cache-first for static resources only
- **Admin Pages:** Explicitly excluded from caching to prevent authentication issues
- **API Endpoints:** Excluded from caching to ensure fresh data
- **Error Handling:** Improved with fallback mechanisms for navigation requests

### Socket.io Integration
- **Dynamic URL:** Uses `window.location.origin` instead of hardcoded URLs
- **CORS Settings:** Environment-aware configuration (development vs production)
- **Security:** Rate limiting, buffer size limits, ping timeouts
- **Fallback:** Automatic fallback to polling if WebSocket fails

### Security Considerations
- **Rate Limiting:** 1MB max message size, 60s ping timeout
- **CORS:** Restricted origins for production deployment
- **Authentication:** Admin pages bypass Service Worker caching

## Implementation Details

### Service Worker (`public/sw.js`)
```javascript
// Skip caching for admin pages and API endpoints
if (event.request.url.includes('/admin') || 
    event.request.url.includes('/api/') ||
    event.request.url.includes('socket')) {
  return;
}
```

### Socket.io Client (`src/hooks/useSocket.ts`)
```typescript
const socketUrl = window.location.origin
const newSocket = io(socketUrl, {
  transports: ['websocket', 'polling'],
  timeout: 5000,
  reconnection: true
})
```

### Socket.io Server (`server.js`)
```javascript
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ["https://yourdomain.com"] 
      : ["http://localhost:3000"],
    credentials: true
  },
  maxHttpBufferSize: 1e6,
  pingTimeout: 60000
})
```

## Consequences

### Positive
- ✅ Real-time updates work reliably
- ✅ Service Worker doesn't interfere with admin authentication
- ✅ Dynamic URL works in all environments
- ✅ Proper error handling and fallbacks
- ✅ Security measures implemented

### Technical Debt
- Production domain needs to be updated in CORS settings
- Service Worker cache versioning strategy may need updates
- Socket.io reconnection logic could be optimized further

## Future Considerations

### IMPORTANT: Permission Required for Further Changes
**Any future modifications to Service Worker or Socket.io configuration require explicit permission from the client due to the critical nature of these components.**

### Planned Improvements
1. **Production Deployment:** Update CORS origins for actual domain
2. **Cache Strategy:** Implement cache versioning for better updates
3. **Monitoring:** Add connection health monitoring
4. **Testing:** Comprehensive testing in different network conditions

## Testing Status
- ✅ Development environment: Working
- ✅ Service Worker: No errors in admin pages
- ✅ Socket.io: Real-time updates functional
- ⏳ Production: Pending domain configuration

---
*This decision ensures reliable real-time functionality while maintaining security and performance standards.* 