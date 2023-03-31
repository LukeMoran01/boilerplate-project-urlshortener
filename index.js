require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const dns = require('dns');
const mongoose = require('mongoose')

// Basic Configuration
const port = process.env.PORT || 3000;

mongoose.connect(process.env['MONGO_URI'], { useNewUrlParser: true, useUnifiedTopology: true });

// USE ID AS SHORTENER AND ALWAYS FIND LATEST ID
// CREATE GET ON /api/shorturl/:shortener that routes to og url

const urlSchema = new mongoose.Schema({
  originalUrl: {
    type: String,
    required: true
  },
  shortUrl: {
    type: Number,
    required: true
  }
})

const URL = mongoose.model('URLS', urlSchema);

// Query how many entries and return entries + 1 to get next shortUrl number
const nextNum = async () => {
  let docs = await URL.find({}).exec();
  return docs.length + 1;
}

const saveUrl = (originalUrl, nextUrl) => {
  var newUrl = new URL({
    originalUrl: originalUrl,
    shortUrl: nextUrl
  });
  newUrl.save()
}

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));
app.use(bodyParser.urlencoded({extended: false}));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', (req, res) => {
  let url = req.body.url;
  // return console.log(url)
  // if (!/https:\/\/|http:\/\//.test(url)) return res.json({"error": 'invalid url'});
  dnsUrl = url.replace(/https?:\/\//,'').replace(/\/.*/, '')
  dns.lookup(dnsUrl, async (err, addr, family) => {
    if (err) {
      console.error(err);
      return res.json({
      "error": 'invalid url'
      });
    }
    
    let nextUrl = await nextNum();

    saveUrl(url, nextUrl);
    
    return res.json({
      'original_url': url,
      'short_url': nextUrl
    });
  })
})

app.get('/api/shorturl/:urlId', async (req, res) => {
  const id = +req.params.urlId;
  if (isNaN(id)) return;
  const urlDoc = await URL.findOne({shortUrl: id})
  if (urlDoc == null) return
  res.redirect(urlDoc.originalUrl);
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
