const fetch = require('node-fetch');

const BOT_TOKEN = "8937016793:AAG9mcEjxXh7GEY3m-c-8SuzdCaKTA5tw9M"; // Your Telegram Bot Token

export default async function handler(req, res) {
  // Allow CORS from anywhere
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { fileId, fileName } = req.query;
    if (!fileId) {
      return res.status(400).send('Missing fileId parameter.');
    }

    // 1. Get the temporary file path from Telegram
    const pathRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`);
    const pathData = await pathRes.json();
    
    if (!pathData.ok || !pathData.result.file_path) {
      return res.status(500).send('Failed to resolve file path from Telegram.');
    }

    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${pathData.result.file_path}`;

    // 2. Fetch the actual file binary stream from Telegram
    const response = await fetch(fileUrl);
    if (!response.ok) {
      return res.status(500).send('Failed to stream file from Telegram servers.');
    }

    // 3. Force browser safe download headers so it saves as an uncorrupted file
    const safeFileName = fileName || 'apml-media-asset';
    res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}"`);
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/octet-stream');

    // 4. Stream the data directly to the client
    const buffer = await response.buffer();
    return res.status(200).send(buffer);

  } catch (err) {
    console.error("Proxy Error:", err);
    return res.status(500).send('Internal Server Error: ' + err.message);
  }
}
