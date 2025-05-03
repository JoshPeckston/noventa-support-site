import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
  const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
  const NEXTAUTH_URL = process.env.NEXTAUTH_URL; // Your base URL

  if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET || !NEXTAUTH_URL) {
    console.error('Discord callback error: Missing required environment variables.');
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  const REDIRECT_URI = `${NEXTAUTH_URL}/api/auth/discord/callback`;

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    console.error('Discord callback error: No code received.');
    return NextResponse.redirect(new URL('/?error=discord_auth_failed', request.url));
  }

  console.log('Received Discord authorization code:', code);

  try {
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Error fetching Discord token:', errorData);
      throw new Error(`Discord token exchange failed: ${tokenResponse.statusText}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    console.log('Received Discord Access Token:', accessToken ? 'OK' : 'MISSING'); 

    let discordUserId: string | null = null;
    try {
      const userResponse = await fetch('https://discord.com/api/users/@me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!userResponse.ok) {
        console.error('Error fetching Discord user info:', userResponse.status, userResponse.statusText);
      } else {
        const userData = await userResponse.json();
        discordUserId = userData.id;
        console.log('Fetched Discord User Info:', { id: userData.id, username: userData.username, email: userData.email });
      }
    } catch (fetchError) {
      console.error('Network or other error fetching Discord user info:', fetchError);
    }

    if (!discordUserId) {
      console.error('Failed to obtain Discord User ID. Cannot proceed to payment.');
      return NextResponse.redirect(new URL('/?error=discord_user_id_fetch_failed', request.url));
    }

    const checkoutUrl = new URL('/api/payment/create-checkout', request.url);
    checkoutUrl.searchParams.set('discordUserId', discordUserId);
    console.log(`Redirecting to Stripe checkout for Discord User ${discordUserId}: ${checkoutUrl.toString()}`);
    return NextResponse.redirect(checkoutUrl);

  } catch (error) {
    console.error('Discord callback processing error:', error);
    return NextResponse.redirect(new URL('/?error=discord_callback_failed', request.url));
  }
}
