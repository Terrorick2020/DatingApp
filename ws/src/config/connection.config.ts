const API_HOST: string = process.env.API_HOST ?? ''
const CHATS_PORT: number = Number(process.env.CHATS_PORT)
const MSGS_PORT: number = Number(process.env.MSGS_PORT)
const MATCH_PORT: number = Number(process.env.MATCH_PORT)
const COMPLAINT_PORT: number = Number(process.env.COMPLAINT_PORT)

if (!API_HOST || isNaN(CHATS_PORT) || isNaN(MSGS_PORT) || isNaN(MATCH_PORT)) {
	throw new Error('Some environment variables are missing!')
}

export default () => ({
	API_HOST,
	CHATS_PORT,
	MSGS_PORT,
	MATCH_PORT,
    COMPLAINT_PORT
})
