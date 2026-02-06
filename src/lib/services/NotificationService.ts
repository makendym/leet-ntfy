import { NotificationPayload } from '../types';

export class NotificationService {
    private static readonly NTFY_BASE = 'https://ntfy.sh';

    static async sendNotification(payload: NotificationPayload): Promise<boolean> {
        try {
            // Helper to sanitize headers (ISO-8859-1 only)
            const sanitize = (str: string) => str.replace(/[^\x00-\xFF]/g, '');

            const headers: Record<string, string> = {
                'Title': sanitize(payload.title),
            };

            if (payload.priority) {
                headers['Priority'] = payload.priority.toString();
            }

            if (payload.tags && payload.tags.length > 0) {
                headers['Tags'] = payload.tags.join(',');
            }

            if (payload.actions && payload.actions.length > 0) {
                headers['Click'] = payload.actions[0].url; // Default click
                headers['Actions'] = payload.actions.map(a => `view, ${sanitize(a.label)}, ${a.url}`).join('; ');
            }

            const response = await fetch(`${this.NTFY_BASE}/${payload.topic}`, {
                method: 'POST',
                headers,
                body: payload.message,
            });

            return response.ok;
        } catch (error) {
            console.error('Error sending ntfy notification:', error);
            return false;
        }
    }
}
