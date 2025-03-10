import { NestFactory } from '@nestjs/core'
import { AppModule } from './app/app.module'

async function bootstrap() {
    const app = await NestFactory.create(AppModule)

    app.enableCors({
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        allowedHeaders: 'Content-Type, Authorization',
    })

    await app.listen("3000")
}

void bootstrap()
