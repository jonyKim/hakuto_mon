module.exports = {
  apps: [
    {
      name: 'lfit-admin-front',
      script: 'npm',
      args: 'start',
      cwd: '/home/ubuntu/tmp/lfit_admin/front',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
};
