import { Controller, Post, Get, Body, Query, HttpCode } from '@nestjs/common';
import { WebhookService } from './webhook.service';

@Controller('webhook')
export class WebhookController {
    constructor(private readonly webhookService: WebhookService) {}

    @Post('receive')
    @HttpCode(200)
    async receive(@Body() payload: Record<string, any>) {
        return this.webhookService.handle(payload);
    }

    @Get('logs')
    async getLogs(
        @Query('status') status?: string,
        @Query('source') source?: string,
        @Query('limit') limit?: string,
    ) {
        return this.webhookService.getLogs({
            status,
            source,
            limit: limit ? parseInt(limit, 10) : 20,
        });
    }

    @Get('stats')
    async getStats() {
        return this.webhookService.getStats();
    }

    @Get('timeseries')
    async getTimeSeries(@Query('hours') hours?: string) {
        return this.webhookService.getTimeSeries(hours ? parseInt(hours, 10) : 24);
    }
}
