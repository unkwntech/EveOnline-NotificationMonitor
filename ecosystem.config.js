module.exports = {
    apps: [
        {
            name: "NotificationMonitor",
            script: "main.js",
            namespace: "EVE",
        },
    ],
    deploy: {
        production: {
            user: "achapman",
            host: "64.251.22.21",
            path: "/home/achapman/projects/NotificationMonitor/",
            repo: "git@github.com:unkwntech/NotificationMonitor.git",
            ref: "origin/main",
            key: "~/.ssh/id_ed25519",
            "post-deploy":
                "npm i; pm2 reload NotificationMonitor; rm -rf /home/achapman/projects/NotificationMonitor/source/*",
        },
    },
};
