module.exports = {
  apps: [{
    name: 'fundedworker-backend',
    script: './backend/server.full.js',
    cwd: '/workspace/cmivy376600jxilr3ndils778/FundedWorkerFlow',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'development',
      BACKEND_PORT: 5001
    },
    error_file: './logs/backend-error.log',
    out_file: './logs/backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000
  }]
}
