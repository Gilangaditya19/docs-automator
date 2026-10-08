import { Jimp } from 'jimp';

Jimp.read('src/assets/logo.png')
  .then(image => {
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
      const r = this.bitmap.data[idx + 0];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];
      
      const dist = Math.sqrt(Math.pow(255-r, 2) + Math.pow(255-g, 2) + Math.pow(255-b, 2));
      
      let alpha = 255;
      if (dist < 250) {
        alpha = (dist / 250) * 255;
      }
      
      this.bitmap.data[idx + 3] = Math.max(0, Math.min(255, alpha));
      
      if (alpha > 0 && alpha < 255) {
         const aNorm = alpha / 255;
         const trueR = (r - 255 * (1 - aNorm)) / aNorm;
         const trueG = (g - 255 * (1 - aNorm)) / aNorm;
         const trueB = (b - 255 * (1 - aNorm)) / aNorm;
         
         this.bitmap.data[idx + 0] = Math.max(0, Math.min(255, trueR));
         this.bitmap.data[idx + 1] = Math.max(0, Math.min(255, trueG));
         this.bitmap.data[idx + 2] = Math.max(0, Math.min(255, trueB));
      }
    });
    return image.write('src/assets/logo_transparent.png');
  })
  .then(() => console.log('Done'))
  .catch(err => console.error(err));
