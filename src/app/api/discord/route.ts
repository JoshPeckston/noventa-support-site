// export const runtime = 'nodejs'; // Force Node.js runtime

import { NextResponse, NextRequest } from 'next/server';
import { assignDiscordRole, sendDiscordNotification } from '@/lib/discord';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { discordUserId } = body;

        if (!discordUserId || typeof discordUserId !== 'string') {
            return NextResponse.json({ success: false, message: 'Missing or invalid discordUserId' }, { status: 400 });
        }

        console.log(`API Route: Received request to assign role to Discord User ID: ${discordUserId}`);

        // Call the utility function (ensure it's handling its own errors and logging)
        const result = await assignDiscordRole(discordUserId);

        if (result.success) {
            console.log(`API Route: Successfully processed role assignment for ${discordUserId}. Message: ${result.message}`);
            // Send notification in background (fire-and-forget)
            sendDiscordNotification(discordUserId).catch(err => {
                console.error('Error sending discord notification (fire-and-forget catch):', err);
            });
            return NextResponse.json({ success: true, message: result.message }, { status: 200 });
        } else {
            console.error(`API Route: Failed role assignment for ${discordUserId}. Message: ${result.message}`);
            // Send a generic error message back to the client for security, but log the specific one.
            // Status 500 for server-side issues (bot error, config error), could use 400/404 for client-side (user not found)
             const statusCode = result.message.includes('not found') ? 404 : 500;
            return NextResponse.json({ success: false, message: `Failed to assign role. ${statusCode === 404 ? 'User not found in server?' : 'Please contact support.'}` }, { status: statusCode });
        }

    } catch (error: any) {
        console.error('API Route Error in /api/discord/assign-role:', error);
        // Handle JSON parsing errors or other unexpected issues
        if (error instanceof SyntaxError) {
             return NextResponse.json({ success: false, message: 'Invalid request body.' }, { status: 400 });
        }
        return NextResponse.json({ success: false, message: 'Internal Server Error assigning role.' }, { status: 500 });
    }
}

// Optional: Add a GET handler for testing or method not allowed for others
export async function GET() {
    return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
}