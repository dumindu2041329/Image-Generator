// Test script for SDXL API - Run with: node test-sdxl.js
const fetch = require('node-fetch');

const API_TOKEN = process.env.REACT_APP_REPLICATE_API_TOKEN || 'your_api_token_here';
const REPLICATE_API_URL = 'https://api.replicate.com/v1/predictions';
const SDXL_MODEL = 'stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc';

async function testSDXL() {
  console.log('🧪 Testing SDXL API...');
  console.log('API Token available:', !!API_TOKEN && API_TOKEN !== 'your_api_token_here');
  
  if (!API_TOKEN || API_TOKEN === 'your_api_token_here') {
    console.error('❌ Please set your REACT_APP_REPLICATE_API_TOKEN');
    return;
  }

  try {
    // Test 1: Check API key
    console.log('\n📡 Testing API connection...');
    const testResponse = await fetch('https://api.replicate.com/v1/models', {
      headers: {
        'Authorization': `Token ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!testResponse.ok) {
      console.error('❌ API Key test failed:', testResponse.status, testResponse.statusText);
      return;
    }
    console.log('✅ API Key is valid');

    // Test 2: Create prediction
    console.log('\n🎨 Creating SDXL prediction...');
    const prediction = await fetch(REPLICATE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: SDXL_MODEL,
        input: {
          prompt: 'A beautiful sunset over mountains, photorealistic',
          width: 1024,
          height: 1024,
          guidance_scale: 7.5,
          num_inference_steps: 20
        }
      })
    });

    if (!prediction.ok) {
      const errorText = await prediction.text();
      console.error('❌ Prediction creation failed:', prediction.status, errorText);
      return;
    }

    const predictionData = await prediction.json();
    console.log('✅ Prediction created:', predictionData.id);
    console.log('Status:', predictionData.status);
    
    if (predictionData.status === 'succeeded') {
      console.log('🖼️  Image URL:', predictionData.output);
    } else {
      console.log('⏳ Prediction is processing. Check Replicate dashboard for updates.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSDXL();