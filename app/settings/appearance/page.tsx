'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Sun, Moon, Type, Zap, Palette, Eye } from 'lucide-react'

export default function AppearancePage() {
  const router = useRouter()
  const [theme, setTheme] = useState<'dark' | 'auto'>('dark')
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium')
  const [animation, setAnimation] = useState<'smooth' | 'fast' | 'reduced'>('smooth')
  const [colorScheme, setColorScheme] = useState<'default' | 'blue' | 'purple'>('default')

  useEffect(() => {
    // Load saved preferences
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'auto' || 'dark'
    const savedFontSize = localStorage.getItem('fontSize') as 'small' | 'medium' | 'large' || 'medium'
    const savedAnimation = localStorage.getItem('animation') as 'smooth' | 'fast' | 'reduced' || 'smooth'
    const savedColorScheme = localStorage.getItem('colorScheme') as 'default' | 'blue' | 'purple' || 'default'

    setTheme(savedTheme)
    setFontSize(savedFontSize)
    setAnimation(savedAnimation)
    setColorScheme(savedColorScheme)
  }, [])

  const handleSave = () => {
    // Save preferences
    localStorage.setItem('theme', theme)
    localStorage.setItem('fontSize', fontSize)
    localStorage.setItem('animation', animation)
    localStorage.setItem('colorScheme', colorScheme)

    // Apply theme
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.setAttribute('data-font-size', fontSize)
    document.documentElement.setAttribute('data-animation', animation)
    document.documentElement.setAttribute('data-color-scheme', colorScheme)

    // Show confirmation
    alert('Appearance settings saved!')
  }

  return (
    <div className="min-h-screen bg-dark-bg overflow-y-auto pb-32">
      {/* Header */}
      <div className="safe-top bg-dark-card border-b border-dark-border px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-white/5 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold">Appearance & Display</h1>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Theme */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sun className="w-5 h-5 text-primary-red" />
            <h2 className="text-base font-semibold">Theme</h2>
          </div>
          <div className="glass rounded-xl p-1 flex gap-1">
            <button
              onClick={() => setTheme('dark')}
              className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all ${
                theme === 'dark' ? 'bg-primary-red text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Moon className="w-4 h-4 mx-auto mb-1" />
              Dark
            </button>
            <button
              onClick={() => setTheme('auto')}
              className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all ${
                theme === 'auto' ? 'bg-primary-red text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Eye className="w-4 h-4 mx-auto mb-1" />
              Auto
            </button>
          </div>
        </div>

        {/* Font Size */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Type className="w-5 h-5 text-primary-blue" />
            <h2 className="text-base font-semibold">Font Size</h2>
          </div>
          <div className="glass rounded-xl p-1 flex gap-1">
            <button
              onClick={() => setFontSize('small')}
              className={`flex-1 py-2.5 rounded-lg font-medium text-xs transition-all ${
                fontSize === 'small' ? 'bg-primary-blue text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Small
            </button>
            <button
              onClick={() => setFontSize('medium')}
              className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all ${
                fontSize === 'medium' ? 'bg-primary-blue text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Medium
            </button>
            <button
              onClick={() => setFontSize('large')}
              className={`flex-1 py-2.5 rounded-lg font-medium text-base transition-all ${
                fontSize === 'large' ? 'bg-primary-blue text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Large
            </button>
          </div>
        </div>

        {/* Animation Speed */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-primary-turquoise" />
            <h2 className="text-base font-semibold">Animation Speed</h2>
          </div>
          <div className="glass rounded-xl p-1 flex gap-1">
            <button
              onClick={() => setAnimation('fast')}
              className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all ${
                animation === 'fast' ? 'bg-primary-turquoise text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Fast
            </button>
            <button
              onClick={() => setAnimation('smooth')}
              className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all ${
                animation === 'smooth' ? 'bg-primary-turquoise text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Smooth
            </button>
            <button
              onClick={() => setAnimation('reduced')}
              className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all ${
                animation === 'reduced' ? 'bg-primary-turquoise text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Reduced
            </button>
          </div>
        </div>

        {/* Color Scheme */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Palette className="w-5 h-5 text-primary-red" />
            <h2 className="text-base font-semibold">Accent Color</h2>
          </div>
          <div className="glass rounded-xl p-3 space-y-2">
            <button
              onClick={() => setColorScheme('default')}
              className={`w-full p-3 rounded-lg flex items-center gap-3 transition-all ${
                colorScheme === 'default' ? 'bg-white/10 border-2 border-primary-red' : 'hover:bg-white/5'
              }`}
            >
              <div className="w-6 h-6 rounded-full gradient-red"></div>
              <span className="font-medium">Red (Default)</span>
            </button>
            <button
              onClick={() => setColorScheme('blue')}
              className={`w-full p-3 rounded-lg flex items-center gap-3 transition-all ${
                colorScheme === 'blue' ? 'bg-white/10 border-2 border-primary-blue' : 'hover:bg-white/5'
              }`}
            >
              <div className="w-6 h-6 rounded-full gradient-blue"></div>
              <span className="font-medium">Blue</span>
            </button>
            <button
              onClick={() => setColorScheme('purple')}
              className={`w-full p-3 rounded-lg flex items-center gap-3 transition-all ${
                colorScheme === 'purple' ? 'bg-white/10 border-2 border-purple-500' : 'hover:bg-white/5'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
              <span className="font-medium">Purple</span>
            </button>
          </div>
        </div>

        {/* Preview */}
        <div>
          <h2 className="text-base font-semibold mb-3">Preview</h2>
          <motion.div
            className="glass rounded-xl p-4"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <h3 className={`font-bold mb-2 ${
              fontSize === 'small' ? 'text-base' :
              fontSize === 'medium' ? 'text-lg' : 'text-xl'
            }`}>
              Sample Heading
            </h3>
            <p className={`text-gray-400 ${
              fontSize === 'small' ? 'text-xs' :
              fontSize === 'medium' ? 'text-sm' : 'text-base'
            }`}>
              This is how text will appear with your current settings.
            </p>
            <motion.button
              className={`mt-3 px-4 py-2 rounded-full font-semibold ${
                colorScheme === 'default' ? 'gradient-red' :
                colorScheme === 'blue' ? 'gradient-blue' : 'bg-gradient-to-r from-purple-500 to-pink-500'
              } text-white`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ 
                duration: animation === 'fast' ? 0.1 : animation === 'smooth' ? 0.3 : 0.5
              }}
            >
              Sample Button
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* Save Button - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-dark-card border-t border-dark-border safe-bottom">
        <motion.button
          onClick={handleSave}
          className="w-full py-3 rounded-full gradient-red text-white font-semibold text-base shadow-lg"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Save Changes
        </motion.button>
      </div>
    </div>
  )
}
