import Link from 'next/link';
import Stripe from 'stripe'; 

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY; 
const NEXT_PUBLIC_DISCORD_SERVER_INVITE_URL = process.env.NEXT_PUBLIC_DISCORD_SERVER_INVITE_URL || '#'; 
const BASE_URL = process.env.NEXTAUTH_URL; 

let stripe: Stripe | null = null; 
if (STRIPE_SECRET_KEY) { 
  stripe = new Stripe(STRIPE_SECRET_KEY, { 
    apiVersion: '2024-06-20', 
  }); 
} else { 
  console.error('Stripe Secret Key is not configured.'); 
} 

// Define the props type explicitly, typing searchParams as Promise
type SuccessPageProps = {
  params: { [key: string]: string }; 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// Restore async keyword
export default async function SuccessPage({ params, searchParams: searchParamsPromise }: SuccessPageProps) {
  // Await the searchParams promise
  const searchParams = await searchParamsPromise;
  const sessionId = searchParams?.session_id as string | undefined;

  // --- Restore Original Logic ---
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
            const apiEndpoint = `${BASE_URL}/api/discord`;
            console.log(`Calling API endpoint: ${apiEndpoint}`);

            const response = await fetch(apiEndpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ discordUserId: clientReferenceId }),
            });

            const responseData = await response.json(); 
            console.log('API Response:', responseData);

            if (!response.ok) {
              throw new Error(responseData.error || `API call failed with status: ${response.status}`);
            }
            
            status = 'success';
            message = 'Payment successful! Your Discord role has been assigned. You can now access the exclusive channels.';

          } catch (apiError: any) {
            console.error('Error calling Discord API:', apiError);
            status = 'error'; 
            message = `Payment was successful, but there was an error assigning your Discord role: ${apiError.message}. Please contact support with your Discord ID (${clientReferenceId}).`;
          }
        } else {
          console.error('Client Reference ID (Discord User ID) not found in Stripe session.');
          status = 'error';
          message = 'Payment successful, but we could not retrieve your Discord ID to assign the role. Please contact support.';
        }
      } else if (session.status === 'open') {
          status = 'processing';
          message = 'Your payment is still processing. Please wait a moment or check your email.';
      } else if (session.status === 'complete'){
          status = 'success'; 
           if (clientReferenceId) {
             message = 'Payment session complete. Attempting to assign Discord role... If you dont see access shortly, please contact support.';
           } else {
               status = 'error';
               message = 'Payment session complete, but could not retrieve Discord ID. Contact support.';
           }
      } else {
        status = 'error';
        message = `Payment status: ${paymentStatus}. Your payment was not successful. Please try again or contact support.`;
      }
    } catch (error: any) {
      console.error('Error retrieving Stripe session or processing payment:', error);
      status = 'error';
      message = `An error occurred while processing your payment: ${error.message}. Please contact support.`;
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <h1 className={`text-3xl font-bold mb-4 ${status === 'success' ? 'text-green-600' : status === 'error' ? 'text-red-600' : 'text-yellow-600'}`}>
        {status === 'success' ? 'Payment Successful!' : status === 'error' ? 'Payment Error' : 'Payment Processing'}
      </h1>
      <p className="mb-4">{message}</p>
      
      {status === 'success' && (
        <>
           <p className="mb-4">Welcome! You should now have access to the Noventa Support subscriber channels on Discord.</p>
           <a 
              href={NEXT_PUBLIC_DISCORD_SERVER_INVITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:bg-indigo-700 mb-4"
            >
              Go to Discord Server
            </a>
        </>
      )}
      
      {(status === 'error' || status === 'processing') && (
         <Link href="/" className="text-blue-600 hover:underline">
           Return to Homepage
         </Link>
      )}
    </div>
  );
  // --- End Original Logic ---
}
