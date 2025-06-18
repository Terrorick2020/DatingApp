const PORT: number = Number(process.env.PORT) ?? 7000;
const MODE: string = process.env.MODE ?? 'dev';

const TCP_HOST: string = process.env.TCP_HOST ?? 'localhost';
const TCP_PORT: number = Number(process.env.TCP_PORT) ?? 7755;

const CORS_ORIGIN: string = process.env.CORS_ORIGIN ?? '*';

export default () => ({
    PORT,
    MODE,
    TCP_HOST,
    TCP_PORT,
    CORS_ORIGIN,
});
