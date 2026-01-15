'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase, uploadMedia } from '@/lib/supabase'
import { Camera, Upload, MapPin, Heart, Calendar, User, ArrowRight, Check, X, Image as ImageIcon } from 'lucide-react'
import LocationSelector from '@/components/LocationSelector'

const INTERESTS = [
  '🎵 Music', '🎬 Movies', '📚 Reading', '✈️ Travel', '🍳 Cooking',
  '🎮 Gaming', '🏃 Fitness', '🎨 Art', '📸 Photography', '☕ Coffee',
  '🍷 Wine', '🎭 Theater', '🏔️ Hiking', '🏖️ Beach', '🎪 Festivals',
  '🧘 Yoga', '🎸 Guitar', '💃 Dancing', '🐕 Dogs', '🐱 Cats'
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    birthday: '',
    gender: '',
    bio: '',
    interests: [] as string[],
    city: '',
    relationshipTypes: [] as string[],
    photos: [] as File[]
  })

  const totalSteps = 6

  const handleNext = async () => {
    if (step < totalSteps) {
      setStep(step + 1)
    } else {
      await handleComplete()
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + formData.photos.length > 6) {
      alert('Maximum 6 photos allowed')
      return
    }
    setFormData({ ...formData, photos: [...formData.photos, ...files] })
  }

  const removePhoto = (index: number) => {
    setFormData({
      ...formData,
      photos: formData.photos.filter((_, i) => i !== index)
    })
  }

  const toggleInterest = (interest: string) => {
    if (formData.interests.includes(interest)) {
      setFormData({
        ...formData,
        interests: formData.interests.filter(i => i !== interest)
      })
    } else {
      if (formData.interests.length < 10) {
        setFormData({
          ...formData,
          interests: [...formData.interests, interest]
        })
      }
    }
  }

  const handleComplete = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Upload photos (with error handling)
      let mediaUploads: any[] = []
      if (formData.photos.length > 0) {
        try {
          // Upload one by one to handle errors better
          for (let index = 0; index < formData.photos.length; index++) {
            const photo = formData.photos[index]
            try {
              const { path } = await uploadMedia(user.id, photo, 'photo')
              mediaUploads.push({
                user_id: user.id,
                media_type: 'photo' as const,
                storage_path: path,
                display_order: index
              })
            } catch (photoError: any) {
              // Continue with other photos even if one fails
            }
          }
          
          
          if (mediaUploads.length === 0) {
            throw new Error('Failed to upload any photos. Please check storage bucket settings and try again.')
          }
        } catch (uploadError: any) {
          throw new Error(uploadError.message || 'Failed to upload photos. Check storage bucket.')
        }
      }

      // Upsert profile (create or update)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          name: formData.name,
          birthday: formData.birthday,
          gender: formData.gender,
          bio: formData.bio,
          interests: formData.interests,
          relationship_type: formData.relationshipTypes.length === 1 ? formData.relationshipTypes[0] : formData.relationshipTypes,
          city: formData.city,
          profile_complete: true
        }, {
          onConflict: 'id'
        })

      if (profileError) {
        throw new Error(`Profile save failed: ${profileError.message}`)
      }
      

      // Insert media (only after profile exists)
      if (mediaUploads.length > 0) {
        
        // Verify profile exists first
        const { data: profileCheck } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single()
        
        if (!profileCheck) {
          throw new Error('Profile does not exist. Cannot insert media.')
        }
        
        const { data: insertedMedia, error: mediaError } = await supabase
          .from('profile_media')
          .insert(mediaUploads)
          .select()
        
        if (mediaError) {
          throw new Error(`Failed to save photo records: ${mediaError.message}`)
        }
      }

      // Set default preferences
      const { error: prefError } = await supabase
        .from('preferences')
        .upsert({
          user_id: user.id,
          age_min: 18,
          age_max: 99,
          distance_km: 50,
          gender_preferences: ['man', 'woman', 'non-binary']
        })

      if (prefError) {
        // Don't fail completely if preferences fail
      }

      // Send welcome message from AERO bot
      try {
        const { sendWelcomeMessage } = await import('@/lib/welcomeBot')
        sendWelcomeMessage(user.id).catch(err => {
          console.error('[Onboarding] Error sending welcome message:', err)
        })
      } catch (error) {
        // Don't block onboarding if welcome message fails
        console.error('[Onboarding] Error importing welcome bot:', error)
      }

      router.push('/feed')
    } catch (error: any) {
      console.error('Error completing onboarding:', error)
      alert(error.message || 'Failed to complete profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.name && formData.birthday && formData.gender
      case 2:
        return formData.photos.length >= 2
      case 3:
        return formData.bio.length >= 10
      case 4:
        return formData.interests.length >= 3
      case 5:
        return formData.relationshipTypes.length >= 1 && formData.relationshipTypes.length <= 3
      case 6:
        return formData.city
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg text-white px-4 py-6 sm:px-6 sm:py-8 flex flex-col max-h-screen overflow-hidden">
      {/* Progress bar */}
      <div className="mb-6 sm:mb-8 flex-shrink-0">
        <div className="flex justify-between gap-1.5 mb-3">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: i + 1 <= step ? 1 : 0 }}
              className={`h-1.5 flex-1 rounded-full ${
                i + 1 <= step ? 'gradient-red' : 'bg-white/10'
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-gray-400 font-medium">Step {step} of {totalSteps}</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-bold mb-3">Let's start with the basics</h2>
                  <p className="text-gray-400 text-base">We'll help you create an amazing profile</p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold mb-3 flex items-center gap-2">
                      <User className="w-5 h-5 text-primary-blue" />
                      Your name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-primary-red focus:ring-2 focus:ring-primary-red/20 transition-all text-base"
                      placeholder="Enter your name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-3 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary-turquoise" />
                      Birthday
                    </label>
                    <input
                      type="date"
                      value={formData.birthday}
                      onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                      max={new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                      className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-primary-red focus:ring-2 focus:ring-primary-red/20 transition-all text-base"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-3">Gender</label>
                    <div className="grid grid-cols-2 gap-3">
                      {['man', 'woman', 'non-binary', 'other'].map((gender) => (
                        <motion.button
                          key={gender}
                          onClick={() => setFormData({ ...formData, gender })}
                          whileTap={{ scale: 0.98 }}
                          className={`px-5 py-4 rounded-2xl border-2 transition-all font-medium ${
                            formData.gender === gender
                              ? 'border-primary-red bg-primary-red/20 text-white'
                              : 'border-white/10 bg-white/5 hover:border-white/20'
                          }`}
                        >
                          {gender.charAt(0).toUpperCase() + gender.slice(1)}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Photos - Professional Layout */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-bold mb-3">Add your photos</h2>
                  <p className="text-gray-400 text-base">Upload at least 2 photos. Show your personality!</p>
                </div>

                {/* Professional Photo Grid - Similar to Tinder/Bumble */}
                <div className="space-y-4">
                  {/* Main photo area - larger */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {formData.photos.map((photo, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`relative group ${
                          index === 0 ? 'col-span-2 sm:col-span-1' : ''
                        }`}
                      >
                        <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-dark-card border-2 border-white/10">
                          <img
                            src={URL.createObjectURL(photo)}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {/* Gradient overlay for better text visibility */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          
                          {/* Photo number badge */}
                          <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-semibold">
                            {index + 1}
                          </div>
                          
                          {/* Remove button */}
                          <motion.button
                            onClick={() => removePhoto(index)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="absolute top-3 right-3 w-8 h-8 bg-red-500/90 hover:bg-red-500 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm"
                          >
                            <X className="w-4 h-4 text-white" />
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                    
                    {/* Add photo button - professional design */}
                    {formData.photos.length < 6 && (
                      <motion.button
                        onClick={() => fileInputRef.current?.click()}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`aspect-[4/5] border-2 border-dashed border-white/20 hover:border-primary-red rounded-2xl flex flex-col items-center justify-center bg-white/5 hover:bg-primary-red/10 transition-all ${
                          formData.photos.length === 0 ? 'col-span-2 sm:col-span-1' : ''
                        }`}
                      >
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-3">
                          <Camera className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-white">Add Photo</span>
                        <span className="text-xs text-gray-400 mt-1">{formData.photos.length}/6</span>
                      </motion.button>
                    )}
                  </div>

                  {/* Photo tips */}
                  {formData.photos.length < 2 && (
                    <div className="glass rounded-2xl p-4 border border-primary-turquoise/20">
                      <div className="flex items-start gap-3">
                        <ImageIcon className="w-5 h-5 text-primary-turquoise flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold mb-1">Photo Tips</p>
                          <ul className="text-xs text-gray-400 space-y-1">
                            <li>• Use clear, high-quality photos</li>
                            <li>• Show your face in the first photo</li>
                            <li>• Include photos that show your interests</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </div>
            )}

            {/* Step 3: Bio */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-bold mb-3">Tell us about yourself</h2>
                  <p className="text-gray-400 text-base">Write a short bio that shows your personality</p>
                </div>

                <div>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-primary-red focus:ring-2 focus:ring-primary-red/20 transition-all resize-none text-base min-h-[180px]"
                    placeholder="I love traveling, trying new restaurants, and spending time with my dog..."
                    maxLength={500}
                  />
                  <div className="flex justify-between items-center mt-3">
                    <p className="text-xs text-gray-500">Be authentic and let your personality shine!</p>
                    <p className={`text-sm font-medium ${formData.bio.length > 450 ? 'text-primary-red' : 'text-gray-400'}`}>
                      {formData.bio.length}/500
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Interests */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-bold mb-3">What are you into?</h2>
                  <p className="text-gray-400 text-base">Choose at least 3 interests (max 10)</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {INTERESTS.map((interest) => {
                    const isSelected = formData.interests.includes(interest)
                    return (
                      <motion.button
                        key={interest}
                        onClick={() => toggleInterest(interest)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-4 py-2.5 rounded-full border-2 transition-all font-medium text-sm ${
                          isSelected
                            ? 'border-primary-turquoise bg-primary-turquoise/20 text-white'
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                        }`}
                      >
                        {interest}
                      </motion.button>
                    )
                  })}
                </div>

                <div className="glass rounded-2xl p-4">
                  <p className="text-sm font-semibold text-center">
                    Selected: <span className="text-primary-turquoise">{formData.interests.length}</span>/10
                  </p>
                </div>
              </div>
            )}

            {/* Step 5: Relationship Types */}
            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-bold mb-3">What are you looking for?</h2>
                  <p className="text-gray-400 text-base">Help us find compatible matches (select 1-3)</p>
                </div>

                <div className="space-y-3">
                  {[
                    { value: 'long-term', label: '💕 Long-term relationship', desc: 'Looking for something serious' },
                    { value: 'short-term', label: '🌟 Short-term dating', desc: 'Seeing where it goes' },
                    { value: 'casual', label: '😊 Casual dating', desc: 'Keeping it light and fun' },
                    { value: 'friendship', label: '🤝 Friendship', desc: 'Making new friends' },
                    { value: 'open', label: '🎯 Open to anything', desc: "I'm flexible!" }
                  ].map((type) => {
                    const isSelected = formData.relationshipTypes.includes(type.value)
                    const canSelect = formData.relationshipTypes.length < 3 || isSelected
                    
                    return (
                      <motion.button
                        key={type.value}
                        onClick={() => {
                          if (isSelected) {
                            setFormData({ 
                              ...formData, 
                              relationshipTypes: formData.relationshipTypes.filter(t => t !== type.value)
                            })
                          } else if (canSelect) {
                            setFormData({ 
                              ...formData, 
                              relationshipTypes: [...formData.relationshipTypes, type.value]
                            })
                          }
                        }}
                        disabled={!canSelect}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
                          isSelected
                            ? 'border-primary-red bg-primary-red/20'
                            : canSelect
                            ? 'border-white/10 bg-white/5 hover:border-white/20'
                            : 'border-white/5 bg-white/5 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold mb-1 text-base">{type.label}</div>
                            <div className="text-sm text-gray-400">{type.desc}</div>
                          </div>
                          {isSelected && (
                            <div className="text-primary-red text-2xl">✓</div>
                          )}
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
                
                <div className="glass rounded-2xl p-4">
                  <p className="text-sm font-semibold text-center">
                    Selected: <span className="text-primary-red">{formData.relationshipTypes.length}</span>/3
                  </p>
                </div>
              </div>
            )}

            {/* Step 6: Location */}
            {step === 6 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-bold mb-3">Where are you located?</h2>
                  <p className="text-gray-400 text-base">This helps us find matches near you</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary-red" />
                    Location
                  </label>
                  <LocationSelector
                    value={formData.city}
                    onChange={(value) => setFormData({ ...formData, city: value })}
                    placeholder="Select your location"
                    className="w-full"
                  />
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-2xl p-6 border-2 border-primary-turquoise/30"
                >
                  <h3 className="font-bold text-xl mb-2 flex items-center gap-2">
                    <span className="text-2xl">🎉</span>
                    You're almost done!
                  </h3>
                  <p className="text-sm text-gray-400">
                    Review your profile and start matching with amazing people
                  </p>
                </motion.div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-6 sm:mt-8 flex-shrink-0">
        {step > 1 && (
          <motion.button
            onClick={handleBack}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-4 rounded-2xl border-2 border-white/10 hover:bg-white/5 transition-colors font-semibold"
          >
            Back
          </motion.button>
        )}
        
        <motion.button
          onClick={handleNext}
          disabled={!canProceed() || loading}
          whileTap={canProceed() && !loading ? { scale: 0.98 } : {}}
          className={`flex-1 px-6 py-4 rounded-2xl font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
            canProceed() && !loading ? 'gradient-red' : 'bg-gray-600'
          }`}
        >
          {loading ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              />
              Creating your profile...
            </>
          ) : step === totalSteps ? (
            <>
              <Check className="w-5 h-5" />
              Complete
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </motion.button>
      </div>
    </div>
  )
}
