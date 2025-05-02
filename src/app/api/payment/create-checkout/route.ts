import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID;
const NEXTAUTH_URL = process.env.NEXTAUTH_URL;

if (!STRIPE_SECRET_KEY || !STRIPE_PRICE_ID || !NEXTAUTH_URL) {
  throw new Error('Missing Stripe environment variables');
}

// Initialize Stripe with the secret key and API version
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20', // Revert to latest version
});

export async function GET(request: NextRequest) {
  console.log('API Route /api/payment/create-checkout called');

  // Retrieve Discord User ID passed from the callback
  const { searchParams } = new URL(request.url);
  const discordUserId = searchParams.get('discordUserId');

  if (!discordUserId) {
    console.error('Missing discordUserId query parameter for checkout.');
    // Redirect to an error page or home with an error
    return NextResponse.redirect(new URL('/?error=missing_discord_id', request.url));
  }
  console.log('Discord User ID for checkout:', discordUserId);

  const successUrl = `${NEXTAUTH_URL}/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${NEXTAUTH_URL}/`;

  try {
    console.log(`Creating Stripe session for Price ID: ${STRIPE_PRICE_ID}`);
    console.log(`Success URL: ${successUrl}`);
    console.log(`Cancel URL: ${cancelUrl}`);

    // Create a Stripe Checkout Session
    const sessionOptions: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription', // Changed back to subscription
      success_url: successUrl,
      cancel_url: cancelUrl,
      // Pass the Discord User ID to Stripe
      client_reference_id: discordUserId,
      // Optional: Prefill email or link to an existing Stripe Customer
      // customer_email: discordUserEmail, // If you fetched and stored the email
    };

    // --- ADDED LOGGING --- 
    console.log('*** Stripe Session Create Options ***');
    console.log(JSON.stringify(sessionOptions, null, 2));
    console.log('************************************');
    // --- END ADDED LOGGING ---

    const session = await stripe.checkout.sessions.create(sessionOptions);

    console.log('Stripe session created:', session.id, 'for Discord User:', discordUserId);

    // Redirect the user to the Stripe-hosted checkout page URL
    if (session.url) {
      return NextResponse.redirect(session.url);
    } else {
      throw new Error('Stripe session URL not found.');
    }

  } catch (error: any) {
    console.error('Stripe Error creating checkout session:', error);
    // Redirect to an error page or back home with an error
    const errorRedirectUrl = new URL('/?error=stripe_checkout_failed', request.url);
    errorRedirectUrl.searchParams.set('errorMessage', error.message || 'Unknown Stripe error');
    return NextResponse.redirect(errorRedirectUrl);
  }
}
