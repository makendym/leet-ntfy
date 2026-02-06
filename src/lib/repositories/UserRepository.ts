import { supabase } from '../supabase';
import { UserProfile } from '../types';

export class UserRepository {
    static async findBySecretKey(secretKey: string): Promise<UserProfile | null> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('secret_key', secretKey)
            .single();

        if (error) {
            console.error('Error finding user by secret key:', error);
            return null;
        }
        return data;
    }

    static async findByUsername(username: string): Promise<UserProfile | null> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('leetcode_username', username)
            .single();

        if (error) return null;
        return data;
    }

    static async create(username: string, timezone: string = 'America/New_York'): Promise<UserProfile | null> {
        const { data, error } = await supabase
            .from('users')
            .insert([
                {
                    leetcode_username: username,
                    notification_frequency: 'daily',
                    topics: ['Array'],
                    timezone: timezone,
                    difficulties: ['Easy', 'Medium']
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Error creating user:', error);
            return null;
        }
        return data;
    }

    static async updateSettings(id: string, updates: Partial<UserProfile>): Promise<boolean> {
        const { error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', id);

        if (error) {
            console.error('Error updating settings:', error);
            return false;
        }
        return true;
    }
}
