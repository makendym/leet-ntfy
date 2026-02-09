
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../../app/api/setup/route';
import { UserRepository } from '@/lib/repositories/UserRepository';
import { NextResponse } from 'next/server';

// Mock UserRepository
vi.mock('@/lib/repositories/UserRepository', () => ({
    UserRepository: {
        findByUsername: vi.fn(),
        create: vi.fn()
    }
}));

// Helper to create a Request object
const createRequest = (body: any) => {
    return new Request('http://localhost:3000/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
};

describe('API Setup Route', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return 400 if username is missing', async () => {
        const req = createRequest({});
        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.error).toBe('Username is required');
    });

    it('should create a new user if they do not exist', async () => {
        (UserRepository.findByUsername as any).mockResolvedValue(null);
        (UserRepository.create as any).mockResolvedValue({
            id: 'new-id',
            leetcode_username: 'new-user',
            secret_key: 'new-secret-key'
        });

        const req = createRequest({ username: 'new-user' });
        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.secretKey).toBe('new-secret-key');
        expect(UserRepository.create).toHaveBeenCalledWith('new-user', 'America/New_York');
    });

    it('should return existing user secret key if they already exist', async () => {
        (UserRepository.findByUsername as any).mockResolvedValue({
            id: 'existing-id',
            leetcode_username: 'existing-user',
            secret_key: 'existing-secret-key'
        });

        const req = createRequest({ username: 'existing-user' });
        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.secretKey).toBe('existing-secret-key');
        expect(UserRepository.create).not.toHaveBeenCalled();
    });

    it('should handle internal errors gracefully', async () => {
        (UserRepository.findByUsername as any).mockRejectedValue(new Error('DB Error'));

        const req = createRequest({ username: 'error-user' });
        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(500);
        expect(data.error).toBe('Internal server error');
    });
});
