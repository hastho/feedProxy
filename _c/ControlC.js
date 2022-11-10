import fetch                from 'node-fetch';

export class ControlC
{

  emptyC(res)
  {
    try
    {
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end('');

      return true;
    }
    catch (err)
    {
      console.log(err);
      return false;
    }
  }

  async feedContentC(view, rssReader, res, url)
  {
    try
    {
      const feed = await rssReader.read(url);
      console.log('Feed read successfully.');

      const html = view.drawArticlesForFeed(feed);

      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(html);

      return true;
    }
    catch(err)
    {
      console.log(err);
      return false;
    }
  }

  async imageProxyC(res, url)
  {
    try
    {
      //img = 'http://www.meyerk.com/geos/tools/2gif.php?file='+encodeURIComponent(img)+'&width='+newWidth;
      const newUrl = 'http://hasenbuelt.synology.me/geos/tools/2gif.php?file='+encodeURIComponent(url)+'&width=128';
      const response = await fetch(newUrl);
      let bin = await response.arrayBuffer();
      bin = Buffer.from(new Uint8Array(bin));

      res.writeHead(200, {'Content-Type': 'image/gif'});
      res.end(bin, 'binary');

      return true;
    }
    catch (err)
    {
      console.log(err);
      return false;
    }
  }

  async overviewC(view, feedSniffer, metadataScraper, res, url)
  {
    try
    {
      const feeds = await feedSniffer.get(url);
      console.log('Feeds found: ', feeds);

      const meta = await metadataScraper.get(url);
      console.log('Page metadata read: ', meta);

      const html = view.drawOverview(url, meta, feeds);

      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(html);

      return true;
    }
    catch(err)
    {
      console.log(err);
      return false;
    }
  }

  async passthroughC(req, res, url)
  {
    try
    {
      let bin = null;
      const response = await fetch(url);
      const conType = response.headers.get("content-type");

      bin = await response.arrayBuffer();
      bin = Buffer.from(new Uint8Array(bin));

      res.writeHead(200, {'Content-Type': conType});
      res.end(bin);

      return true;
    }
    catch (err)
    {
      console.log(err);
      return false;
    }
  }

  async previewC(view, articleParser, res, url)
  {
    try
    {
      const extractHTMLOptions =
      {
        allowedTags: [ 'p', 'span', 'em', 'ul', 'ol', 'li', 'strong', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'h7' ]
      }
      articleParser.setSanitizeHtmlOptions(extractHTMLOptions);

      const resp = await fetch(url);
      const text = await resp.text();
      const pageObj = await articleParser.extract(text);
      const html = view.drawPreview(pageObj);

      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(html);

      return true;
    }
    catch (err)
    {
      console.log(err);
      return false;
    }
  }
}
