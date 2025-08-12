import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Hero Section */}
      <div className="relative px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Sparkles className="w-8 h-8 text-emerald-500" />
              <span className="text-emerald-600 font-medium">
                AI-Powered Strategy Testing
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Stress-Test Your
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500 block">
                Startup Strategy
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
              Get realistic feedback from our animal-spirited AI board members
              before your next investor meeting. Wisdom from the owl, creativity
              from the peacock, and systems thinking from the beaver.
            </p>
            <Link
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
      {/* ...existing code for features and board members sections... */}
    </div>
  );
}
