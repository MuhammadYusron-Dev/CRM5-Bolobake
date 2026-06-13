const fs = require('fs');

async function testFreeImage() {
  const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  
  const body = new URLSearchParams();
  body.append('image', base64Data);
  body.append('type', 'base64');

  console.log("Uploading to Imgur...");
  const res = await fetch('https://api.imgur.com/3/image', {
    method: 'POST',
    body: body,
    headers: {
      'Authorization': 'Client-ID 546c25a59c58ad7'
    }
  });

  const data = await res.json();
  console.log(res.status, res.statusText);
  console.log(data);
}

testFreeImage();
