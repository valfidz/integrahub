import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { WebhookService } from './webhook.service';

@Controller('webhook')
export class WebhookController {
    constructor(private readonly webhookService: WebhookService) {}

    @Post('receive')
    @HttpCode(200)
    async receive(@Body() payload: Record<string, any>) {
        return this.webhookService.handle(payload);
    }
}
