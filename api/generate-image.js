// Vercel serverless function for SDXL image generation
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

  const apiKey = process.env.REACT_APP_REPLICATE_API_TOKEN;
  
  if (!apiKey) {
    console.error('❌ REACT_APP_REPLICATE_API_TOKEN not found in environment variables');
    return res.status(500).json({ 
      error: 'Replicate API key not configured. Please check environment variables.' 
    });
  }

  try {
    const { prompt, negativePrompt, aspectRatio, guidanceScale, inferenceSteps, scheduler, seed, sourceImage, strength } = req.body;

    console.log('🎨 Generating image with SDXL:', { prompt, aspectRatio });

    // Get dimensions based on aspect ratio
    const getDimensions = (aspectRatio) => {
      switch (aspectRatio) {
        case '16:9':
          return { width: 1344, height: 768 };
        case '4:3':
          return { width: 1152, height: 896 };
        case '1:1':
        default:
          return { width: 1024, height: 1024 };
      }
    };

    const dimensions = getDimensions(aspectRatio || '1:1');
    
    // Prepare SDXL input parameters
    const sdxlInput = {
      prompt: prompt,
      width: dimensions.width,
      height: dimensions.height,
      guidance_scale: guidanceScale || 7.5,
      num_inference_steps: inferenceSteps || 50,
      seed: seed
    };

    // Add optional parameters
    if (negativePrompt) {
      sdxlInput.negative_prompt = negativePrompt;
    }

    if (scheduler && scheduler !== 'DPMSolverMultistep') {
      sdxlInput.scheduler = scheduler;
    }

    // Handle image-to-image
    if (sourceImage) {
      sdxlInput.image = sourceImage;
      if (strength) {
        sdxlInput.strength = strength;
      }
    }

    // Create prediction using Replicate API
    const REPLICATE_API_URL = 'https://api.replicate.com/v1/predictions';
    const SDXL_MODEL = 'stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc';

    const response = await fetch(REPLICATE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'SDXL-Image-Generator/1.0'
      },
      body: JSON.stringify({
        version: SDXL_MODEL,
        input: sdxlInput
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Replicate API error:', response.status, errorText);
      
      let errorMessage = `API error (${response.status})`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {}

      // Provide user-friendly error messages
      if (response.status === 401) {
        errorMessage = 'Invalid API key. Please check your Replicate API token.';
      } else if (response.status === 402) {
        errorMessage = 'Insufficient credits. Please add funds to your Replicate account.';
      } else if (response.status === 429) {
        errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
      }

      return res.status(response.status).json({ error: errorMessage });
    }

    const prediction = await response.json();
    console.log('✅ Prediction created:', prediction.id);

    if (!prediction.id) {
      return res.status(500).json({ error: 'Failed to create prediction: No prediction ID received' });
    }

    // Wait for the prediction to complete
    const result = await waitForPrediction(prediction.id, apiKey);
    
    if (!result.output) {
      return res.status(500).json({ error: 'SDXL generation failed: No output received' });
    }

    // Handle both single image and array of images
    let imageUrl;
    if (Array.isArray(result.output)) {
      imageUrl = result.output[0];
    } else if (typeof result.output === 'string') {
      imageUrl = result.output;
    } else {
      return res.status(500).json({ error: 'Unexpected output format from SDXL' });
    }

    // Return the generated image data
    const generatedImage = {
      id: `sdxl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url: imageUrl,
      prompt: prompt,
      timestamp: new Date().toISOString(),
      aspectRatio: aspectRatio || '1:1',
    };

    console.log('🖼️ SDXL generation successful:', generatedImage.id);
    return res.status(200).json(generatedImage);

  } catch (error) {
    console.error('❌ Server error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error during image generation' 
    });
  }
}

// Helper function to wait for prediction completion
async function waitForPrediction(predictionId, apiKey) {
  const REPLICATE_API_URL = 'https://api.replicate.com/v1/predictions';
  const maxAttempts = 120; // 10 minutes max
  let attempts = 0;
  
  console.log(`⏳ Waiting for prediction ${predictionId}...`);
  
  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`${REPLICATE_API_URL}/${predictionId}`, {
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Status check failed (${response.status}):`, errorText);
        throw new Error(`Failed to check prediction status: ${response.status} ${errorText}`);
      }

      const prediction = await response.json();
      console.log(`Prediction ${predictionId} status:`, prediction.status, 
        prediction.progress ? `(${Math.round(prediction.progress * 100)}%)` : '');
      
      if (prediction.status === 'succeeded') {
        console.log('✅ Prediction completed successfully');
        return prediction;
      } else if (prediction.status === 'failed') {
        console.error('❌ Prediction failed:', prediction.error);
        throw new Error(`SDXL generation failed: ${prediction.error || 'Unknown error'}`);
      } else if (prediction.status === 'canceled') {
        throw new Error('SDXL generation was canceled');
      }
      
      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, 3000)); // 3 seconds
      attempts++;
      
    } catch (error) {
      console.error(`Error checking prediction status (attempt ${attempts + 1}):`, error);
      
      if (attempts >= maxAttempts - 1) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 5000)); // 5 seconds
      attempts++;
    }
  }
  
  throw new Error('SDXL generation timed out after 10 minutes');
}