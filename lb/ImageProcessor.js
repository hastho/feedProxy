import svg2img from 'svg2img';

export class ImageProcessor
{
  constructor(imgManip, prefs, tools)
  {
    this.imgManip = imgManip;
    this.prefs = prefs;
    this.tools = tools;
  }

  async get(url, newWidth = null)
  {
    try
    {
      let imgBuffer = await this.tools.rFetch(url);

      if (url.includes('svg'))
      {
        imgBuffer = await imgBuffer.text();
        imgBuffer = await new Promise(function (resolve, reject)
        {
          svg2img(imgBuffer, function(error, buffer)
          {
            if (error) reject();
            resolve(buffer);
          });
        })
      }
      else
      {
        imgBuffer = await imgBuffer.arrayBuffer();
      }

      let image = await this.imgManip.read(imgBuffer);
      let w = image.bitmap.width; //  width of the image

      if (newWidth == null)
      {
        newWidth = (w < this.prefs.imagesSize) ? w : this.prefs.imagesSize;
      }
      image.resize(newWidth, this.imgManip.AUTO);

      if (this.prefs.imagesDither)
      {
        image.dither565();
      }
      const bin = await image.getBufferAsync(this.imgManip.MIME_GIF); // Returns Promise

      return bin;
    }
    catch (err)
    {
      console.log(err);
    }
  }

}

