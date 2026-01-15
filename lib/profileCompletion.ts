// Intelligent Profile Completion - Analyzes and suggests improvements

import { supabase } from './supabase'

interface ProfileScore {
  overall: number
  photos: { score: number; count: number; suggestions: string[] }
  bio: { score: number; length: number; suggestions: string[] }
  interests: { score: number; count: number; suggestions: string[] }
  prompts: { score: number; completed: number; suggestions: string[] }
}

export async function analyzeProfileCompletion(userId: string): Promise<ProfileScore> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select(`
        *,
        media:profile_media(*),
        prompts:profile_prompts(*)
      `)
      .eq('id', userId)
      .single()

    if (!profile) {
      return getEmptyScore()
    }

    // Analyze photos
    const photoCount = profile.media?.length || 0
    const photoScore = Math.min(100, (photoCount / 6) * 100) // 6 photos = 100%
    const photoSuggestions: string[] = []
    if (photoCount < 3) {
      photoSuggestions.push('Add at least 3 photos to your profile')
    }
    if (photoCount < 6) {
      photoSuggestions.push('More photos increase your match rate by 40%')
    }

    // Analyze bio
    const bioLength = profile.bio?.length || 0
    const bioScore = Math.min(100, (bioLength / 200) * 100) // 200 chars = 100%
    const bioSuggestions: string[] = []
    if (bioLength < 50) {
      bioSuggestions.push('Write a longer bio (at least 50 characters)')
    }
    if (bioLength < 100) {
      bioSuggestions.push('A detailed bio helps people get to know you better')
    }
    if (!profile.bio || profile.bio.trim().length === 0) {
      bioSuggestions.push('Add a bio to your profile')
    }

    // Analyze interests
    const interestCount = Array.isArray(profile.interests) ? profile.interests.length : 0
    const interestScore = Math.min(100, (interestCount / 5) * 100) // 5 interests = 100%
    const interestSuggestions: string[] = []
    if (interestCount < 3) {
      interestSuggestions.push('Add at least 3 interests')
    }
    if (interestCount < 5) {
      interestSuggestions.push('More interests help you find better matches')
    }

    // Analyze prompts
    const promptCount = profile.prompts?.length || 0
    const promptScore = Math.min(100, (promptCount / 3) * 100) // 3 prompts = 100%
    const promptSuggestions: string[] = []
    if (promptCount === 0) {
      promptSuggestions.push('Answer profile prompts to stand out')
    }
    if (promptCount < 3) {
      promptSuggestions.push('Complete more prompts to show your personality')
    }

    // Calculate overall score (weighted)
    const overall = Math.round(
      photoScore * 0.3 + // Photos are most important
      bioScore * 0.25 +
      interestScore * 0.25 +
      promptScore * 0.2
    )

    return {
      overall,
      photos: {
        score: Math.round(photoScore),
        count: photoCount,
        suggestions: photoSuggestions,
      },
      bio: {
        score: Math.round(bioScore),
        length: bioLength,
        suggestions: bioSuggestions,
      },
      interests: {
        score: Math.round(interestScore),
        count: interestCount,
        suggestions: interestSuggestions,
      },
      prompts: {
        score: Math.round(promptScore),
        completed: promptCount,
        suggestions: promptSuggestions,
      },
    }
  } catch (error) {
    console.error('[ProfileCompletion] Error:', error)
    return getEmptyScore()
  }
}

function getEmptyScore(): ProfileScore {
  return {
    overall: 0,
    photos: { score: 0, count: 0, suggestions: ['Add photos to your profile'] },
    bio: { score: 0, length: 0, suggestions: ['Write a bio'] },
    interests: { score: 0, count: 0, suggestions: ['Add interests'] },
    prompts: { score: 0, completed: 0, suggestions: ['Answer prompts'] },
  }
}

