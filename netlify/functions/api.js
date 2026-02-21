// Netlify Serverless Function - API Gateway
// This proxies requests to your backend API or handles them directly

const axios = require('axios');

// Backend API URL (can be hosted separately on Render, Railway, etc.)
const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:8000';

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      },
      body: '',
    };
  }

  try {
    // Extract path and remove /api prefix
    const path = event.path.replace('/.netlify/functions/api', '');
    
    // Forward request to backend
    const response = await axios({
      method: event.httpMethod,
      url: `${BACKEND_URL}${path}`,
      data: event.body ? JSON.parse(event.body) : undefined,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': event.headers.authorization || '',
      },
      params: event.queryStringParameters,
    });

    return {
      statusCode: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(response.data),
    };
  } catch (error) {
    console.error('API Error:', error.message);
    
    return {
      statusCode: error.response?.status || 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: error.message,
        details: error.response?.data || 'Internal server error',
      }),
    };
  }
};
