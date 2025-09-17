module.exports = {
  apps: [{
    name: 'drborislavpetrov',
    script: 'server.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // PWA оптимизации
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    // Автоматично рестартиране при промени
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'backups', 'certs'],
    // Логове
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    // Автоматично рестартиране при грешки
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    // Health check
    health_check_grace_period: 3000,
    // PWA специфични настройки
    kill_timeout: 5000,
    listen_timeout: 3000,
    // Environment variables
    env_file: '.env'
  }]
}
