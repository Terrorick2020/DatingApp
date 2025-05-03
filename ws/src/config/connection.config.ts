const API_HOST: string = process.env.API_HOST ?? 'localhost'
const CHATS_PORT: number = Number(process.env.CHATS_PORT) || 3001
const MSGS_PORT: number = Number(process.env.MSGS_PORT) || 3002
const LIKE_PORT: number = Number(process.env.LIKE_PORT) || 3003
const COMPLAINT_PORT: number = Number(process.env.COMPLAINT_PORT) || 3004

// if (!API_HOST || isNaN(CHATS_PORT) || isNaN(MSGS_PORT) || isNaN(LIKE_PORT)) {
// 	throw new Error('Some environment variables are missing!')
// }

export default () => ({
	API_HOST,
	CHATS_PORT,
	MSGS_PORT,
	LIKE_PORT,
    COMPLAINT_PORT
})
