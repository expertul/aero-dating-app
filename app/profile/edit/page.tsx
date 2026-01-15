'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, uploadMedia, getMediaUrl } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { ArrowLeft, Camera, Upload, Save, X, Image as ImageIcon } from 'lucide-react'
import LocationSelector from '@/components/LocationSelector'

const INTERESTS = [
  '🎵 Music', '🎬 Movies', '📚 Reading', '✈️ Travel', '🍳 Cooking',
  '🎮 Gaming', '🏃 Fitness', '🎨 Art', '📸 Photography', '☕ Coffee',
  '🍷 Wine', '🎭 Theater', '🏔️ Hiking', '🏖️ Beach', '🎪 Festivals',
  '🧘 Yoga', '🎸 Guitar', '💃 Dancing', '🐕 Dogs', '🐱 Cats'
]

const RELATIONSHIP_TYPES = [
  { value: 'long-term', label: '💕 Long-term relationship' },
  { value: 'short-term', label: '🌟 Short-term dating' },
  { value: 'casual', label: '😊 Casual dating' },
  { value: 'friendship', label: '🤝 Friendship' },
  { value: 'open', label: '🎯 Open to anything' }
]

const PROMPT_QUESTIONS = [
  "I'm looking for someone who...",
  "My simple pleasures...",
  "I'll fall for you if...",
  "My most irrational fear...",
  "The way to my heart is...",
  "I'm a great +1 because...",
  "My love language is...",
  "I'm weirdly attracted to...",
  "The one thing I'll never do again...",
  "My ideal first date..."
]

export default function EditProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    name: '',
    birthday: '',
    gender: '',
    bio: '',
    interests: [] as string[],
    city: '',
    relationshipType: '',
    photos: [] as { id?: string; storage_path: string; display_order: number }[],
    prompts: [] as Array<{ prompt_text: string; answer: string; display_order: number }>
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select(`
          *,
          media:profile_media(*)
        `)
        .eq('id', user.id)
        .single()

      if (data) {
        // Load prompts
        const { data: promptsData } = await supabase
          .from('profile_prompts')
          .select('*')
          .eq('user_id', user.id)
          .order('display_order', { ascending: true })
        
        setFormData({
          name: data.name || '',
          birthday: data.birthday || '',
          gender: data.gender || '',
          bio: data.bio || '',
          interests: data.interests || [],
          city: data.city || '',
          relationshipType: data.relationship_type || '',
          photos: (data.media || []).sort((a: any, b: any) => a.display_order - b.display_order),
          prompts: (promptsData || []).map((p: any) => ({
            prompt_text: p.prompt_text,
            answer: p.answer,
            display_order: p.display_order
          }))
        })
      }
    } catch (error) {
      // Error loading profile
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const uploads = await Promise.all(
        files.map(async (file) => {
          const { path } = await uploadMedia(user.id, file, 'photo')
          return {
            storage_path: path,
            display_order: formData.photos.length
          }
        })
      )

      setFormData({
        ...formData,
        photos: [...formData.photos, ...uploads]
      })
    } catch (error) {
      // Error uploading photos
      alert('Failed to upload photos')
    }
  }

  const removePhoto = async (index: number) => {
    const photo = formData.photos[index]
    
    // If photo has an ID, delete from database
    if (photo.id) {
      try {
        await supabase
          .from('profile_media')
          .delete()
          .eq('id', photo.id)
      } catch (error) {
        // Error deleting photo
      }
    }

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

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          birthday: formData.birthday,
          gender: formData.gender,
          bio: formData.bio,
          interests: formData.interests,
          city: formData.city,
          relationship_type: formData.relationshipType
        })
        .eq('id', user.id)

      if (profileError) throw profileError

      // Save prompts
      if (formData.prompts.length > 0) {
        // Delete existing prompts
        await supabase
          .from('profile_prompts')
          .delete()
          .eq('user_id', user.id)
        
        // Insert new prompts
        const promptsToInsert = formData.prompts.map((p, index) => ({
          user_id: user.id,
          prompt_text: p.prompt_text,
          answer: p.answer,
          display_order: index
        }))
        
        await supabase
          .from('profile_prompts')
          .insert(promptsToInsert)
      }

      // Save new photos (that don't have IDs yet)
      const newPhotos = formData.photos.filter(p => !p.id)
      if (newPhotos.length > 0) {
        const mediaUploads = newPhotos.map((photo, index) => ({
          user_id: user.id,
          media_type: 'photo' as const,
          storage_path: photo.storage_path,
          display_order: photo.display_order
        }))

        await supabase
          .from('profile_media')
          .insert(mediaUploads)
      }

      router.push('/profile')
    } catch (error) {
      // Error saving profile
      alert('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-bg">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-dark-bg text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="safe-top px-4 py-4 flex items-center gap-3 border-b border-dark-border flex-shrink-0">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-white/5 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">Edit Profile</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 pb-24 safe-bottom">
        {/* Photos Section - Professional Layout */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold mb-1">Photos</h2>
            <p className="text-sm text-gray-400">Add up to 6 photos to showcase yourself</p>
          </div>
          
          {/* Professional Photo Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {formData.photos.map((photo, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative group"
              >
                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-dark-card border-2 border-white/10">
                  <img
                    src={getMediaUrl(photo.storage_path)}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%231C2128" width="200" height="200"/%3E%3Ctext fill="%23666" x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-size="20"%3ENo Photo%3C/text%3E%3C/svg%3E'
                    }}
                  />
                  {/* Gradient overlay */}
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
            
            {/* Add photo button */}
            {formData.photos.length < 6 && (
              <motion.button
                onClick={() => fileInputRef.current?.click()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="aspect-[4/5] border-2 border-dashed border-white/20 hover:border-primary-red rounded-2xl flex flex-col items-center justify-center bg-white/5 hover:bg-primary-red/10 transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-3">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-semibold text-white">Add Photo</span>
                <span className="text-xs text-gray-400 mt-1">{formData.photos.length}/6</span>
              </motion.button>
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

        {/* Basic Info Section */}
        <div className="space-y-5">
          <h2 className="text-xl font-bold">Basic Information</h2>
          
          {/* Name and Birthday */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Birthday</label>
              <input
                type="date"
                value={formData.birthday}
                onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                max={new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 transition-all"
              />
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-semibold mb-2">Gender</label>
            <div className="grid grid-cols-4 gap-3">
              {['man', 'woman', 'non-binary', 'other'].map((gender) => (
                <motion.button
                  key={gender}
                  onClick={() => setFormData({ ...formData, gender })}
                  whileTap={{ scale: 0.98 }}
                  className={`px-4 py-3 rounded-xl border-2 transition-all font-medium text-sm ${
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

          {/* Relationship Type */}
          <div>
            <label className="block text-sm font-semibold mb-2">Looking For</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {RELATIONSHIP_TYPES.map((type) => (
                <motion.button
                  key={type.value}
                  onClick={() => setFormData({ ...formData, relationshipType: type.value })}
                  whileTap={{ scale: 0.98 }}
                  className={`p-3 rounded-xl border-2 transition-all text-left ${
                    formData.relationshipType === type.value
                      ? 'border-primary-red bg-primary-red/20'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <span className="text-sm font-medium">{type.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Bio Section */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold mb-1">About Me</h2>
            <p className="text-sm text-gray-400">Tell others about yourself</p>
          </div>
          <div>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 transition-all resize-none min-h-[120px]"
              placeholder="I love traveling, trying new restaurants, and spending time with my dog..."
              maxLength={500}
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-500">Be authentic and let your personality shine!</p>
              <p className={`text-sm font-medium ${formData.bio.length > 450 ? 'text-primary-red' : 'text-gray-400'}`}>
                {formData.bio.length}/500
              </p>
            </div>
          </div>
        </div>

        {/* Interests Section */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold mb-1">Interests</h2>
            <p className="text-sm text-gray-400">Select up to 10 interests</p>
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
          <div className="glass rounded-xl p-3">
            <p className="text-sm font-semibold text-center">
              Selected: <span className="text-primary-turquoise">{formData.interests.length}</span>/10
            </p>
          </div>
        </div>

        {/* Prompts Section */}
        {formData.prompts.length > 0 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold mb-1">Prompts</h2>
              <p className="text-sm text-gray-400">Your conversation starters</p>
            </div>
            <div className="space-y-3">
              {formData.prompts.map((prompt, index) => (
                <div key={index} className="glass rounded-xl p-4 border border-white/10">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="text-sm font-semibold flex-1">{prompt.prompt_text}</p>
                    <motion.button
                      onClick={() => {
                        setFormData({
                          ...formData,
                          prompts: formData.prompts.filter((_, i) => i !== index)
                        })
                      }}
                      whileTap={{ scale: 0.9 }}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                  </div>
                  <p className="text-sm text-gray-300">{prompt.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Location Section */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold mb-1">Location</h2>
            <p className="text-sm text-gray-400">Your current location</p>
          </div>
          <LocationSelector
            value={formData.city}
            onChange={(value) => setFormData({ ...formData, city: value })}
            placeholder="Select location"
            className="w-full"
          />
        </div>

        {/* Save Button */}
        <div className="pt-4">
          <motion.button
            onClick={handleSave}
            disabled={saving || !formData.name || !formData.birthday}
            whileTap={saving || !formData.name || !formData.birthday ? {} : { scale: 0.98 }}
            className={`w-full px-6 py-4 rounded-2xl font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
              saving || !formData.name || !formData.birthday ? 'bg-gray-600' : 'gradient-red'
            }`}
          >
            {saving ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  )
}
