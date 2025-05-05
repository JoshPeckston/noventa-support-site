// src/app/page.tsx
'use client';

import React from 'react';

export default function Home() {
  const handleGetSupportClick = () => {
    // Log the value directly to the browser console for debugging
    console.log('NEXT_PUBLIC_DISCORD_CLIENT_ID:', process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID);

    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;

    if (!clientId) {
      console.error('Discord Auth URL not configured!');
      alert('Configuration error: Unable to initiate support request.'); // Or handle this more gracefully
      return;
    }

    // Dynamically determine the redirect URI based on the current host
    const redirectUri = encodeURIComponent(`${window.location.origin}/api/auth/discord/callback`);
    const responseType = 'code';
    const scope = encodeURIComponent('identify email guilds.join'); // Added guilds.join

    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${scope}`;
    console.log('Redirecting to Discord:', discordAuthUrl); // Log the URL being generated

    window.location.href = discordAuthUrl;
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-blue-50 to-white text-gray-800">

      {/* Hero Section */}
      <section className="w-full max-w-4xl text-center py-24 px-6 md:py-32">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-blue-900">
          Noventa Support
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Your Trusted Partner for Secure Digital Setup & Support.
        </p>
        <button
          onClick={handleGetSupportClick}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition duration-300 ease-in-out shadow-md hover:shadow-lg"
        >
          Get Support
        </button>
      </section>

      {/* Features Section */}
      <section className="w-full max-w-5xl py-16 px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

          {/* Services Card */}
          <div className="bg-white rounded-xl shadow-md p-8 border border-gray-200">
            <h2 className="text-2xl font-semibold mb-4 text-blue-800">Our Services</h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>Streaming device setup (Apple TV, Roku, Fire Stick)</li>
              <li>VPN installation and configuration</li>
              <li>Wi-Fi optimization and troubleshooting</li>
              <li>Software installation and support</li>
              <li>Cybersecurity health checks</li>
              <li>Smart home device setup</li>
            </ul>
          </div>

          {/* Professional & Secure Card */}
          <div className="bg-white rounded-xl shadow-md p-8 border border-gray-200">
            <h2 className="text-2xl font-semibold mb-4 text-blue-800">Professional & Secure</h2>
            <p className="text-gray-700 leading-relaxed">
              We provide reliable tech assistance with clear communication and professional invoicing.
              Your digital security and privacy are our top priorities. Connect securely via Discord
              for personalized support.
            </p>
          </div>

        </div>
      </section>

      {/* Footer (Optional) */}
      <footer className="w-full text-center p-6 text-gray-500 text-sm mt-16">
        {new Date().getFullYear()} Noventa Support. All rights reserved.
      </footer>

    </main>
  );
}
