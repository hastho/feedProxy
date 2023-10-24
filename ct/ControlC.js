import os                     from 'os';
import fs                     from 'fs';
import imgManip               from 'jimp';
import { JSDOM as dom }       from 'jsdom';
import * as feedExtractor     from '@extractus/feed-extractor'
import * as articleExtractor  from '@extractus/article-extractor'
import * as html5entities     from 'html-entities';
import iconvLite              from 'iconv-lite';

import { TsvImp }             from '../lb/TsvImp.js';
import { FeedSniffer }        from '../lb/FeedSniffer.js';
import { MetadataScraper }    from '../lb/MetadataScraper.js';
import { FeedReader }         from '../lb/FeedReader.js';
import { Preview }            from '../lb/Preview.js';
import { Transcode }          from '../lb/Transcode.js';
import { ImageProcessor }     from '../lb/ImageProcessor.js';
import { Passthrough }        from '../lb/Passthrough.js';

import { Html3V }             from '../vw/Html3V.js';

export class ControlC
{

  constructor(tools)
  {
    this.tools = tools;
    this.rssHintTable = null;
    this.homedir = os.homedir()+'/.feedProxy/';

    this.rssHintTableFile = this.homedir+'feedProxySheet.csv';
    if (!fs.existsSync(this.rssHintTableFile))
    {
      this.rssHintTableFile = './config/feedProxySheet.csv';
    }

    this.prefsFile = this.homedir+'prefs.json';
    if (!fs.existsSync(this.prefsFile))
    {
      this.prefsFile = './config/prefs.json';
    }
  }

  async init()
  {
    const rawTable = await this.tools.readFile(this.rssHintTableFile);
    this.rssHintTable = new TsvImp().fromTSV(rawTable);

    this.prefs = JSON.parse(await this.tools.readFile(this.prefsFile));

    const transcode = new Transcode(this.prefs, html5entities, iconvLite);

    this.view = new Html3V(this.prefs, transcode);
  }

  async passthroughC(res, url)
  {
    try
    {
      console.log('processing as passthrough', url);

      const ret = await new Passthrough(this.tools).get(url);

      res.writeHead(200, {'Content-Type': ret.conType});
      res.end(ret.bin);

      return true;
    }
    catch (err)
    {
      console.log(err);
      return false;
    }
  }

  async imageProxyC(res, url)
  {
    try
    {
      console.log('processing as image', url);

      const bin = await new ImageProcessor(imgManip, this.prefs, this.tools).get(url);
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

  async feedContentC(res, url)
  {
    try
    {
      console.log('processing as feed content', url);

      const feedReader = new FeedReader(feedExtractor, this.tools);
      const feed = await feedReader.get(url);

      console.log('feed read successfully');
      this.tools.log.log(feed);

      const html = this.view.drawArticlesForFeed(feed);

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

  async overviewC(res, url)
  {
    try
    {
      const feedSniffer = new FeedSniffer(this.rssHintTable, dom, this.tools);
      const metadataScraper = new MetadataScraper(dom, this.tools);

      const feeds = await feedSniffer.get(url);
      console.log('feeds found', feeds);

      if (feeds.length > 0)
      {
        console.log('processing overview as feed', url);

        const meta = await metadataScraper.get(url);
        console.log('page metadata read', meta);

        const feedReader = new FeedReader(feedExtractor, this.tools);
        const feed = await feedReader.get(feeds[0]);

        console.log('feed read successfully');
        this.tools.log.log(feed);

        const html = this.view.drawArticlesForFeed(feed, meta.image);

        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(html);

        return true;
      }

      return false;
    }
    catch(err)
    {
      console.log(err);
      return false;
    }
  }

  async previewC(res, url)
  {
    try
    {
      console.log('processing page as preview', url);

      const pageObj = await new Preview(articleExtractor, this.tools).get(url);
      this.tools.log.log('returned preview object', pageObj);

      const html = this.view.drawPreview(pageObj);
      this.tools.log.log('returned preview html', html);

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

  emptyC(res, url)
  {
    try
    {
      console.log('processing as empty', url);

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

}
