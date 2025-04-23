const API_HOST: string = process.env.API_HOST ?? '';
const API_PORT: number = Number(process.env.API_PORT);

const CHATS_ENDPOINT: string = process.env.CHATS_ENDPOINT ?? '';
const MSGS_ENDPOINT: string  = process.env.MSGS_ENDPOINT ?? '';

if(
    !API_HOST       ||
    isNaN(API_PORT) ||
    !CHATS_ENDPOINT ||
    !MSGS_ENDPOINT
) {
    throw new Error('Some environment variables are missing!');
}

export default () => ({
    API_HOST,
    API_PORT,
    CHATS_ENDPOINT,
    MSGS_ENDPOINT,
});
