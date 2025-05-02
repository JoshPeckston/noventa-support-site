// No longer importing discord.js

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_SERVER_ID = process.env.DISCORD_SERVER_ID;
const DISCORD_SUBSCRIBER_ROLE_ID = process.env.DISCORD_SUBSCRIBER_ROLE_ID;
const DISCORD_NOTIFICATION_CHANNEL_ID = process.env.DISCORD_NOTIFICATION_CHANNEL_ID;

/**
 * Assigns a specific role to a Discord user via the Discord REST API.
 * @param discordUserId - The Discord User ID of the member.
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function assignDiscordRole(discordUserId: string): Promise<{ success: boolean; message: string }> {
    console.log(`Attempting to assign role via REST API to Discord User ID: ${discordUserId}`);

    if (!DISCORD_BOT_TOKEN || !DISCORD_SERVER_ID || !DISCORD_SUBSCRIBER_ROLE_ID) {
        const errorMsg = 'Discord Bot Token, Server ID, or Subscriber Role ID is missing in environment variables.';
        console.error(errorMsg);
        return { success: false, message: `Configuration Error: ${errorMsg}` };
    }

    const url = `https://discord.com/api/v10/guilds/${DISCORD_SERVER_ID}/members/${discordUserId}/roles/${DISCORD_SUBSCRIBER_ROLE_ID}`;

    try {
        console.log(`Making PUT request to: ${url}`);
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
                'Content-Type': 'application/json' // Content-Type might not be strictly needed for PUT with no body, but good practice
            },
             // No body needed for this specific role assignment endpoint
        });

        // Check response status
        if (response.ok || response.status === 204) { // 204 No Content is success for this endpoint
            console.log(`Successfully assigned role ${DISCORD_SUBSCRIBER_ROLE_ID} to member ${discordUserId} via REST API. Status: ${response.status}`);
            return { success: true, message: 'Successfully assigned Discord role!' };
        } else {
            // Attempt to parse error response from Discord
            let errorBody = null;
            try {
                errorBody = await response.json();
            } catch (e) { /* ignore JSON parsing error */ }
            
            const errorMessage = errorBody ? JSON.stringify(errorBody) : `Status: ${response.status} ${response.statusText}`;
            console.error(`Failed to assign role via REST API. ${errorMessage}`);
            
            if (response.status === 404) {
                return { success: false, message: 'Failed to assign role: Member not found in the server.' };
            } else if (response.status === 403) {
                 return { success: false, message: 'Failed to assign role: Bot lacks permissions (check role hierarchy and permissions).' };
            } else {
                return { success: false, message: `Failed to assign role: Discord API error (${errorMessage}).` };
            }
        }
    } catch (error: any) {
        console.error('Error during Discord REST API call:', error);
        return { success: false, message: `Internal Server Error: Failed to contact Discord API (${error.message || 'Unknown fetch error'}).` };
    }
}

/**
 * Sends a notification message to a specified Discord channel via the REST API.
 * @param discordUserId - The Discord User ID of the member who subscribed.
 */
export async function sendDiscordNotification(discordUserId: string): Promise<void> {
    console.log(`Attempting to send notification for user ID: ${discordUserId}`);

    if (!DISCORD_BOT_TOKEN || !DISCORD_NOTIFICATION_CHANNEL_ID) {
        console.error('Notification Error: Discord Bot Token or Notification Channel ID is missing in environment variables.');
        return; // Don't throw, just log and exit
    }

    const url = `https://discord.com/api/v10/channels/${DISCORD_NOTIFICATION_CHANNEL_ID}/messages`;
    // Mention the user in the message
    const messageContent = `<@${discordUserId}> has successfully subscribed! 🎉`; 

    try {
        console.log(`Sending notification to channel ${DISCORD_NOTIFICATION_CHANNEL_ID}: ${messageContent}`);
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content: messageContent })
        });

        if (response.ok) {
            console.log(`Successfully sent notification message. Status: ${response.status}`);
        } else {
            // Attempt to parse error response from Discord
            let errorBody = null;
            try {
                errorBody = await response.json();
            } catch (e) { /* ignore JSON parsing error */ }
            const errorMessage = errorBody ? JSON.stringify(errorBody) : `Status: ${response.status} ${response.statusText}`;
            console.error(`Failed to send notification message. ${errorMessage}`);
            // Log the error, but don't block the overall success flow
        }
    } catch (error: any) {
        console.error('Error during Discord REST API call for notification:', error);
        // Log the error, but don't block the overall success flow
    }
}
