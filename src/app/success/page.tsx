import Link from 'next/link';
// import Stripe from 'stripe'; // Commented out for testing

// const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
// const NEXT_PUBLIC_DISCORD_SERVER_INVITE_URL = process.env.NEXT_PUBLIC_DISCORD_SERVER_INVITE_URL || '#'; 
// const BASE_URL = process.env.NEXTAUTH_URL; // Get base URL from env

// let stripe: Stripe | null = null;
// if (STRIPE_SECRET_KEY) {
//   stripe = new Stripe(STRIPE_SECRET_KEY, {
//     apiVersion: '2024-06-20', 
//   });
// } else {
//   console.error('Stripe Secret Key is not configured.');
// }

// Define the props type explicitly, including params
type SuccessPageProps = {
  params: { [key: string]: string }; // For dynamic routes, empty here
  searchParams: { [key: string]: string | string[] | undefined };
};

// Use the defined interface
export default function SuccessPage({ searchParams }: SuccessPageProps) {
  const sessionId = searchParams?.session_id as string | undefined;

  // --- Start Simplified Logic ---
  console.log("Simplified Success Page Reached");
  console.log("Session ID from searchParams:", sessionId);

  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <h1 className="text-3xl font-bold mb-4">Simplified Success Page</h1>
      <p className="mb-4">Checking build process...</p>
      <p className="mb-4">Session ID: {sessionId ? sessionId : 'Not found'}</p>
      <Link href="/" className="text-blue-600 hover:underline">
        Go back to Home
      </Link>
    </div>
  );
  // --- End Simplified Logic ---

  /* --- Start Original Logic (Commented Out) ---
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
            status = 'error'; // Set status to error but payment was successful
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
          // This case might happen if webhook hasn't confirmed payment yet but session is complete
          status = 'success'; // Assume success if complete, role assignment attempt follows
           if (clientReferenceId) {
             // Re-attempt role assignment logic here or indicate potential delay
               message = 'Payment session complete. Attempting to assign Discord role... If you dont see access shortly, please contact support.';
                // Consider placing the API call logic here as well for robustness
           } else {
               status = 'error';
               message = 'Payment session complete, but could not retrieve Discord ID. Contact support.';
           }
      } else {
        // Handle other statuses like 'expired', 'canceled' if necessary
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
  --- End Original Logic (Commented Out) --- */
}
