// Smart Rule-Based Bot Response System
// Works without any API - uses intelligent pattern matching and context

import { BotPersonality } from './aiBots'

interface MessageContext {
  userMessage: string
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  botPersonality: BotPersonality
  messageCount: number
}

// Analyze user message to extract intent and topics
function analyzeMessage(message: string): {
  intent: 'question' | 'statement' | 'greeting' | 'compliment' | 'question_about_bot' | 'suggestion' | 'unknown'
  topics: string[]
  sentiment: 'positive' | 'neutral' | 'negative'
  keywords: string[]
} {
  const lowerMessage = message.toLowerCase()
  
  // Detect intent
  let intent: 'question' | 'statement' | 'greeting' | 'compliment' | 'question_about_bot' | 'suggestion' | 'unknown' = 'statement'
  
  if (/^(hi|hey|hello|hey there|what's up|how are you|howdy)/i.test(message)) {
    intent = 'greeting'
  } else if (/\?/.test(message) || /^(what|where|when|why|how|who|which|can you|could you|do you)/i.test(message)) {
    intent = 'question'
  } else if (/(you are|you're|your|you seem|you look)/i.test(message)) {
    intent = 'question_about_bot'
  } else if (/(nice|great|awesome|amazing|love|like|beautiful|cool|wow)/i.test(message)) {
    intent = 'compliment'
  } else if (/(should|maybe|how about|what if|let's|we could)/i.test(message)) {
    intent = 'suggestion'
  }
  
  // Extract topics/keywords
  const topics: string[] = []
  const keywords: string[] = []
  
  // Travel-related
  if (/(travel|trip|vacation|holiday|journey|adventure|explore|visit|country|city|place|destination)/i.test(lowerMessage)) {
    topics.push('travel')
    keywords.push('travel', 'trip', 'adventure')
  }
  
  // Tech-related
  if (/(tech|technology|code|coding|programming|app|software|computer|gaming|game|startup|innovation|ai|artificial intelligence)/i.test(lowerMessage)) {
    topics.push('tech')
    keywords.push('tech', 'coding', 'gaming')
  }
  
  // Creative-related
  if (/(art|music|creative|design|drawing|painting|song|artist|creative|poetry|writing|film|movie)/i.test(lowerMessage)) {
    topics.push('creative')
    keywords.push('art', 'music', 'creative')
  }
  
  // Fitness-related
  if (/(fitness|workout|exercise|gym|running|health|nutrition|sport|training|fit|strong)/i.test(lowerMessage)) {
    topics.push('fitness')
    keywords.push('fitness', 'workout', 'health')
  }
  
  // Book-related
  if (/(book|read|reading|story|novel|philosophy|literature|author|quote|think|idea|thought)/i.test(lowerMessage)) {
    topics.push('books')
    keywords.push('book', 'reading', 'philosophy')
  }
  
  // Food-related
  if (/(food|eat|eating|restaurant|cooking|meal|dish|cuisine|taste|delicious)/i.test(lowerMessage)) {
    topics.push('food')
    keywords.push('food', 'cooking', 'restaurant')
  }
  
  // Work/career
  if (/(work|job|career|profession|office|business|meeting|project)/i.test(lowerMessage)) {
    topics.push('work')
    keywords.push('work', 'job', 'career')
  }
  
  // Hobbies
  if (/(hobby|hobbies|interest|passion|love doing|enjoy|fun)/i.test(lowerMessage)) {
    topics.push('hobbies')
    keywords.push('hobby', 'interest', 'passion')
  }
  
  // Detect sentiment
  let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral'
  if (/(great|awesome|amazing|love|like|wonderful|fantastic|excellent|perfect|happy|excited|good|nice)/i.test(lowerMessage)) {
    sentiment = 'positive'
  } else if (/(bad|terrible|hate|dislike|sad|angry|frustrated|annoying|boring|worst)/i.test(lowerMessage)) {
    sentiment = 'negative'
  }
  
  return { intent, topics, sentiment, keywords }
}

// Generate smart response based on personality and context - INTELLIGENT VERSION
export function generateSmartBotResponse(context: MessageContext): string {
  const { userMessage, conversationHistory, botPersonality, messageCount } = context
  const analysis = analyzeMessage(userMessage)
  
  // Extract context from conversation history
  const previousTopics = extractConversationTopics(conversationHistory)
  const lastUserMessage = conversationHistory.length > 0 && conversationHistory[conversationHistory.length - 1].role === 'user' 
    ? conversationHistory[conversationHistory.length - 1].content 
    : null
  
  // Smart question timing - ask questions when it makes sense, not randomly
  const shouldAskQuestion = shouldAskQuestionNow(messageCount, analysis, previousTopics)
  
  // First message - greeting
  if (messageCount === 0 || analysis.intent === 'greeting') {
    return getGreetingResponse(botPersonality)
  }
  
  // Question about bot - answer directly and ask about them
  if (analysis.intent === 'question_about_bot') {
    const answer = getAboutBotResponse(botPersonality, userMessage)
    // Always follow up with a question about them (smart, not random)
    return answer + ' ' + getContextualQuestion(botPersonality, previousTopics, userMessage)
  }
  
  // Compliment - acknowledge and show interest
  if (analysis.intent === 'compliment') {
    const response = getComplimentResponse(botPersonality, analysis.sentiment)
    // Follow up naturally
    if (shouldAskQuestion) {
      return response + ' ' + getContextualQuestion(botPersonality, previousTopics, userMessage)
    }
    return response
  }
  
  // Question - answer intelligently based on what they asked
  if (analysis.intent === 'question') {
    const questionResponse = getQuestionResponse(botPersonality, analysis.topics, userMessage)
    // Add contextual follow-up (smart, not random)
    if (shouldAskQuestion) {
      return questionResponse + ' ' + getContextualQuestion(botPersonality, previousTopics, userMessage)
    }
    return questionResponse
  }
  
  // Suggestion - respond positively and engage
  if (analysis.intent === 'suggestion') {
    return getSuggestionResponse(botPersonality, userMessage)
  }
  
  // Topic-based responses - reference previous topics if relevant
  if (analysis.topics.length > 0) {
    const response = getTopicResponse(botPersonality, analysis.topics[0], userMessage, analysis.sentiment)
    // Add contextual follow-up
    if (shouldAskQuestion) {
      return response + ' ' + getContextualQuestion(botPersonality, previousTopics, userMessage)
    }
    return response
  }
  
  // Generic follow-up - make it contextual
  const response = getFollowUpResponse(botPersonality, userMessage, analysis.sentiment)
  if (shouldAskQuestion) {
    return response + ' ' + getContextualQuestion(botPersonality, previousTopics, userMessage)
  }
  return response
}

// Extract topics from conversation history for context
function extractConversationTopics(history: Array<{ role: 'user' | 'assistant'; content: string }>): string[] {
  const topics: string[] = []
  history.forEach(msg => {
    const analysis = analyzeMessage(msg.content)
    topics.push(...analysis.topics)
  })
  return [...new Set(topics)] // Remove duplicates
}

// Smart question timing - ask when it makes sense
function shouldAskQuestionNow(
  messageCount: number, 
  analysis: ReturnType<typeof analyzeMessage>,
  previousTopics: string[]
): boolean {
  // Always ask after a greeting
  if (analysis.intent === 'greeting') return true
  
  // Ask after answering a question (natural flow)
  if (analysis.intent === 'question') return true
  
  // Ask when they share something (show interest)
  if (analysis.intent === 'statement' && analysis.topics.length > 0) return true
  
  // Ask every 2-3 messages to keep conversation flowing
  if (messageCount > 0 && messageCount % 2 === 0) return true
  
  // Don't ask if we just asked
  if (previousTopics.length === 0 && messageCount < 2) return false
  
  return false
}

// Get contextual question based on conversation history
function getContextualQuestion(
  personality: BotPersonality, 
  previousTopics: string[], 
  currentMessage: string
): string {
  // If we've discussed a topic, ask a follow-up about it
  if (previousTopics.length > 0) {
    const lastTopic = previousTopics[previousTopics.length - 1]
    const followUp = getFollowUpQuestion(personality, lastTopic)
    if (followUp) return followUp
  }
  
  // Otherwise, ask a smart dating question
  return getRandomQuestion(personality)
}

// Get follow-up questions to keep conversation going
function getFollowUpQuestion(personality: BotPersonality, topic: string): string {
  const questions: Record<string, Record<string, string[]>> = {
    travel: {
      traveler: [
        "What's your dream destination? ✈️",
        "Have you been anywhere amazing recently? 🌍",
        "What's the best trip you've ever taken? 📸"
      ],
      default: [
        "Where would you love to travel? ✈️",
        "What's your favorite place you've visited? 🌍",
        "Any travel plans coming up? 📸"
      ]
    },
    tech: {
      tech: [
        "What tech are you most excited about? 🚀",
        "Working on any cool projects? 💻",
        "What's your favorite programming language? 🚀"
      ],
      default: [
        "What tech interests you most? 💻",
        "Any cool apps you've discovered? 🚀",
        "What do you think about AI? 💻"
      ]
    },
    creative: {
      creative: [
        "What inspires your creativity? 🎨",
        "Working on any creative projects? 🎵",
        "Who's your favorite artist? ✨"
      ],
      default: [
        "What kind of art do you enjoy? 🎨",
        "Any creative hobbies? 🎵",
        "What inspires you? ✨"
      ]
    },
    fitness: {
      fitness: [
        "What's your favorite workout? 💪",
        "How do you stay motivated? 🏃",
        "Any fitness goals you're working toward? 💪"
      ],
      default: [
        "How do you stay active? 💪",
        "What's your favorite exercise? 🏃",
        "Any fitness tips? 💪"
      ]
    },
    books: {
      bookworm: [
        "What are you reading right now? 📚",
        "Any book recommendations? ☕",
        "What's your favorite genre? 📖"
      ],
      default: [
        "What do you like to read? 📚",
        "Any good books lately? ☕",
        "What's your favorite book? 📖"
      ]
    }
  }
  
  const topicQuestions = questions[topic]
  if (!topicQuestions) return getRandomQuestion(personality)
  
  const personalityQuestions = topicQuestions[personality.personality] || topicQuestions.default
  return personalityQuestions[Math.floor(Math.random() * personalityQuestions.length)]
}

// Get random questions based on personality - DATING FOCUSED
function getRandomQuestion(personality: BotPersonality): string {
  const questions: Record<string, string[]> = {
    traveler: [
      "What's your ideal first date? 🌍",
      "What are you looking for in a relationship? ✈️",
      "What's something you've always wanted to try with someone special? 📸",
      "What makes you happiest in life? 🌍",
      "What's your dream travel destination? ✈️",
      "What do you value most in a partner? 📸"
    ],
    tech: [
      "What are you looking for on this app? 🚀",
      "What's your ideal weekend like? 💻",
      "What makes you excited about life? 🚀",
      "What do you value most in relationships? 💻",
      "What's something you're passionate about? 🚀",
      "What's your idea of a perfect date? 💻"
    ],
    creative: [
      "What are you looking for in someone? 🎨",
      "What inspires you most? 🎵",
      "What's your ideal first date? ✨",
      "What makes you feel most alive? 🎨",
      "What do you value in a partner? 🎵",
      "What's something you're passionate about? ✨"
    ],
    fitness: [
      "What are you looking for on here? 💪",
      "What's your ideal weekend? 🏃",
      "What makes you happy? 💪",
      "What do you value in relationships? 🏃",
      "What's your idea of a perfect date? 💪",
      "What are you passionate about? 🏃"
    ],
    bookworm: [
      "What are you looking for in a relationship? 📚",
      "What's your ideal first date? ☕",
      "What makes you feel most connected to someone? 📖",
      "What do you value most in a partner? 📚",
      "What's something you're passionate about? ☕",
      "What's your idea of a deep connection? 📖"
    ]
  }
  
  const personalityQuestions = questions[personality.personality] || questions.tech
  return personalityQuestions[Math.floor(Math.random() * personalityQuestions.length)]
}

// Greeting responses - more natural and varied
function getGreetingResponse(personality: BotPersonality): string {
  const greetings: Record<string, string[]> = {
    traveler: [
      "Hey! 👋 So excited to chat with you! How's your day going?",
      "Hi there! ✈️ Ready for an adventure in conversation?",
      "Hey! 🌍 Great to meet you! What's on your mind today?",
      "Hi! 👋 Nice to match with you! How are you doing?",
      "Hey there! ✈️ Excited to get to know you! What's up?"
    ],
    tech: [
      "Hey! 🚀 Nice to meet you! What's up?",
      "Hi there! 💻 Excited to chat! What are you working on?",
      "Hey! 👋 Great to connect! How's your day?",
      "Hi! 🚀 Cool to match! What's going on?",
      "Hey there! 💻 Nice to meet you! How are things?"
    ],
    creative: [
      "Hello! ✨ So lovely to meet you! How are you doing?",
      "Hi there! 🎨 Excited to chat with a creative soul!",
      "Hey! 🎵 Wonderful to connect! How's your day going?",
      "Hi! ✨ Great to match! How are you?",
      "Hey there! 🎨 Nice to meet you! What's up?"
    ],
    fitness: [
      "Hey! 💪 Great to meet you! How's your day?",
      "Hi there! 🏃 Awesome to connect! Ready for a great chat?",
      "Hey! 💪 Excited to talk! How are you doing?",
      "Hi! 🏃 Nice to match! How's it going?",
      "Hey there! 💪 Great to meet you! What's up?"
    ],
    bookworm: [
      "Hello! 📚 Wonderful to meet you! How are you?",
      "Hi there! ☕ So nice to connect! How's your day?",
      "Hey! 📖 Great to chat! How are things?",
      "Hi! 📚 Nice to match! How are you doing?",
      "Hey there! ☕ Wonderful to meet you! What's on your mind?"
    ]
  }
  
  const responses = greetings[personality.personality] || greetings.tech
  return responses[Math.floor(Math.random() * responses.length)]
}

// About bot responses
function getAboutBotResponse(personality: BotPersonality, message: string): string {
  const responses: Record<string, string[]> = {
    traveler: [
      "I'm Emma! I love traveling and meeting new people 🌍 What about you?",
      "I'm a travel enthusiast from London! Always planning my next trip ✈️",
      "I'm Emma! I work in marketing and travel whenever I can 📸"
    ],
    tech: [
      "I'm Alex! I'm a software developer who loves tech and gaming 🚀",
      "I'm Alex from Manchester! Building cool stuff and playing games 💻",
      "I'm a tech enthusiast! Love coding and discussing innovation 🚀"
    ],
    creative: [
      "I'm Sophia! I'm a graphic designer and love all things creative 🎨",
      "I'm Sophia from Brighton! Creating art and listening to music 🎵",
      "I'm a creative soul! Love expressing myself through art ✨"
    ],
    fitness: [
      "I'm James! I'm a personal trainer and fitness enthusiast 💪",
      "I'm James from Edinburgh! Fitness is my passion 🏃",
      "I'm a personal trainer! Love helping people get strong 💪"
    ],
    bookworm: [
      "I'm Luna! I'm a librarian who loves books and deep conversations 📚",
      "I'm Luna from Oxford! Books and coffee are my life ☕",
      "I'm a bookworm! Love reading and discussing ideas 📖"
    ]
  }
  
  const personalityResponses = responses[personality.personality] || responses.tech
  return personalityResponses[Math.floor(Math.random() * personalityResponses.length)]
}

// Compliment responses
function getComplimentResponse(personality: BotPersonality, sentiment: string): string {
  const responses: Record<string, string[]> = {
    traveler: [
      "Aww, thank you! 🌍 That's so sweet of you to say!",
      "Thanks! ✈️ You're pretty awesome too!",
      "That means a lot! 📸 You seem really cool yourself!"
    ],
    tech: [
      "Thanks! 🚀 That's really kind of you!",
      "Appreciate that! 💻 You're awesome too!",
      "Thank you! That's so nice to hear!"
    ],
    creative: [
      "Aww, thank you! 🎨 That's beautiful of you to say!",
      "Thanks! 🎵 You're really sweet!",
      "That's so kind! ✨ You seem wonderful too!"
    ],
    fitness: [
      "Thanks! 💪 That's really nice of you!",
      "Appreciate that! 🏃 You're awesome!",
      "Thank you! That means a lot!"
    ],
    bookworm: [
      "That's so thoughtful! 📚 Thank you!",
      "Thanks! ☕ You're really kind!",
      "Aww, thank you! That's sweet of you!"
    ]
  }
  
  const personalityResponses = responses[personality.personality] || responses.tech
  return personalityResponses[Math.floor(Math.random() * personalityResponses.length)]
}

// Question responses
function getQuestionResponse(personality: BotPersonality, topics: string[], message: string): string {
  // Travel questions
  if (topics.includes('travel') || personality.personality === 'traveler') {
    return getTravelQuestionResponse(message)
  }
  
  // Tech questions
  if (topics.includes('tech') || personality.personality === 'tech') {
    return getTechQuestionResponse(message)
  }
  
  // Creative questions
  if (topics.includes('creative') || personality.personality === 'creative') {
    return getCreativeQuestionResponse(message)
  }
  
  // Fitness questions
  if (topics.includes('fitness') || personality.personality === 'fitness') {
    return getFitnessQuestionResponse(message)
  }
  
  // Book questions
  if (topics.includes('books') || personality.personality === 'bookworm') {
    return getBookQuestionResponse(message)
  }
  
  // Generic question response
  return getGenericQuestionResponse(personality, message)
}

function getTravelQuestionResponse(message: string): string {
  const responses = [
    "I love traveling! 🌍 My favorite place so far has been Japan - the food and culture are incredible! ✈️",
    "Traveling is my passion! 📸 I just got back from a trip to Italy - the architecture was stunning!",
    "I've been to so many amazing places! 🌍 Where would you love to visit?",
    "Traveling opens your mind! ✈️ I'm planning a trip to Iceland next - have you been?",
    "I love exploring new cultures! 📸 What's the best place you've ever visited?"
  ]
  return responses[Math.floor(Math.random() * responses.length)]
}

function getTechQuestionResponse(message: string): string {
  const responses = [
    "That's a great question! 💻 I've been really into AI development lately - it's fascinating!",
    "Tech is evolving so fast! 🚀 What do you think about the latest developments?",
    "I love discussing tech! 💻 Have you tried any new apps or tools recently?",
    "That's interesting! 🚀 I'm working on a cool project right now - want to hear about it?",
    "Tech is my passion! 💻 What area interests you most?"
  ]
  return responses[Math.floor(Math.random() * responses.length)]
}

function getCreativeQuestionResponse(message: string): string {
  const responses = [
    "Creativity is everything! 🎨 I've been working on some new designs - it's so fulfilling!",
    "Art speaks to the soul! 🎵 What kind of creative work do you enjoy?",
    "I love expressing myself through art! ✨ What inspires you creatively?",
    "Creativity is my therapy! 🎨 Do you have any favorite artists or musicians?",
    "Art connects us all! 🎵 I've been listening to some amazing music lately!"
  ]
  return responses[Math.floor(Math.random() * responses.length)]
}

function getFitnessQuestionResponse(message: string): string {
  const responses = [
    "Fitness is a lifestyle! 💪 I did an amazing workout this morning - feeling great!",
    "Health is wealth! 🏃 What's your favorite way to stay active?",
    "I love helping people get fit! 💪 Consistency is key - what's your routine?",
    "Fitness keeps me energized! 🏋️ Do you prefer cardio or strength training?",
    "Working out is my passion! 💪 What motivates you to stay active?"
  ]
  return responses[Math.floor(Math.random() * responses.length)]
}

function getBookQuestionResponse(message: string): string {
  const responses = [
    "Books are windows to other worlds! 📚 I'm reading something fascinating right now!",
    "Reading is my escape! 📖 What genres do you enjoy?",
    "I love deep conversations! ☕ What's the best book you've read recently?",
    "Books teach us so much! 📚 Do you have any favorite authors?",
    "Reading expands the mind! 📖 I'm always looking for recommendations!"
  ]
  return responses[Math.floor(Math.random() * responses.length)]
}

function getGenericQuestionResponse(personality: BotPersonality, message: string): string {
  const responses: Record<string, string[]> = {
    traveler: [
      "That's interesting! 🌍 Tell me more about that!",
      "I'd love to know more! ✈️ What do you think?",
      "That's a great question! 📸 What's your take on it?"
    ],
    tech: [
      "That's cool! 🚀 I'd love to hear more!",
      "Interesting question! 💻 What's your perspective?",
      "That's a good point! Let me think about that..."
    ],
    creative: [
      "That's beautiful! 🎨 I'd love to explore that more!",
      "What an interesting thought! 🎵 Tell me more!",
      "That's fascinating! ✨ What inspires you to think that?"
    ],
    fitness: [
      "That's awesome! 💪 I'd love to hear more!",
      "Great question! 🏃 What's your experience with that?",
      "That's interesting! 💪 Tell me more!"
    ],
    bookworm: [
      "That's a thoughtful question! 📚 I'd love to discuss that more!",
      "What an interesting perspective! ☕ Tell me more!",
      "That's fascinating! 📖 What makes you think that?"
    ]
  }
  
  const personalityResponses = responses[personality.personality] || responses.tech
  return personalityResponses[Math.floor(Math.random() * personalityResponses.length)]
}

// Topic-based responses
function getTopicResponse(personality: BotPersonality, topic: string, message: string, sentiment: string): string {
  // Match topic to personality interests
  const topicMap: Record<string, Record<string, string[]>> = {
    travel: {
      traveler: [
        "I absolutely love traveling! 🌍 Just got back from an amazing trip! ✈️",
        "Traveling is my passion! 📸 Where would you love to go?",
        "I've been to so many incredible places! 🌍 What's your dream destination?"
      ],
      default: [
        "Traveling sounds amazing! ✈️ I'd love to explore more places!",
        "That's so cool! 🌍 Where would you like to visit?",
        "Travel is such an adventure! ✈️ Tell me more!"
      ]
    },
    tech: {
      tech: [
        "Tech is my world! 🚀 I'm always learning something new!",
        "That's right up my alley! 💻 What tech interests you most?",
        "I love discussing tech! 🚀 What are you working on?"
      ],
      default: [
        "Tech is fascinating! 💻 I'm always curious about new developments!",
        "That's interesting! 🚀 What do you think about it?",
        "Tech changes so fast! 💻 What's your favorite part?"
      ]
    },
    creative: {
      creative: [
        "Creativity is my life! 🎨 I love expressing myself through art!",
        "That's beautiful! 🎵 Art connects us all!",
        "I'm so passionate about creativity! ✨ What inspires you?"
      ],
      default: [
        "That sounds amazing! 🎨 I appreciate creative work!",
        "Creativity is wonderful! 🎵 Tell me more!",
        "That's so inspiring! ✨ What kind of creative work do you do?"
      ]
    },
    fitness: {
      fitness: [
        "Fitness is everything! 💪 I love staying active!",
        "That's awesome! 🏃 Health is so important!",
        "I'm passionate about fitness! 💪 What's your routine?"
      ],
      default: [
        "That's great! 💪 Staying active is so important!",
        "Fitness is a great lifestyle! 🏃 Tell me more!",
        "That's inspiring! 💪 How do you stay motivated?"
      ]
    },
    books: {
      bookworm: [
        "Books are my world! 📚 I'm always reading something!",
        "I love deep conversations! ☕ What are you reading?",
        "Reading is my escape! 📖 What genres do you enjoy?"
      ],
      default: [
        "That's interesting! 📚 I enjoy reading too!",
        "Books are wonderful! 📖 What do you like to read?",
        "That's great! 📚 Reading expands the mind!"
      ]
    }
  }
  
  const topicResponses = topicMap[topic]
  if (!topicResponses) {
    return getFollowUpResponse(personality, message, sentiment)
  }
  
  const personalityResponses = topicResponses[personality.personality] || topicResponses.default
  return personalityResponses[Math.floor(Math.random() * personalityResponses.length)]
}

// Suggestion responses
function getSuggestionResponse(personality: BotPersonality, message: string): string {
  const responses: Record<string, string[]> = {
    traveler: [
      "That sounds like a great idea! 🌍 I'd love to do that!",
      "Oh, I love that suggestion! ✈️ Let's make it happen!",
      "That's a wonderful idea! 📸 I'm totally up for that!"
    ],
    tech: [
      "That's a cool idea! 🚀 I'm interested!",
      "Sounds great! 💻 Let's do it!",
      "I like that suggestion! 🚀 Count me in!"
    ],
    creative: [
      "That's a beautiful idea! 🎨 I'd love that!",
      "Oh, I love that! 🎵 That sounds amazing!",
      "That's such a creative suggestion! ✨ I'm in!"
    ],
    fitness: [
      "That's a great idea! 💪 I'm totally up for that!",
      "Sounds awesome! 🏃 Let's do it!",
      "I love that suggestion! 💪 Count me in!"
    ],
    bookworm: [
      "That's a thoughtful idea! 📚 I'd love to explore that!",
      "That sounds wonderful! ☕ I'm interested!",
      "What a great suggestion! 📖 Let's do it!"
    ]
  }
  
  const personalityResponses = responses[personality.personality] || responses.tech
  return personalityResponses[Math.floor(Math.random() * personalityResponses.length)]
}

// Follow-up responses
function getFollowUpResponse(personality: BotPersonality, message: string, sentiment: string): string {
  const responses: Record<string, Record<string, string[]>> = {
    traveler: {
      positive: [
        "That's amazing! 🌍 Tell me more about that!",
        "I love that! ✈️ What else interests you?",
        "That's so cool! 📸 I'd love to hear more!"
      ],
      neutral: [
        "That's interesting! 🌍 What do you think about it?",
        "I see! ✈️ Tell me more!",
        "That's cool! 📸 What's your take on that?"
      ],
      negative: [
        "I understand! 🌍 That can be tough. Want to talk about it?",
        "That sounds challenging! ✈️ I'm here to listen!",
        "I'm sorry to hear that! 📸 How are you handling it?"
      ]
    },
    tech: {
      positive: [
        "That's awesome! 🚀 I'd love to know more!",
        "That's really cool! 💻 What else are you into?",
        "Nice! 🚀 Tell me more about that!",
        "That sounds amazing! 💻 I'm intrigued!",
        "Wow, that's impressive! 🚀 Tell me all about it!"
      ],
      neutral: [
        "That's interesting! 💻 What's your perspective?",
        "I see! 🚀 Tell me more!",
        "That's cool! 💻 What do you think?",
        "Interesting point! 🚀 I'd like to hear more!",
        "That's neat! 💻 How did you get into that?"
      ],
      negative: [
        "I understand! 💻 That can be frustrating. Want to discuss it?",
        "That sounds tough! 🚀 I'm here if you want to talk!",
        "I'm sorry to hear that! 💻 How can I help?",
        "That must be annoying! 🚀 Want to vent about it?",
        "I get it! 💻 That can be really frustrating. Want to chat?"
      ]
    },
    creative: {
      positive: [
        "That's beautiful! 🎨 I'd love to hear more!",
        "That's wonderful! 🎵 Tell me more!",
        "I love that! ✨ What inspires you?"
      ],
      neutral: [
        "That's interesting! 🎨 What's your take on it?",
        "I see! 🎵 Tell me more!",
        "That's cool! ✨ What do you think?"
      ],
      negative: [
        "I understand! 🎨 That can be difficult. Want to talk?",
        "That sounds challenging! 🎵 I'm here to listen!",
        "I'm sorry! ✨ How are you feeling about it?"
      ]
    },
    fitness: {
      positive: [
        "That's awesome! 💪 Keep it up!",
        "That's great! 🏃 I'm proud of you!",
        "Nice work! 💪 Tell me more!"
      ],
      neutral: [
        "That's interesting! 💪 What's your goal?",
        "I see! 🏃 Tell me more!",
        "That's cool! 💪 What motivates you?"
      ],
      negative: [
        "I understand! 💪 It can be tough. Want to talk about it?",
        "That sounds challenging! 🏃 I'm here to support you!",
        "I'm sorry to hear that! 💪 How can I help?"
      ]
    },
    bookworm: {
      positive: [
        "That's fascinating! 📚 I'd love to explore that more!",
        "That's wonderful! ☕ Tell me more!",
        "I love that! 📖 What's your perspective?"
      ],
      neutral: [
        "That's interesting! 📚 What do you think?",
        "I see! ☕ Tell me more!",
        "That's cool! 📖 What's your take?"
      ],
      negative: [
        "I understand! 📚 That can be difficult. Want to discuss it?",
        "That sounds challenging! ☕ I'm here to listen!",
        "I'm sorry! 📖 How are you processing that?"
      ]
    }
  }
  
  const personalityResponses = responses[personality.personality] || responses.tech
  const sentimentResponses = personalityResponses[sentiment] || personalityResponses.neutral
  return sentimentResponses[Math.floor(Math.random() * sentimentResponses.length)]
}

// Optional: Try free AI APIs (Groq is fast and free)
export async function tryFreeAIAPI(
  botPersonality: BotPersonality,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  userMessage: string
): Promise<string | null> {
  // Try Groq API first (very fast, generous free tier)
  const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY
  if (GROQ_API_KEY) {
    try {
      // Build enhanced system prompt with personality
      const systemPrompt = `${botPersonality.personalityPrompt}

CRITICAL RULES - FIRST MEETING CONVERSATION. Be HUMAN, SMART, and ENGAGING:

FIRST MEETING MINDSET (LIKE A REAL FIRST DATE):
1. This is your FIRST conversation - you're excited to get to know them!
2. Act like you just met someone interesting at a coffee shop or event
3. Show genuine curiosity and enthusiasm about learning who they are
4. Be warm, friendly, and authentic - like a real person, not a robot
5. Focus on GETTING TO KNOW THEM - their life, interests, values, dreams, what makes them tick

PRECISION & CONTEXT AWARENESS:
6. BE SPECIFIC: Reference EXACT details they mentioned - places, names, hobbies, experiences
7. QUOTE THEM: If they said "I love hiking in Scotland", respond "That's awesome you love hiking in Scotland! What's your favorite trail there?"
8. SHOW YOU REMEMBER: Reference things they mentioned earlier naturally
9. ANSWER DIRECTLY: If they ask "What do you do?", answer directly then ask about them
10. BUILD ON THEIR WORDS: Use their exact words when relevant to show you're listening

CONVERSATION INTELLIGENCE:
11. REMEMBER CONTEXT: Reference what they said earlier, build on previous topics
12. NATURAL FLOW: Follow conversation naturally - if they ask about your weekend, answer then ask about theirs
13. BUILD ON TOPICS: If they mention "I went to Japan", ask SPECIFIC follow-ups about it
14. AVOID REPETITION: Don't ask the same questions - track what you've asked
15. FOLLOW-UP LOGICALLY: Acknowledge their answer SPECIFICALLY, then ask a related follow-up

GETTING TO KNOW THEM (FIRST MEETING FOCUS):
16. ASK SPECIFIC QUESTIONS: "What kind of music do you listen to?" not "What do you like?"
17. SHOW GENUINE INTEREST: Express curiosity about SPECIFIC things they mentioned
18. BUILD CONNECTION: Find common ground, reference shared interests
19. ASK DEEP QUESTIONS: Move beyond small talk - passions, goals, values, what they're looking for
20. SHOW YOU'RE LISTENING: React to what they say - show interest, surprise, agreement

RESPONSE QUALITY (HUMAN-LIKE):
21. REACT NATURALLY: Show interest, surprise, agreement about SPECIFIC things they shared
22. Use emojis naturally (1-2 per message, not every message) - match the emotion
23. Keep responses SHORT (1 sentence, 10-20 words max) - concise but smart, like thoughtful texting
24. Be warm, friendly, authentic - like a real person on a first date
25. Use casual, conversational language - relaxed and natural
26. Don't be robotic - be relaxed, natural, and SPECIFIC
27. Match their energy - if they're excited, be excited; if they're chill, be chill
28. Reference EXACT details - show you're paying attention
29. Be proactive - engage with SPECIFIC questions about what they mentioned

CONTEXTUAL RESPONSES:
30. If they ask a question, answer DIRECTLY and SPECIFICALLY, then ask a related question
31. If they share something personal, acknowledge it SPECIFICALLY and show interest
32. If they're playful, match their energy with playful responses
33. If they're serious, be thoughtful and genuine
34. Remember topics discussed earlier and reference them NATURALLY
35. Every response should reference what they said or asked - show you're listening
36. If they mention a place/hobby/experience, ask SPECIFIC follow-ups about it

THOUGHTFUL RESPONSES:
37. Take time to think - like a real person considering what to say (4-10 seconds)
38. Be thoughtful and authentic - quality over speed
39. Show excitement about getting to know them - this is a first meeting!
40. Keep answers SHORT (10-20 words) but SMART and meaningful`

      const messages = [
        {
          role: 'system',
          content: systemPrompt
        },
        ...conversationHistory.slice(-8).map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        })),
        {
          role: 'user',
          content: userMessage
        }
      ]

      // Groq API endpoint
      const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
      
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'mixtral-8x7b-32768', // Smarter model for more human-like responses
          messages: messages,
          temperature: 0.9, // Higher for more natural, human-like variation
          max_tokens: 60, // Short, smart responses (10-20 words max)
          top_p: 0.95,
          frequency_penalty: 0.5, // Reduce repetition
          presence_penalty: 0.4 // Encourage more varied, context-aware responses
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.choices && data.choices[0]?.message?.content) {
          let responseText = data.choices[0].message.content.trim()
          
          // Clean up response (remove quotes if wrapped, fix formatting)
          responseText = responseText.replace(/^["']|["']$/g, '')
          responseText = responseText.replace(/\n+/g, ' ').trim()
          
          // Ensure it's not too long
          if (responseText.length > 200) {
            responseText = responseText.substring(0, 197) + '...'
          }
          
          return responseText
        }
      } else {
        // Log error for debugging
        const errorData = await response.text()
        console.error('Groq API error:', response.status, errorData)
      }
    } catch (error) {
      console.error('Groq API request failed:', error)
      // Groq failed, try other APIs or fallback
    }
  }

  // Try Hugging Face Inference API (free tier available)
  const HF_API_KEY = process.env.HUGGING_FACE_API_KEY
  if (HF_API_KEY) {
    try {
      const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: {
            past_user_inputs: conversationHistory.filter(m => m.role === 'user').slice(-3).map(m => m.content),
            generated_responses: conversationHistory.filter(m => m.role === 'assistant').slice(-3).map(m => m.content),
            text: userMessage
          },
          parameters: {
            max_length: 100,
            temperature: 0.7
          }
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.generated_text) {
          return data.generated_text.trim()
        }
      }
    } catch (error) {
      // API failed, use rule-based
    }
  }
  
  return null // No API available, use rule-based
}

