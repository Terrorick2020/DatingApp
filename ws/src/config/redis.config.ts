const REDIS_HOST: string = process.env.REDIS_HOST ?? 'localhost'
const REDIS_PORT: number = Number(process.env.REDIS_PORT) ?? 6379
const REDIS_PASSWORD: string = process.env.REDIS_PASSWORD ?? ''
const REDIS_DB: number = Number(process.env.REDIS_DB) ?? 0

export default () => ({
	REDIS_HOST,
	REDIS_PORT,
	REDIS_PASSWORD,
	REDIS_DB,
})
