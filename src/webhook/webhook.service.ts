import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { transformPayload } from './webhook.transformer';
import { forwardToDiscord } from './discord.forwarder';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class WebhookService {
    private readonly logger = new Logger(WebhookService.name)

    constructor(
        private configService: ConfigService,
        private prisma: PrismaService
    ) {}

    async handle(raw: Record<string, any>) {
        const payload = transformPayload(raw);
        this.logger.log(`Recieved event: ${payload.event} from ${payload.source}`);

        const discordUrl = this.configService.getOrThrow<string>('DISCORD_WEBHOOK_URL');
        let status = "success";
        let errorMsg: string | null = null;

        try {
            await forwardToDiscord(discordUrl, payload);
            this.logger.log(`Forwarded to Discord: ${payload.event}`);
            return { status: 'success', event: payload.event, timestamp: payload.timestamp };
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            this.logger.error(`Discord forward failed: ${message}`);
            return { status: 'error', message: message };
        }

        await this.prisma.integrationLog.create({
            data: {
                event: payload.event,
                source: payload.source,
                summary: payload.summary,
                status,
                errorMsg,
                rawPayload: payload.raw,
            },
        });

        return { status, event: payload.event, timestamp: payload.timestamp };
    }
}
