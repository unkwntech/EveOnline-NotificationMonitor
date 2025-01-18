module.exports = {
    apps: [
        {
            name: "Notification-Monitor-Backened",
            script: "main.js",
            time: true,
            instances: 1,
            autorestart: true,
            max_restarts: 50,
            watch: false,
            max_memory_restart: "1G",
        },
    ],
    deploy: {
        production: {
            user: "github",
            host: "ibns.tech",
            key: "deploy.key",
            ref: "origin/main",
            repo: "git@github.com:unkwntech/EveOnline-NotificationMonitor.git",
            path: "/var/projects/notifications-backend-prod/",
            "post-deploy":
                "npm i && pm2 reload ecosystem.config.js --env production --force && pm2 save",
            env: {
                NODE_ENV: "production",
            },
        },
        staging: {
            user: "github",
            host: "ibns.tech",
            key: "deploy.key",
            ref: "origin/main",
            repo: "git@github.com:unkwntech/NotificationMonitor.git",
            path: "/var/projects/notifications-backend-stage",
            "post-deploy":
                "npm i && pm2 reload ecosystem.config.js --env staging --force && pm2 save",
            env: {
                NODE_ENV: "staging",
            },
        },
    },
};
