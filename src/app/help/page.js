import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Search, Mail, MessageSquare, Ticket, Calendar, User, Shield, CreditCard, Sparkles, ChevronRight, HelpCircle } from "lucide-react";

export default function HelpPage() {
  const helpCategories = [
    {
      title: "Getting Started",
      description: "Learn how to join events, set up your profile, and navigate the ecosystem.",
      icon: <Sparkles className="w-5 h-5" />,
      color: "#f472b6",
    },
    {
      title: "Hosting Events",
      description: "Everything you need to know about creating and managing campus events.",
      icon: <Calendar className="w-5 h-5" />,
      color: "#818cf8",
    },
    {
      title: "Tickets & QR Codes",
      description: "Issues with buying tickets, accessing passes, or scanning QR codes.",
      icon: <Ticket className="w-5 h-5" />,
      color: "#fb923c",
    },
    {
      title: "Account Settings",
      description: "Manage your preferences, university email verification, and profile details.",
      icon: <User className="w-5 h-5" />,
      color: "#34d399",
    },
    {
      title: "Payments & Refunds",
      description: "Information about transaction fees, payout methods, and refund policies.",
      icon: <CreditCard className="w-5 h-5" />,
      color: "#fbbf24",
    },
    {
      title: "Trust & Safety",
      description: "Campus verifications, reporting issues, and strict community guidelines.",
      icon: <Shield className="w-5 h-5" />,
      color: "#a78bfa",
    }
  ];

  const faqs = [
    {
      q: "How do I verify my student status?",
      a: "Create an account with your real name and campus email, then complete host verification if you want to publish events. We do not currently auto-verify .edu inboxes."
    },
    {
      q: "Can I get a refund if I can't attend an event?",
      a: "Refund policies are set by individual event hosts. You can request a refund directly from your 'Tickets' page up to 24 hours before the event starts, subject to the host's approval."
    },
    {
      q: "How do I scan QR tickets at the door?",
      a: "Tickets are HMAC-signed on the server. A dedicated scanner app is not available in this version. Organisers should keep attendees' confirmed registrations from the dashboard until scanning ships."
    },
    {
      q: "Is there a fee to host free events?",
      a: "Absolutely not! Hosting free campus events on Uncooked is completely free forever. We only take a small, transparent platform fee on paid ticket sales."
    }
  ];

  return (
    <>
      <Navbar />
      
      <main className="min-h-screen pt-24 pb-20">
        <div className="content-container">
          
          {/* Header Section */}
          <div className="max-w-3xl mx-auto text-center mb-16 pt-10">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#141414] border border-[#222] mb-6 shadow-[0_0_30px_rgba(244,114,182,0.15)]">
              <HelpCircle className="w-6 h-6 text-[#f472b6]" />
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-6">
              How can we <span className="gradient-text">help you?</span>
            </h1>
            <p className="text-lg text-gray-400 mb-10 max-w-xl mx-auto">
              Search our knowledge base or browse categories below to find exactly what you&apos;re looking for.
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-gray-500" />
              </div>
              <input 
                type="text" 
                placeholder="Search for articles, guides, or FAQs..." 
                className="w-full bg-[#111] border border-[#333] rounded-2xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#f472b6] focus:ring-1 focus:ring-[#f472b6] transition-all"
              />
              <button className="absolute inset-y-2 right-2 bg-[#222] hover:bg-[#333] text-white px-4 rounded-xl text-sm font-medium transition-colors">
                Search
              </button>
            </div>
          </div>

          {/* Help Categories Grid */}
          <div className="max-w-5xl mx-auto mb-24">
            <h2 className="text-2xl font-bold mb-8">Browse Topics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {helpCategories.map((cat, i) => (
                <div 
                  key={cat.title}
                  className="relative p-6 rounded-2xl cursor-pointer group hover:-translate-y-1 transition-all duration-300"
                  style={{
                    backgroundColor: "#141414",
                    border: "1px solid #222",
                  }}
                >
                  {/* Glassy Glow Overlay */}
                  <div 
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      background: `radial-gradient(120% 120% at 50% -20%, ${cat.color}20 0%, transparent 50%)`,
                      boxShadow: `inset 0 1px 2px ${cat.color}40, 0 8px 24px ${cat.color}10`,
                      border: `1px solid ${cat.color}30`
                    }}
                  />

                  <div className="relative z-10 flex flex-col gap-5">
                    <div className="flex justify-between items-start">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
                        style={{
                          background: `${cat.color}15`,
                          color: cat.color,
                        }}
                      >
                        {cat.icon}
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <h3 className="text-[17px] font-semibold mb-2 text-white group-hover:text-transparent group-hover:bg-clip-text transition-all"
                          style={{ backgroundImage: `linear-gradient(to right, #fff, ${cat.color})` }}>
                        {cat.title}
                      </h3>
                      <p className="text-[14px] leading-relaxed text-[#a3a3a3]">
                        {cat.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQs Section */}
          <div className="max-w-3xl mx-auto mb-24">
            <h2 className="text-2xl font-bold mb-8">Frequently Asked Questions</h2>
            <div className="flex flex-col gap-4">
              {faqs.map((faq, index) => (
                <div 
                  key={index}
                  className="p-6 rounded-2xl bg-[#111] border border-[#222] hover:border-[#333] transition-colors"
                >
                  <h3 className="text-lg font-semibold text-white mb-3">
                    {faq.q}
                  </h3>
                  <p className="text-[#a3a3a3] leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Support CTA */}
          <div className="max-w-4xl mx-auto rounded-3xl p-8 sm:p-12 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-8 border border-[rgba(255,255,255,0.1)] bg-[#111]">
            <div className="absolute inset-0 bg-gradient-to-br from-[rgba(244,114,182,0.05)] to-[rgba(249,115,22,0.05)] pointer-events-none" />
            
            <div className="relative z-10 text-center sm:text-left">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">Still need help?</h2>
              <p className="text-gray-400 text-lg">
                Our support team is always ready to assist you.
              </p>
            </div>
            
            <div className="relative z-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <a href="/contact" className="btn-secondary px-6 py-3 flex items-center justify-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Contact Form
              </a>
              <a href="mailto:support@uncooked.in" className="btn-primary px-6 py-3 flex items-center justify-center gap-2">
                <Mail className="w-4 h-4" />
                support@uncooked.in
              </a>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}
