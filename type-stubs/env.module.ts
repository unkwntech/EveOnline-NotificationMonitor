namespace NodeJS {
    export interface ProcessEnv {
        MONGO_HOST: string;
        MONGO_USER: string;
        MONGO_PASS: string;
        MONGO_OPTS: string;
        MONGO_DBNAME: string;
        ESI_SECRET: string;
        ESI_APPID: string;
        SWAG_PAGE_TITLE: string;
        SWAG_PAGE_DESC: string;
        SWAG_VERSION: string;
        SWAG_HOST: string;
        SWAG_BASE_PATH: string;
        DEFAULT_QUERY_LIMIT: string;
        SSL_ENABLED: string;
        SSL_PKEY: string;
        SSL_CERT: string;
        BACKEND_PORT: string;
        LOG_LEVEL: string;
    }
}
