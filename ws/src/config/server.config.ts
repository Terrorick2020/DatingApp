const PORT: number = Number(process.env.PORT) ?? 7000;
const MODE: string = process.env.MODE ?? 'dev';

const CORS_ORIGIN: string = process.env.CORS_ORIGIN ?? '*';

export default () => ({
    PORT,
    MODE,
    CORS_ORIGIN,
});
