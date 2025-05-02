import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Client, GatewayIntentBits, Partials } from 'discord.js';

// Stripe Vars
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// Discord Bot Vars
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_SERVER_ID = process.env.DISCORD_SERVER_ID;
const DISCORD_SUBSCRIBER_ROLE_ID = process.env.DISCORD_SUBSCRIBER_ROLE_ID;

if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
  throw new Error('Missing Stripe environment variables for webhook');
}

if (!DISCORD_BOT_TOKEN || !DISCORD_SERVER_ID || !DISCORD_SUBSCRIBER_ROLE_ID) {
  console.warn('Missing Discord environment variables for role assignment. Role assignment will be skipped.');
  // Decide if this should be a hard error instead
  // throw new Error('Missing Discord environment variables for role assignment');
}

// Initialize Stripe
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

// Initialize Discord Client (configured to fetch members)
const discordClient = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers, // Required to fetch members by ID
    ],
    partials: [Partials.GuildMember], // Might be needed depending on caching
});

// Flag to prevent multiple login attempts per request
let isDiscordLoggedIn = false;

// Async function to handle Discord role assignment
async function assignDiscordRole(discordUserId: string): Promise<void> {
    if (!DISCORD_BOT_TOKEN || !DISCORD_SERVER_ID || !DISCORD_SUBSCRIBER_ROLE_ID) {
        console.log('Skipping Discord role assignment due to missing configuration.');
        return;
    }

    try {
        // Login only once per serverless function execution if needed
        if (!isDiscordLoggedIn) {
            console.log('Logging into Discord bot...');
            await discordClient.login(DISCORD_BOT_TOKEN);
            // Wait briefly for the client to be ready (optional, but can help)
            await new Promise(resolve => setTimeout(resolve, 1000));
            isDiscordLoggedIn = true;
            console.log('Discord bot logged in.');
        }

        console.log(`Attempting to assign role ${DISCORD_SUBSCRIBER_ROLE_ID} to user ${discordUserId} in server ${DISCORD_SERVER_ID}`);

        const guild = await discordClient.guilds.fetch(DISCORD_SERVER_ID);
        if (!guild) {
            console.error(`Discord Error: Could not find server with ID ${DISCORD_SERVER_ID}`);
            return;
        }
        console.log(`Found server: ${guild.name}`);

        // Fetch the member from the guild
        const member = await guild.members.fetch(discordUserId);
        if (!member) {
            console.error(`Discord Error: Could not find member with ID ${discordUserId} in server ${guild.name}`);
            return;
        }
        console.log(`Found member: ${member.user.tag}`);

        // Add the role
        await member.roles.add(DISCORD_SUBSCRIBER_ROLE_ID);
        console.log(`Successfully assigned role ${DISCORD_SUBSCRIBER_ROLE_ID} to member ${member.user.tag}`);

    } catch (error) {
        console.error('Discord role assignment failed:', error);
        // Consider more specific error handling (e.g., check for permission errors)
    } finally {
      // In a serverless env, logout might not be strictly necessary as the instance is short-lived
      // but good practice if the instance *could* be reused.
      // if (isDiscordLoggedIn) {
      //    console.log('Logging out Discord bot...');
      //    discordClient.destroy();
      //    isDiscordLoggedIn = false;
      // }
    }
}

// IMPORTANT: Need to disable Next.js body parsing for this route
// so we can read the raw body for signature verification.
export const config = {
  api: {
    bodyParser: false,
  },
};

// Function to read raw body from ReadableStream
async function streamToString(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    result += decoder.decode(value, { stream: true });
  }
  result += decoder.decode(); // Flush any remaining bytes
  return result;
}

export async function POST(request: NextRequest) {
  console.log('>>> STRIPE WEBHOOK /api/webhooks/stripe RECEIVED A POST REQUEST <<<');

  console.log('Stripe webhook endpoint hit!');

  if (!request.body) {
      return NextResponse.json({ error: 'Missing request body' }, { status: 400 });
  }

  const rawBody = await streamToString(request.body);
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    console.error('Webhook Error: Missing stripe-signature header');
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      STRIPE_WEBHOOK_SECRET
    );
    console.log('Webhook signature verified. Event ID:', event.id);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const completedSession = event.data.object as Stripe.Checkout.Session;
      console.log('Checkout Session Completed! Session ID:', completedSession.id);
      console.log('Payment Status:', completedSession.payment_status);
      console.log('Customer Email:', completedSession.customer_details?.email); 
      console.log('Client Reference ID (Discord User ID):', completedSession.client_reference_id);

      if (completedSession.payment_status === 'paid') {
        console.log(`Webhook confirmed payment for session ${completedSession.id}. Role assignment handled by success page.`);
      } else {
        console.log(`Webhook received completed session ${completedSession.id} with status ${completedSession.payment_status}.`);
      }
      break;
    case 'customer.subscription.deleted':
      // Handle subscription cancellations - remove Discord role?
      console.log('Subscription Deleted:', event.data.object.id);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  return NextResponse.json({ received: true });
}
