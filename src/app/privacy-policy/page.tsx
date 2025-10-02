import React from 'react'

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-2xl p-8 md:p-12 mb-8 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">Privacy Policy</h1>
          </div>
          <p className="text-purple-100 text-lg">
            <strong className="text-white">Effective Date:</strong> October 2, 2025
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl p-8 md:p-12 border border-gray-100">
          <div className="prose prose-lg max-w-none">
            {/* Introduction */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-l-4 border-purple-600 p-6 rounded-r-lg mb-8">
              <p className="text-gray-700 leading-relaxed mb-0">
                <strong className="text-purple-600">NovaPrompt</strong> ("we," "our," "us") respects your privacy. This Privacy Policy explains how we collect, use, and protect your information when you use our mobile app ("App").
              </p>
            </div>

            {/* Section 1 */}
            <section className="mb-10 group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                  1
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-0">Information We Collect</h2>
              </div>
              <div className="pl-13">
                <p className="text-gray-700 mb-4 font-medium">We collect limited information to provide and improve our services:</p>
                
                {/* Usage Data */}
                <div className="mb-5">
                  <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500 mb-3">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <span>📊</span> Usage Data
                    </h3>
                    <div className="space-y-2 pl-6">
                      <div className="flex gap-3 items-start">
                        <span className="text-blue-600 mt-1">•</span>
                        <p className="text-gray-700 mb-0">Device information (model, OS version, language, country).</p>
                      </div>
                      <div className="flex gap-3 items-start">
                        <span className="text-blue-600 mt-1">•</span>
                        <p className="text-gray-700 mb-0">App interactions (features used, prompts viewed, ads watched).</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Advertising Data */}
                <div className="mb-5">
                  <div className="bg-amber-50 p-4 rounded-lg border-l-4 border-amber-500 mb-3">
                    <h3 className="text-lg font-semibold text-amber-900 mb-3 flex items-center gap-2">
                      <span>📱</span> Advertising Data
                    </h3>
                    <div className="pl-6">
                      <div className="flex gap-3 items-start">
                        <span className="text-amber-600 mt-1">•</span>
                        <p className="text-gray-700 mb-0">Anonymous identifiers (e.g., Advertising ID) for showing ads.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Optional Data */}
                <div className="mb-5">
                  <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500 mb-3">
                    <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center gap-2">
                      <span>✅</span> Optional Data
                    </h3>
                    <div className="space-y-2 pl-6">
                      <div className="flex gap-3 items-start">
                        <span className="text-green-600 mt-1">•</span>
                        <p className="text-gray-700 mb-0">If you create an account or subscribe, your email (via Play Store / App Store).</p>
                      </div>
                      <div className="flex gap-3 items-start">
                        <span className="text-green-600 mt-1">•</span>
                        <p className="text-gray-700 mb-0">Payment details are processed securely by Google Play / Apple, not stored by us.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section className="mb-10 group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                  2
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-0">How We Use Data</h2>
              </div>
              <div className="pl-13">
                <p className="text-gray-700 mb-4 font-medium">We use collected information to:</p>
                <div className="space-y-3">
                  <div className="flex gap-3 items-start bg-indigo-50 p-4 rounded-lg hover:bg-indigo-100 transition-colors border-l-4 border-indigo-400">
                    <span className="text-indigo-600 mt-1 text-xl">✨</span>
                    <p className="text-gray-700 mb-0">Provide app features (prompts, trends, search).</p>
                  </div>
                  <div className="flex gap-3 items-start bg-pink-50 p-4 rounded-lg hover:bg-pink-100 transition-colors border-l-4 border-pink-400">
                    <span className="text-pink-600 mt-1 text-xl">📺</span>
                    <p className="text-gray-700 mb-0">Show relevant ads (native, interstitial, rewarded).</p>
                  </div>
                  <div className="flex gap-3 items-start bg-emerald-50 p-4 rounded-lg hover:bg-emerald-100 transition-colors border-l-4 border-emerald-400">
                    <span className="text-emerald-600 mt-1 text-xl">⭐</span>
                    <p className="text-gray-700 mb-0">Offer premium subscription (ad-free, unlimited prompts).</p>
                  </div>
                  <div className="flex gap-3 items-start bg-violet-50 p-4 rounded-lg hover:bg-violet-100 transition-colors border-l-4 border-violet-400">
                    <span className="text-violet-600 mt-1 text-xl">🔧</span>
                    <p className="text-gray-700 mb-0">Improve user experience and fix issues.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section className="mb-10 group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                  3
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-0">Advertising & Analytics</h2>
              </div>
              <div className="pl-13 space-y-3">
                <div className="flex gap-3 items-start bg-rose-50 p-4 rounded-lg hover:bg-rose-100 transition-colors">
                  <span className="text-rose-600 mt-1 text-xl">📊</span>
                  <p className="text-gray-700 mb-0">We use Google AdMob / AdX and similar platforms for ads.</p>
                </div>
                <div className="flex gap-3 items-start bg-orange-50 p-4 rounded-lg hover:bg-orange-100 transition-colors">
                  <span className="text-orange-600 mt-1 text-xl">🎯</span>
                  <p className="text-gray-700 mb-0">Ads may be personalized based on your interests. You can opt out of ad personalization in your device settings.</p>
                </div>
                <div className="flex gap-3 items-start bg-sky-50 p-4 rounded-lg hover:bg-sky-100 transition-colors">
                  <span className="text-sky-600 mt-1 text-xl">📈</span>
                  <p className="text-gray-700 mb-0">We may use analytics tools (e.g., Firebase) to understand usage trends.</p>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section className="mb-10 group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                  4
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-0">Data Sharing</h2>
              </div>
              <div className="pl-13">
                <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-5 rounded-lg border-l-4 border-teal-500 mb-4">
                  <p className="text-gray-700 font-semibold mb-2">
                    We do not sell or share personal data with third parties for marketing.
                  </p>
                  <p className="text-gray-700 mb-0">We only share anonymized data with:</p>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-3 items-start bg-cyan-50 p-4 rounded-lg hover:bg-cyan-100 transition-colors">
                    <span className="text-cyan-600 mt-1 text-xl">🤝</span>
                    <p className="text-gray-700 mb-0">Advertising partners (for showing ads).</p>
                  </div>
                  <div className="flex gap-3 items-start bg-cyan-50 p-4 rounded-lg hover:bg-cyan-100 transition-colors">
                    <span className="text-cyan-600 mt-1 text-xl">📊</span>
                    <p className="text-gray-700 mb-0">Analytics providers (for performance insights).</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section className="mb-10 group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                  5
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-0">Your Choices</h2>
              </div>
              <div className="pl-13 space-y-3">
                <div className="flex gap-3 items-start bg-yellow-50 p-4 rounded-lg hover:bg-yellow-100 transition-colors border-l-4 border-yellow-400">
                  <span className="text-yellow-600 mt-1 text-xl">⚙️</span>
                  <p className="text-gray-700 mb-0">You can disable personalized ads in your device settings.</p>
                </div>
                <div className="flex gap-3 items-start bg-yellow-50 p-4 rounded-lg hover:bg-yellow-100 transition-colors border-l-4 border-yellow-400">
                  <span className="text-yellow-600 mt-1 text-xl">🔄</span>
                  <p className="text-gray-700 mb-0">You can cancel premium subscriptions anytime in Google Play / Apple App Store settings.</p>
                </div>
              </div>
            </section>

            {/* Section 6 */}
            <section className="mb-10 group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                  6
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-0">Data Security</h2>
              </div>
              <div className="pl-13 space-y-3">
                <div className="flex gap-3 items-start bg-green-50 p-4 rounded-lg hover:bg-green-100 transition-colors border-l-4 border-green-500">
                  <span className="text-green-600 mt-1 text-xl">🔒</span>
                  <p className="text-gray-700 mb-0">We use industry-standard security measures.</p>
                </div>
                <div className="flex gap-3 items-start bg-amber-50 p-4 rounded-lg hover:bg-amber-100 transition-colors border-l-4 border-amber-500">
                  <span className="text-amber-600 mt-1 text-xl">⚠️</span>
                  <p className="text-gray-700 mb-0">No method is 100% secure, but we take reasonable steps to protect your data.</p>
                </div>
              </div>
            </section>

            {/* Section 7 */}
            <section className="mb-10 group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                  7
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-0">Children's Privacy</h2>
              </div>
              <div className="pl-13 space-y-3">
                <div className="flex gap-3 items-start bg-red-50 p-4 rounded-lg hover:bg-red-100 transition-colors border-l-4 border-red-400">
                  <span className="text-red-600 mt-1 text-xl">👶</span>
                  <p className="text-gray-700 mb-0">The App is not directed to children under 13 years old.</p>
                </div>
                <div className="flex gap-3 items-start bg-red-50 p-4 rounded-lg hover:bg-red-100 transition-colors border-l-4 border-red-400">
                  <span className="text-red-600 mt-1 text-xl">🗑️</span>
                  <p className="text-gray-700 mb-0">If we learn that we have collected data from a child, we will delete it promptly.</p>
                </div>
              </div>
            </section>

            {/* Section 8 */}
            <section className="mb-10 group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                  8
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-0">Changes to Policy</h2>
              </div>
              <div className="pl-13">
                <div className="bg-slate-50 p-5 rounded-lg border-l-4 border-slate-400">
                  <div className="flex gap-3 items-start">
                    <span className="text-slate-600 text-xl">📝</span>
                    <p className="text-gray-700 mb-0">
                      We may update this Privacy Policy. Updates will be posted in the App or on our website.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 9 - Contact */}
            <section className="mb-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                  9
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-0">Contact</h2>
              </div>
              <div className="pl-13">
                <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50 p-6 rounded-xl border-2 border-purple-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">📩</span>
                    <p className="text-gray-700 font-medium mb-0">For questions about privacy, contact us at:</p>
                  </div>
                  <a 
                    href="mailto:support@novaprompt.in" 
                    className="inline-flex items-center gap-2 text-purple-600 font-semibold text-lg hover:text-purple-700 transition-colors no-underline"
                  >
                    support@novaprompt.in
                  </a>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">
            Last updated: October 2, 2025 • NovaPrompt © 2025
          </p>
        </div>
      </div>
    </div>
  )
}

export default PrivacyPolicy
