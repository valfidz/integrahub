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

    async getLogs(filters: { status?: string; source?: string; limit?: number }) {
        const { status, source, limit = 20 } = filters;

        const logs = await this.prisma.integrationLog.findMany({
            where: {
                ...(status ? { status } : {}),
                ...(source ? { source } : {}),
            },
            orderBy: { createdAt: 'desc' },
            take: limit
        });

        const total = await this.prisma.integrationLog.count({
            where: {
                ...(status ? { status } : {}),
                ...(source ? { source } : {}),
            },
        });

        return { total, count: logs.length, logs };
    }

    async getStats() {
        const total = await this.prisma.integrationLog.count();
        const success = await this.prisma.integrationLog.count({ where: { status: 'success' } });
        const error = await this.prisma.integrationLog.count({ where: { status: 'error' } });

        const bySource = await this.prisma.integrationLog.groupBy({
            by: ['source'],
            _count: { source: true }
        });

        return {
            total,
            success,
            error,
            successRate: total > 0 ? ((success / total) * 100).toFixed(1) + '%' : '0%',
            bySource: bySource.map((s) => ({ source: s.source, count: s._count.source })),
        };
    }
}
