namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';

    PORT: number;
    CORS: string;

    DATABASE_HOST: string;
    DATABASE_PORT: number;
    DATABASE_USER: string;
    DATABASE_PASSWORD: string;
    DATABASE_NAME: string;

    CACHE_TTL: number;
    CACHE_MAX_ITEMS: number;
    CACHE_TIMEOUT: number;

    RATE_TTL: number;
    RATE_LIM: number;

    JWT_SECRET: string;
    JWT_EXPIRATION_TIME: number;

    ADMIN_USERNAME: string;
    ADMIN_PASSWORD: string;

    PROJECT_SETTINGS: string;
    SENTRY_DSN: string;
    INFURA_API_KEY: string;
    ETHERSCAN_API_KEY: string;
    BSCSCAN_API_KEY: string;
    POLYGONSCAN_API_KEY: string;
    CRYPTOCOMPARE_API_KEY: string;
    DEVELOPMENT_ENV: boolean;

    PROJECT_NAME: string;

    SENTRY_DSN: string;
    INFURA_API_KEY: string;
    ETHERSCAN_API_KEY: string;
    BSCSCAN_API_KEY: string;
    POLYGONSCAN_API_KEY: string;
    CRYPTOCOMPARE_API_KEY: string;
    DEVELOPMENT_ENV: boolean;
  }
}
