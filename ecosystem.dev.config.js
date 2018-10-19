module.exports = {
  apps : [
    {
      name: 'server',
      script: 'bin/www.ts',
      node_args: "-r tsconfig-paths/register",
      interpreter: `${__dirname}/node_modules/.bin/ts-node`,
      watch: ['bin/www.ts', 'src/**/*'],
      ignore_watch: ['**/*.spec.ts'],
      env: {
        TS_NODE_FILES: true,
        NODE_ENV: 'development'
      },
      kill_timeout: 10000,
    },
  ],
};
