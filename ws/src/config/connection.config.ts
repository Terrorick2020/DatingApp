const API_HOST: string = process.env.API_HOST ?? ''
const CHATS_PORT: number = Number(process.env.CHATS_PORT)
const MSGS_PORT: number = Number(process.env.MSGS_PORT)
const LIKE_PORT: number = Number(process.env.LIKE_PORT)
const COMPLAINT_PORT: number = Number(process.env.COMPLAINT_PORT)

if (!API_HOST || isNaN(CHATS_PORT) || isNaN(MSGS_PORT) || isNaN(LIKE_PORT)) {
	throw new Error('Some environment variables are missing!')
}

export default () => ({
	API_HOST,
	CHATS_PORT,
	MSGS_PORT,
	LIKE_PORT,
    COMPLAINT_PORT
})
