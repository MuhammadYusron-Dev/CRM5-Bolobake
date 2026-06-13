const fs = require('fs');

async function testCatbox() {
  const fileData = fs.readFileSync('package.json');
  const blob = new Blob([fileData], { type: 'text/plain' });
  const formData = new FormData();
  formData.append('reqtype', 'fileupload');
  formData.append('fileToUpload', blob, 'package.json');

  console.log("Uploading to catbox...");
  const res = await fetch('https://catbox.moe/user/api.php', {
    method: 'POST',
    body: formData
  });

  const text = await res.text();
  console.log(res.status, res.statusText);
  console.log(text);
}

testCatbox();
