# 🔐 Security Guide

## **CRITICAL SECURITY REQUIREMENTS**

### **Environment Variables Setup**

**NEVER commit real credentials to Git!**

1. **Create `.env` file locally:**
```bash
# Copy template
cp .env.example .env

# Edit with real values
nano .env
```

2. **Required Environment Variables:**
```env
# Database (REQUIRED)
DATABASE_URL=postgresql://username:password@host:port/database
POSTGRES_DB=your_database_name
POSTGRES_USER=your_database_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_PORT=5432

# Admin Authentication (REQUIRED)
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_secure_admin_password

# Security (REQUIRED)
JWT_SECRET=your_very_long_random_secret_key_here

# WebSocket (OPTIONAL)
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

### **Production Security Checklist**

#### **✅ Before Deployment:**
- [ ] Change default admin credentials
- [ ] Generate strong JWT secret (32+ characters)
- [ ] Use strong database password
- [ ] Disable database port exposure in production
- [ ] Set up HTTPS/TLS
- [ ] Configure firewall rules
- [ ] Set up monitoring and logging

#### **✅ Docker Security:**
- [ ] Use Docker secrets for production
- [ ] Don't expose database ports
- [ ] Use non-root user in containers
- [ ] Scan images for vulnerabilities
- [ ] Keep base images updated

#### **✅ Application Security:**
- [ ] Validate all user input
- [ ] Implement rate limiting
- [ ] Add CORS policies
- [ ] Use HTTPS in production
- [ ] Log security events

### **Security Best Practices**

#### **🔐 Password Requirements:**
- Minimum 12 characters
- Mix of uppercase, lowercase, numbers, symbols
- No common words or patterns
- Unique for each service

#### **🔑 JWT Secret Requirements:**
- Minimum 32 characters
- Random and unpredictable
- Different for each environment
- Rotate regularly

#### **🌐 Network Security:**
- Use HTTPS in production
- Configure proper CORS
- Implement rate limiting
- Monitor for suspicious activity

### **Emergency Security Procedures**

#### **If Credentials Are Compromised:**
1. **Immediately change all passwords**
2. **Rotate JWT secrets**
3. **Review access logs**
4. **Update environment variables**
5. **Notify stakeholders**

#### **Security Monitoring:**
- Monitor failed login attempts
- Watch for unusual database access
- Check for unauthorized WebSocket connections
- Review error logs regularly

### **Development Security**

#### **Local Development:**
```bash
# Use different credentials for development
ADMIN_USERNAME=dev_admin
ADMIN_PASSWORD=dev_password_123
JWT_SECRET=dev_secret_key_123
```

#### **Testing Security:**
- Never use production credentials in tests
- Use separate test database
- Mock external services
- Test authentication flows

### **Deployment Security**

#### **Linux Production:**
```bash
# Set secure environment variables
export DATABASE_URL="postgresql://user:pass@host:5432/db"
export JWT_SECRET="your-very-long-random-secret"
export ADMIN_PASSWORD="strong-admin-password"

# Start with security
docker-compose up -d
```

#### **Windows Production:**
```powershell
# Set secure environment variables
$env:DATABASE_URL="postgresql://user:pass@host:5432/db"
$env:JWT_SECRET="your-very-long-random-secret"
$env:ADMIN_PASSWORD="strong-admin-password"

# Start with security
docker-compose up -d
```

### **Security Contacts**

**For security issues:**
- Report immediately to system administrator
- Document the incident
- Follow incident response procedures
- Update security measures as needed

---

**⚠️ REMEMBER: Security is everyone's responsibility!** 