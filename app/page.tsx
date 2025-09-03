<<<<<<< HEAD
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";
=======

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Users, TrendingUp, Shield, Zap, Sparkles } from 'lucide-react';
>>>>>>> 9a3bd97 (Commit all recent changes)

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Hero Section */}
      <div className="relative px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Sparkles className="w-8 h-8 text-emerald-500" />
<<<<<<< HEAD
              <span className="text-emerald-600 font-medium">
                AI-Powered Strategy Testing
              </span>
=======
              <span className="text-emerald-600 font-medium">Strategy Testing</span>
>>>>>>> 9a3bd97 (Commit all recent changes)
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Stress-Test Your
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500 block">
                Startup Strategy
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
<<<<<<< HEAD
              Get realistic feedback from our animal-spirited AI board members
              before your next investor meeting. Wisdom from the owl, creativity
              from the peacock, and systems thinking from the beaver.
            </p>
            <Link
=======
              Get realistic feedback from our animal-spirited virtual board members before your next investor meeting. 
              Wisdom from the owl, creativity from the peacock, and systems thinking from the beaver.
            </p>
            <Link 
>>>>>>> 9a3bd97 (Commit all recent changes)
              href="/strategy-input"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-2xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 hover:scale-105 shadow-lg"
            >
              Start Your Boardroom Session
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Hero Image */}
          <div className="relative max-w-4xl mx-auto">
            <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="https://omo-oss-image.thefastimg.com/portal-saas/new2022071417205406509/cms/image/903d1009-961d-41d9-a07f-2074bf00ec78.jpg"
                alt="Modern boardroom setting"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
          </div>
        </div>
      </div>
<<<<<<< HEAD
      {/* ...existing code for features and board members sections... */}
=======

      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our animal-spirited advisors bring unique perspectives to help you build better
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="text-center group">
              <div className="bg-gradient-to-br from-emerald-100 to-emerald-200 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl font-bold text-emerald-600">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Present Your Idea</h3>
              <p className="text-gray-600 text-sm">
                Share your startup vision, target market, and key details
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center group">
              <div className="bg-gradient-to-br from-teal-100 to-teal-200 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl font-bold text-teal-600">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Advisor Analysis</h3>
              <p className="text-gray-600 text-sm">
                Our animal-spirited advisors analyze from multiple angles
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center group">
              <div className="bg-gradient-to-br from-amber-100 to-amber-200 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl font-bold text-amber-600">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Get Insights</h3>
              <p className="text-gray-600 text-sm">
                Receive wisdom, creativity, and systematic feedback
              </p>
            </div>

            {/* Step 4 */}
            <div className="text-center group">
              <div className="bg-gradient-to-br from-rose-100 to-rose-200 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl font-bold text-rose-600">4</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Refine & Build</h3>
              <p className="text-gray-600 text-sm">
                Use actionable insights to strengthen your strategy
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Board Members Section */}
      <div className="py-24 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Meet Your Advisors
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Each brings the wisdom of their animal spirit and specialized expertise
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Orion - CFO */}
            <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border">
              <div className="relative w-40 h-40 rounded-2xl mx-auto mb-6 overflow-hidden">
                <Image
                  src="/images/orion_guardian_cfo_owl.png"
                  alt="Orion, the Guardian of the Vault"
                  fill
                  className="object-cover"
                />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                Orion, the Guardian of the Vault
              </h3>
              <p className="text-amber-600 font-medium text-center mb-3">Chief Financial Officer</p>
              <p className="text-sm text-amber-700 text-center mb-4 italic">
                "What is the cost of success, and more importantly, what is the cost of failure?"
              </p>
              <p className="text-gray-600 text-center mb-4 text-sm">
                Brings the owl's wisdom to financial analysis, watching over your resources with analytical precision.
              </p>
              <div className="flex items-center justify-center text-sm text-gray-500">
                <TrendingUp className="w-4 h-4 mr-1" />
                Financial Wisdom
              </div>
            </div>

            {/* Pavo - CMO */}
            <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border">
              <div className="relative w-40 h-40 rounded-2xl mx-auto mb-6 overflow-hidden">
                <Image
                  src="/images/pavo_herald_cmo_peacock.png"
                  alt="Pavo, the Herald of Growth"
                  fill
                  className="object-cover"
                />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                Pavo, the Herald of Growth
              </h3>
              <p className="text-emerald-600 font-medium text-center mb-3">Chief Marketing Officer</p>
              <p className="text-sm text-emerald-700 text-center mb-4 italic">
                "If we build it beautifully and tell a great story, they will come."
              </p>
              <p className="text-gray-600 text-center mb-4 text-sm">
                Channels the peacock's vibrant creativity to help your brand shine and attract customers.
              </p>
              <div className="flex items-center justify-center text-sm text-gray-500">
                <Users className="w-4 h-4 mr-1" />
                Creative Growth
              </div>
            </div>

            {/* Castor - COO */}
            <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border">
              <div className="relative w-40 h-40 rounded-2xl mx-auto mb-6 overflow-hidden">
                <Image
                  src="/images/castor_master_coo_beaver.png"
                  alt="Castor, the Master of Systems"
                  fill
                  className="object-cover"
                />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                Castor, the Master of Systems
              </h3>
              <p className="text-amber-600 font-medium text-center mb-3">Chief Operating Officer</p>
              <p className="text-sm text-amber-700 text-center mb-4 italic">
                "An idea is just a dream until we have a blueprint and a process to build it."
              </p>
              <p className="text-gray-600 text-center mb-4 text-sm">
                Embodies the beaver's systematic approach to building scalable, efficient operations.
              </p>
              <div className="flex items-center justify-center text-sm text-gray-500">
                <Shield className="w-4 h-4 mr-1" />
                Systems Builder
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Simulated Boardroom?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gradient-to-br from-emerald-100 to-emerald-200 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Instant Feedback</h3>
              <p className="text-gray-600 text-sm">
                Get comprehensive insights in minutes, not months
              </p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-br from-teal-100 to-teal-200 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Safe Environment</h3>
              <p className="text-gray-600 text-sm">
                Test ideas safely before presenting to real investors
              </p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-br from-amber-100 to-amber-200 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Diverse Perspectives</h3>
              <p className="text-gray-600 text-sm">
                Financial wisdom, creative growth, and systematic operations
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gradient-to-r from-emerald-500 to-teal-500">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Build Something Amazing?
          </h2>
          <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
            Join smart entrepreneurs who get their strategies battle-tested by our virtual advisors.
          </p>
          <Link 
            href="/strategy-input"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-emerald-600 font-semibold rounded-2xl hover:bg-gray-50 transition-all duration-200 hover:scale-105 shadow-lg"
          >
            Start Your Simulation Now
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
>>>>>>> 9a3bd97 (Commit all recent changes)
    </div>
  );
}
