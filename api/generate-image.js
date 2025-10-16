// Vercel serverless function for FREE image generation
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // No API key needed for free services!

  try {
    const { prompt, aspectRatio } = req.body;

    // Validate input
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Prompt is required and must be a non-empty string' });
    }

    console.log('🎨 Generating FREE image:', { prompt: prompt.trim(), aspectRatio });

    // Get dimensions based on aspect ratio
    const getDimensions = (aspectRatio) => {
      switch (aspectRatio) {
        case '16:9':
          return { width: 768, height: 432 };
        case '4:3':
          return { width: 640, height: 480 };
        case '1:1':
        default:
          return { width: 512, height: 512 };
      }
    };

    const dimensions = getDimensions(aspectRatio || '1:1');
    
    // Generate image using Pollinations AI
    console.log('🎨 Starting Pollinations AI generation...');
    const generatedImage = generateWithPollinations(prompt.trim(), dimensions);
    
    if (!generatedImage || !generatedImage.url) {
      throw new Error('Failed to generate image - no URL returned');
    }
    
    console.log('✅ Image generation complete');
    console.log('Image ID:', generatedImage.id);
    
    return res.status(200).json({
      ...generatedImage,
      prompt: prompt.trim(),
      aspectRatio: aspectRatio || '1:1',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Server error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error during image generation' 
    });
  }
}

// Pollinations AI - 100% Free AI Image Generation
function generateWithPollinations(prompt, dimensions) {
  // Validate inputs
  if (!prompt || !dimensions || !dimensions.width || !dimensions.height) {
    throw new Error('Invalid prompt or dimensions provided');
  }

  const enhancedPrompt = prompt + ', high quality, detailed';
  const encodedPrompt = encodeURIComponent(enhancedPrompt);
  const seed = Math.floor(Math.random() * 1000000);
  
  // Build Pollinations AI URL with optimized parameters
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${dimensions.width}&height=${dimensions.height}&seed=${seed}&enhance=true&nologo=true`;
  
  console.log('✅ Generated Pollinations URL');
  console.log('Prompt:', prompt.substring(0, 50) + (prompt.length > 50 ? '...' : ''));
  console.log('Dimensions:', dimensions);
  console.log('Seed:', seed);
  
  return {
    id: `pollinations_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    url: imageUrl
  };
}
