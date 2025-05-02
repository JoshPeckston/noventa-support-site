'use client';

import React from 'react';

export default function Home() {
  const handleGetSupportClick = () => {
    const discordAuthUrl = process.env.NEXT_PUBLIC_DISCORD_AUTH_URL;
    if (discordAuthUrl) {
      console.log('Redirecting to Discord OAuth...');
      window.location.href = discordAuthUrl;
    } else {
      console.error('Discord Auth URL not configured!');
      alert('Configuration error: Unable to initiate support request.');
    }
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
          Get expert help with streaming devices, VPNs, Wi-Fi, software, and more.
        </p>
        <button
          onClick={handleGetSupportClick}
          className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200 transform hover:scale-105"
        >
          Get Secure Support Now
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
