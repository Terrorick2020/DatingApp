const API_TCP_HOST: string = process.env.API_HOST ?? 'localhost';
const API_TCP_PORT: number = Number(process.env.API_TCP_PORT) || 8855;

if (!API_TCP_HOST || isNaN(API_TCP_PORT)) {
	throw new Error('Some environment variables are missing!')
}

export default () => ({
	API_TCP_HOST,
	API_TCP_PORT,
});
