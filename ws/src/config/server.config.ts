const PORT: number = Number(process.env.PORT) ?? 7000;
const MODE: string = process.env.MODE ?? 'dev';

const CORSE_ORIGINE: string = process.env.CORSE_ORIGINE ?? '*';

export default () => ({
    PORT,
    MODE,
    CORSE_ORIGINE,
});
