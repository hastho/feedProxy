import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";
import { Tools } from "./Tools.js";

export class FeedSniffer
{
  constructor(rssHintTable)
  {
    // our RSS hints
    this.rssHintTable = rssHintTable;

    // candidates & more
    this.types = ['application/rss+xml', 'application/atom+xml'];
    this.usualSuspects = ['/feed.xml', '/rss.xml', '/feed', '/rss', '/atom.xml', '/.rss'];

    // the return value
    this.feeds = [];
  }

  async get(url)
  {
    try
    {
      this.checkHintTable(url);

      if (this.feeds.length == 0)
      {
        await this.checkTheDom(url);

        if (this.feeds.length == 0)
        {
          await this.checkSuspects(url);
        }
      }

      // remove duplicates
      const feeds = [...new Set(this.feeds)];

      return feeds;
    }
    catch (err)
    {
      console.log(err);
    }
  }

  async checkTheDom(url)
  {
    console.log('Checking the DOM of:', url);
    const tools = new Tools();
    const tld = tools.tldFromUrl(url);

    try
    {
      const response = await fetch(url);
      if (response.ok)
      {
        const text = await response.text();
        const doc = new DOMParser().parseFromString(text, "text/html");
        const nodes = doc.querySelectorAll('link'); //link[rel="alternate"]  // FIXME on zeit.de/index
        let feedURL = '';

        nodes.forEach((node) =>
        {
          if (this.types.includes(node.getAttribute('type')))
          {
            const href = node.getAttribute('href');
            if (!href.startsWith('http'))
            {
              feedURL = (href.startsWith('/')) ? tld + href : tld + '/' + href;
            }
            else
            {
              feedURL = href;
            }
            console.log('...adding URL:', feedURL);
            this.feeds.push(feedURL);
          }
        });
      }
    }
    catch(err)
    {
      console.log(err);
    }
  }

  async checkSuspects(url)
  {
    const tools = new Tools();
    console.log('Checking the usual suspects for:', url);
    for (const suspect of this.usualSuspects)
    {
      try
      {
        if (await tools.isRss(url + suspect))
        {
          this.feeds.push(url + suspect);
          console.log(`... adding URL ${url + suspect}.`);
        }
      }
      catch(err)
      {
        console.log(err);
      }
    }
  }

  checkHintTable(url)
  {
    console.log('Checking the hint table for:', url);
    for (const elem of this.rssHintTable)
    {
      const elemURL = elem.url.replace(/\/$/, '');

      if (url == elemURL)
      {
        this.feeds.push(elem.feedUrl);
        console.log('...adding: ', elem.feedUrl);
        break;
      }
    }
  }

}
