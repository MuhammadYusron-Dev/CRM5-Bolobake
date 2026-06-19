const { Jimp } = require("jimp");

async function removeBlackBackground(inputPath, outputPath) {
  try {
    const image = await Jimp.read(inputPath);
    
    // Set tolerance for black color (0-255). 
    // JPG compression artifacts mean black isn't always pure 0,0,0
    const tolerance = 20;

    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
      const red = this.bitmap.data[idx + 0];
      const green = this.bitmap.data[idx + 1];
      const blue = this.bitmap.data[idx + 2];

      // If the pixel is dark enough, make it transparent
      if (red < tolerance && green < tolerance && blue < tolerance) {
        this.bitmap.data[idx + 3] = 0; // alpha to 0
      }
    });

    await image.write(outputPath);
    console.log(`Processed ${inputPath} -> ${outputPath}`);
  } catch (err) {
    console.error(`Failed to process ${inputPath}:`, err);
  }
}

async function main() {
  await removeBlackBackground("./public/assets/pastries/user_donut.jpg", "./public/assets/pastries/user_donut.png");
  await removeBlackBackground("./public/assets/pastries/user_bagel.jpg", "./public/assets/pastries/user_bagel.png");
}

main();
