import Link from 'next/link';
import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const NEXT_PUBLIC_DISCORD_SERVER_INVITE_URL = process.env.NEXT_PUBLIC_DISCORD_SERVER_INVITE_URL || '#'; 
const BASE_URL = process.env.NEXTAUTH_URL; // Get base URL from env

let stripe: Stripe | null = null;
if (STRIPE_SECRET_KEY) {
  stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20', 
  });
} else {
  console.error('Stripe Secret Key is not configured.');
}

export default async function SuccessPage({ 
  searchParams 
}: { 
  searchParams?: { [key: string]: string | string[] | undefined } 
}) {
  const sessionId = searchParams?.session_id as string | undefined;

  let status: 'success' | 'processing' | 'error' = 'processing';
  let message: string = 'Processing your payment information...';
  let clientReferenceId: string | null = null;
  let paymentStatus: string | null = null;

  if (!stripe) {
    status = 'error';
    message = 'Server configuration error (Stripe not initialized). Please contact support.';
  } else if (!sessionId) {
    status = 'error';
    message = 'Could not find session information. Please return to the site and try again or contact support.';
  } else {
    try {
      console.log(`Retrieving Stripe session: ${sessionId}`);
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      console.log('Stripe session retrieved:', session);

      clientReferenceId = session.client_reference_id;
      paymentStatus = session.payment_status;

      if (paymentStatus === 'paid') {
        if (clientReferenceId) {
          console.log(`Payment successful. Calling API to assign role to Discord User ID: ${clientReferenceId}`);
          
          try {
            if (!BASE_URL) {
              throw new Error('NEXTAUTH_URL environment variable is not set.');
            }
            // Construct absolute URL
            const apiUrl = new URL('/api/discord', BASE_URL).toString(); 
            console.log(`Calling API URL: ${apiUrl}`);

            const response = await fetch(apiUrl, { 
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ discordUserId: clientReferenceId }),
            });

            const result = await response.json();

            if (response.ok && result.success) {
              status = 'success';
              message = result.message || 'Role assigned successfully!'; 
            } else {
              status = 'error';
              message = `Payment confirmed, but failed to assign Discord role: ${result.message || 'Unknown API error'}. Please contact support.`;
              console.error('API call to assign role failed:', result);
            }
          } catch (fetchError: any) {
             console.error('Error calling /api/discord:', fetchError);
             status = 'error';
             message = `Payment confirmed, but encountered an error contacting the role assignment service: ${fetchError.message}. Please contact support.`;
          }

        } else {
          status = 'error';
          message = 'Payment successful, but could not find Discord User ID to assign role. Please contact support.';
          console.error('Stripe session missing client_reference_id despite paid status.', session);
        }
      } else {
        status = 'processing';
        message = `Payment status is '${paymentStatus}'. Please wait for payment confirmation or contact support if this persists.`;
        console.log(`Payment status for session ${sessionId} is ${paymentStatus}.`);
      }
    } catch (error: any) {
      console.error(`Error retrieving session or assigning role for ${sessionId}:`, error);
      status = 'error';
      message = `An error occurred: ${error.message}. Please contact support.`;
    }
  }

  const statusStyles = {
    success: { bg: 'bg-green-50', border: 'border-green-300', title: 'text-green-700', text: 'text-gray-700' },
    processing: { bg: 'bg-yellow-50', border: 'border-yellow-300', title: 'text-yellow-700', text: 'text-gray-700' },
    error: { bg: 'bg-red-50', border: 'border-red-300', title: 'text-red-700', text: 'text-gray-700' },
  };

  const currentStyle = statusStyles[status];

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-50">
      <div className={`text-center p-10 border ${currentStyle.border} rounded-lg ${currentStyle.bg} shadow-md max-w-md`}>
        <h1 className={`text-3xl font-bold ${currentStyle.title} mb-4`}>
          {status === 'success' && 'Success!'}
          {status === 'processing' && 'Processing...'}
          {status === 'error' && 'Error!'}
        </h1>
        <p className={`text-lg ${currentStyle.text} mb-6`}>
          {message}
        </p>
        {(status === 'success' || status === 'error') && (
            <Link
                href={NEXT_PUBLIC_DISCORD_SERVER_INVITE_URL}
                className="mt-4 inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200"
            >
                Return to Discord
            </Link>
        )}
         {process.env.NODE_ENV !== 'production' && (
          <div className="mt-6 text-xs text-gray-500 text-left">
            <p>Debug Info:</p>
            <p>Session ID: {sessionId || 'N/A'}</p>
            <p>Payment Status: {paymentStatus || 'N/A'}</p>
            <p>Client Ref ID: {clientReferenceId || 'N/A'}</p>
            <p>Final Status: {status}</p>
          </div>
        )}
      </div>
    </main>
  );
}
