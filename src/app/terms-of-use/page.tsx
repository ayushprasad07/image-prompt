import React from 'react'

const TermsOfUse = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl shadow-2xl p-8 md:p-12 mb-8 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">Terms of Use</h1>
          </div>
          <p className="text-blue-100 text-lg">
            <strong className="text-white">Effective Date:</strong> October 2, 2025
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl p-8 md:p-12 border border-gray-100">
          <div className="prose prose-lg max-w-none">
            {/* Introduction */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-indigo-600 p-6 rounded-r-lg mb-8">
              <p className="text-gray-700 leading-relaxed mb-0">
                Welcome to <strong className="text-indigo-600">NovaPrompt</strong> ("we," "our," "us"). By downloading, accessing, or using our app ("App"), you agree to these Terms of Use. Please read them carefully. If you do not agree, please do not use the App.
              </p>
            </div>

            {/* Section 1 */}
            <section className="mb-10 group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                  1
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-0">Eligibility</h2>
              </div>
              <div className="pl-13 space-y-3">
                <div className="flex gap-3 items-start bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors">
                  <span className="text-indigo-600 mt-1 text-xl">•</span>
                  <p className="text-gray-700 mb-0">You must be at least <strong className="text-indigo-600">13 years old</strong> to use this App.</p>
                </div>
                <div className="flex gap-3 items-start bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors">
                  <span className="text-indigo-600 mt-1 text-xl">•</span>
                  <p className="text-gray-700 mb-0">If you are under 18, you confirm that your parent/guardian has reviewed and agreed to these Terms.</p>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section className="mb-10 group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                  2
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-0">Use of the App</h2>
              </div>
              <div className="pl-13">
                <p className="text-gray-700 mb-4 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                  The App provides <strong className="text-blue-600">AI prompt collections, creative ideas, and trend-based content</strong> for personal, non-commercial use.
                </p>
                <p className="text-gray-700 font-semibold mb-3">You may not use the App to:</p>
                <div className="space-y-3">
                  <div className="flex gap-3 items-start bg-red-50 p-4 rounded-lg border-l-4 border-red-400">
                    <span className="text-red-600 mt-1">✕</span>
                    <p className="text-gray-700 mb-0">Copy, resell, or redistribute content for commercial gain.</p>
                  </div>
                  <div className="flex gap-3 items-start bg-red-50 p-4 rounded-lg border-l-4 border-red-400">
                    <span className="text-red-600 mt-1">✕</span>
                    <p className="text-gray-700 mb-0">Upload harmful, illegal, or offensive material.</p>
                  </div>
                  <div className="flex gap-3 items-start bg-red-50 p-4 rounded-lg border-l-4 border-red-400">
                    <span className="text-red-600 mt-1">✕</span>
                    <p className="text-gray-700 mb-0">Reverse engineer, hack, or disrupt the App's services.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section className="mb-10 group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                  3
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-0">Ads and Premium Features</h2>
              </div>
              <div className="pl-13 space-y-3">
                <div className="flex gap-3 items-start bg-amber-50 p-4 rounded-lg hover:bg-amber-100 transition-colors border-l-4 border-amber-400">
                  <span className="text-amber-600 mt-1 text-xl">•</span>
                  <p className="text-gray-700 mb-0">The App is free to use but may contain <strong className="text-amber-700">advertising (native, interstitial, and rewarded ads)</strong>.</p>
                </div>
                <div className="flex gap-3 items-start bg-green-50 p-4 rounded-lg hover:bg-green-100 transition-colors border-l-4 border-green-400">
                  <span className="text-green-600 mt-1 text-xl">•</span>
                  <p className="text-gray-700 mb-0">Premium subscription removes ads and unlocks additional features.</p>
                </div>
                <div className="flex gap-3 items-start bg-blue-50 p-4 rounded-lg hover:bg-blue-100 transition-colors border-l-4 border-blue-400">
                  <span className="text-blue-600 mt-1 text-xl">•</span>
                  <p className="text-gray-700 mb-0">Subscriptions are billed through <strong className="text-blue-700">Google Play / Apple App Store</strong> and auto-renew unless cancelled.</p>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section className="mb-10 group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                  4
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-0">Content</h2>
              </div>
              <div className="pl-13 space-y-3">
                <div className="flex gap-3 items-start bg-purple-50 p-4 rounded-lg hover:bg-purple-100 transition-colors">
                  <span className="text-purple-600 mt-1 text-xl">•</span>
                  <p className="text-gray-700 mb-0">Prompts and creative content in the App are <strong className="text-purple-600">for inspiration only</strong>.</p>
                </div>
                <div className="flex gap-3 items-start bg-purple-50 p-4 rounded-lg hover:bg-purple-100 transition-colors">
                  <span className="text-purple-600 mt-1 text-xl">•</span>
                  <p className="text-gray-700 mb-0">We do not guarantee results from any third-party AI tool you use with these prompts.</p>
                </div>
                <div className="flex gap-3 items-start bg-purple-50 p-4 rounded-lg hover:bg-purple-100 transition-colors">
                  <span className="text-purple-600 mt-1 text-xl">•</span>
                  <p className="text-gray-700 mb-0">All logos, trademarks, and branding remain the property of NovaPrompt.</p>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section className="mb-10 group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                  5
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-0">Payments & Refunds</h2>
              </div>
              <div className="pl-13 space-y-3">
                <div className="flex gap-3 items-start bg-emerald-50 p-4 rounded-lg hover:bg-emerald-100 transition-colors">
                  <span className="text-emerald-600 mt-1 text-xl">💳</span>
                  <p className="text-gray-700 mb-0">Subscription fees are shown in local currency (e.g., INR, USD).</p>
                </div>
                <div className="flex gap-3 items-start bg-emerald-50 p-4 rounded-lg hover:bg-emerald-100 transition-colors">
                  <span className="text-emerald-600 mt-1 text-xl">🔄</span>
                  <p className="text-gray-700 mb-0">Refunds are managed according to <strong className="text-emerald-700">Google Play / Apple App Store policies</strong>, not directly by us.</p>
                </div>
              </div>
            </section>

            {/* Section 6 */}
            <section className="mb-10 group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                  6
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-0">Privacy</h2>
              </div>
              <div className="pl-13">
                <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-5 rounded-lg border-l-4 border-cyan-500">
                  <div className="flex gap-3 items-start">
                    <span className="text-cyan-600 text-2xl">🔒</span>
                    <p className="text-gray-700 mb-0">
                      Your privacy is important to us. Please read our <strong className="text-cyan-700">Privacy Policy</strong> to understand how we collect and use your data.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 7 */}
            <section className="mb-10 group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                  7
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-0">Limitation of Liability</h2>
              </div>
              <div className="pl-13 space-y-3">
                <div className="flex gap-3 items-start bg-orange-50 p-4 rounded-lg hover:bg-orange-100 transition-colors border-l-4 border-orange-400">
                  <span className="text-orange-600 mt-1 text-xl">⚠️</span>
                  <p className="text-gray-700 mb-0">The App is provided <strong className="text-orange-700">"as is"</strong> without warranties.</p>
                </div>
                <div className="flex gap-3 items-start bg-orange-50 p-4 rounded-lg hover:bg-orange-100 transition-colors border-l-4 border-orange-400">
                  <span className="text-orange-600 mt-1 text-xl">⚠️</span>
                  <p className="text-gray-700 mb-0">We are not responsible for any losses, damages, or misuse of third-party tools when using our prompts.</p>
                </div>
              </div>
            </section>

            {/* Section 8 */}
            <section className="mb-10 group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                  8
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-0">Changes to Terms</h2>
              </div>
              <div className="pl-13">
                <div className="bg-slate-50 p-5 rounded-lg border-l-4 border-slate-400">
                  <div className="flex gap-3 items-start">
                    <span className="text-slate-600 text-xl">📝</span>
                    <p className="text-gray-700 mb-0">
                      We may update these Terms from time to time. Updates will be effective when posted in the App or on our website.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 9 - Contact */}
            <section className="mb-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                  9
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-0">Contact</h2>
              </div>
              <div className="pl-13">
                <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 p-6 rounded-xl border-2 border-indigo-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">📩</span>
                    <p className="text-gray-700 font-medium mb-0">For questions, contact us at:</p>
                  </div>
                  <a 
                    href="mailto:support@novaprompt.in" 
                    className="inline-flex items-center gap-2 text-indigo-600 font-semibold text-lg hover:text-indigo-700 transition-colors no-underline"
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

export default TermsOfUse
