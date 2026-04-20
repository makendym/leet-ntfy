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

            if (payload.image) {
                headers['Attach'] = payload.image;
            }

            if (payload.icon) {
                headers['Icon'] = payload.icon;
            }

            if (payload.clickUrl) {
                headers['Click'] = payload.clickUrl;
            }

            if (payload.actions && payload.actions.length > 0) {
                if (!headers['Click']) {
                    headers['Click'] = payload.actions[0].url; // Fallback
                }
                headers['Actions'] = payload.actions.map(a => {
                    const type = a.type || 'view';
                    const label = sanitize(a.label).replace(/"/g, ''); 
                    
                    // ntfy requires quoting fields if they contain commas or semicolons.
                    // To be safe, we quote the label, URL, and body, and escape internal quotes.
                    const quote = (str: string) => `"${str.replace(/"/g, '\\"')}"`;
                    
                    const parts = [type, quote(label), quote(a.url)];
                    
                    if (type === 'http') {
                        if (a.method) parts.push(`method=${a.method}`);
                        if (a.body) parts.push(`body=${quote(a.body)}`);
                    }
                    return parts.join(',');
                }).join('; ');
            }

            const response = await fetch(`${this.NTFY_BASE}/${payload.topic}`, {
                method: 'POST',
                headers,
                body: payload.message,
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[NotificationService] ntfy error (${response.status}):`, errorText);
                console.error(`[NotificationService] Failed Headers:`, JSON.stringify(headers, null, 2));
                return false;
            }

            return true;
        } catch (error) {
            console.error('[NotificationService] Error sending ntfy notification:', error);
            return false;
        }
    }
}
