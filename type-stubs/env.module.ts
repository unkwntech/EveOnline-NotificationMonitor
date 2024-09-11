namespace NodeJS {
    export interface ProcessEnv {
        REDIS_HOST: string;
        REDIS_PORT: string;
        REDIS_PASS: string;
        MONGO_HOST: string;
        MONGO_USER: string;
        MONGO_PASS: string;
        MONGO_OPTS: string;
        MONGO_DBNAME: string;
        ESI_SECRET: string;
        ESI_APPID: string;
    }
}
