import axios from 'axios';
import { TransformerPayload } from './webhook.transformer';

export async function forwardToDiscord(
    webhookUrl: string,
    payload: TransformerPayload
): Promise<void> {
    const message = {
        username: 'Integrahub',
        embeds: [
            {
                title: `Event: ${payload.event}`,
                color: 0x5865f2,
                fields: [
                    { name: 'Source', value: payload.source, inline: true },
                    { name: 'Timestamp', value: payload.timestamp, inline: true },
                    { name: 'Summary', value: payload.summary, inline: false },
                ],
                footer: { text: 'IntegraHub Integration Service' }
            },
        ],
    };

    await axios.post(webhookUrl, message)
}
