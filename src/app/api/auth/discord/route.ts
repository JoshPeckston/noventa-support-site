import { NextRequest, NextResponse } from 'next/server';

// This route simulates the callback from Discord after successful authentication.
// In a real app, it would:
// 1. Receive an authorization code from Discord.
// 2. Exchange the code for an access token.
// 3. Fetch user info from Discord API.
// 4. Find or create a user in your database.
// 5. Redirect the user to the payment initiation step.

export async function GET(request: NextRequest) {
  console.log('API Route /api/auth/discord called (simulating Discord callback)');

  // Simulate successful Discord login
  // TODO: Implement actual Discord OAuth flow

  // In a real app, you might store user info in a session or JWT here

  // Redirect to the next step: Stripe checkout creation
  // We use NextResponse.redirect which handles server-side redirects correctly.
  const redirectUrl = new URL('/api/payment/create-checkout', request.url);
  console.log(`Redirecting to Stripe checkout: ${redirectUrl.toString()}`);

  return NextResponse.redirect(redirectUrl);
}
