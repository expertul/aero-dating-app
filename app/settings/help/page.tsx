'use client'

import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import { motion } from 'framer-motion'
import { ArrowLeft, HelpCircle, Mail, MessageCircle, Phone, Globe, FileText, Shield, Heart } from 'lucide-react'

export default function HelpPage() {
  const router = useRouter()

  const faqs = [
    {
      question: 'How do I match with someone?',
      answer: 'Swipe right on profiles you like. If they swipe right on you too, it\'s a match! You can then start chatting.'
    },
    {
      question: 'How do I delete my account?',
      answer: 'Go to Settings > Privacy & Safety > Delete Account. This action is permanent and cannot be undone.'
    },
    {
      question: 'How do I report someone?',
      answer: 'Go to their profile or chat, tap the menu (three dots), and select "Report". Our team will review your report.'
    },
    {
      question: 'How do I block someone?',
      answer: 'Go to their profile or chat, tap the menu (three dots), and select "Block". They won\'t be able to contact you.'
    },
    {
      question: 'Why can\'t I see my matches?',
      answer: 'Make sure you have an active internet connection. If the problem persists, try logging out and back in.'
    },
    {
      question: 'How do I change my photos?',
      answer: 'Go to your profile, tap "Edit Profile", and then tap on your photos to add, remove, or reorder them.'
    }
  ]

  return (
    <div className="h-screen bg-dark-bg text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="safe-top px-4 py-3 flex items-center gap-3 border-b border-dark-border flex-shrink-0">
        <button
          onClick={() => router.back()}
          className="p-1.5 hover:bg-white/5 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">Help & Support</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {/* Contact Support */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Contact Support</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <motion.a
              href="mailto:support@aero-dating.app"
              whileTap={{ scale: 0.98 }}
              className="p-4 glass rounded-xl flex items-center gap-3 hover:bg-white/5 transition-colors"
            >
              <Mail className="w-5 h-5 text-primary-blue" />
              <div>
                <div className="font-medium">Email</div>
                <div className="text-xs text-gray-400">support@aero-dating.app</div>
              </div>
            </motion.a>

            <motion.a
              href="tel:+1234567890"
              whileTap={{ scale: 0.98 }}
              className="p-4 glass rounded-xl flex items-center gap-3 hover:bg-white/5 transition-colors"
            >
              <Phone className="w-5 h-5 text-primary-turquoise" />
              <div>
                <div className="font-medium">Phone</div>
                <div className="text-xs text-gray-400">+1 (234) 567-8900</div>
              </div>
            </motion.a>

            <motion.a
              href="https://aero-dating.app/support"
              target="_blank"
              rel="noopener noreferrer"
              whileTap={{ scale: 0.98 }}
              className="p-4 glass rounded-xl flex items-center gap-3 hover:bg-white/5 transition-colors"
            >
              <MessageCircle className="w-5 h-5 text-primary-red" />
              <div>
                <div className="font-medium">Live Chat</div>
                <div className="text-xs text-gray-400">Available 24/7</div>
              </div>
            </motion.a>

            <motion.a
              href="https://aero-dating.app"
              target="_blank"
              rel="noopener noreferrer"
              whileTap={{ scale: 0.98 }}
              className="p-4 glass rounded-xl flex items-center gap-3 hover:bg-white/5 transition-colors"
            >
              <Globe className="w-5 h-5 text-primary-turquoise" />
              <div>
                <div className="font-medium">Website</div>
                <div className="text-xs text-gray-400">aero-dating.app</div>
              </div>
            </motion.a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Quick Links</h2>
          
          <div className="space-y-2">
            {[
              { icon: FileText, label: 'Terms of Service', href: 'https://aero-dating.app/terms' },
              { icon: Shield, label: 'Privacy Policy', href: 'https://aero-dating.app/privacy' },
              { icon: Heart, label: 'Community Guidelines', href: 'https://aero-dating.app/guidelines' },
              { icon: HelpCircle, label: 'FAQ', href: 'https://aero-dating.app/faq' }
            ].map((link) => (
              <motion.a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                whileTap={{ scale: 0.98 }}
                className="w-full p-4 glass rounded-xl flex items-center gap-3 hover:bg-white/5 transition-colors"
              >
                <link.icon className="w-5 h-5 text-primary-blue" />
                <div className="font-medium">{link.label}</div>
              </motion.a>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Frequently Asked Questions</h2>
          
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-xl p-4"
              >
                <div className="font-semibold mb-2">{faq.question}</div>
                <div className="text-sm text-gray-400">{faq.answer}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Support Hours */}
        <div className="glass rounded-xl p-4 border border-primary-turquoise/20">
          <div className="flex items-start gap-3">
            <MessageCircle className="w-5 h-5 text-primary-turquoise flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold mb-1">Support Hours</div>
              <div className="text-sm text-gray-400 space-y-1">
                <div>Monday - Friday: 9:00 AM - 6:00 PM EST</div>
                <div>Saturday - Sunday: 10:00 AM - 4:00 PM EST</div>
                <div className="mt-2 text-primary-turquoise">Emergency support available 24/7</div>
              </div>
            </div>
          </div>
        </div>

        {/* App Version */}
        <div className="text-center text-xs text-gray-500 pb-4">
          <p>AERO Dating v1.0.0</p>
          <p className="mt-1">© 2024 AERO Dating. All rights reserved.</p>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
