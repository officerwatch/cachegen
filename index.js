const https = require('https');
const fs = require('fs');
const axios = require('axios');

if (process.argv[2] == "--task" && process.argv[3] == "objectGetAll") {
  const data = JSON.stringify({
    query: `{
              objectGetAll {
                  id
                  objType
                  name
                  ipfsHash
                  parent
                  children
              }
            }`,
  });

  const options = {
    hostname: 'graphql.officer.watch',
    path: '/graphql',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
      'User-Agent': 'Node',
    },
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (d) => { data += d; });
    res.on('end', () => {
      try {
          let returnData = JSON.parse(data);
          fs.writeFileSync('objCache.json', 
          JSON.stringify(returnData.data.objectGetAll));
      } catch (err) {
          console.error(err);
      }
    });
  });

  req.on('error', (error) => { console.error(error); });
  req.write(data);
  req.end();
}

if (process.argv[2] == "--task" && process.argv[3] == "objectGetIpfs") {
  const data = JSON.stringify({
    query: `{
              objectGetAll {
                  id
                  ipfsHash
              }
            }`,
  });

  const options = {
    hostname: 'graphql.officer.watch',
    path: '/graphql',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
      'User-Agent': 'Node',
    },
  };


  var cacheArray = {};
  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (d) => { data += d; });
    res.on('end', async () => {
      try {
          let returnData = JSON.parse(data);
          for (const obj of returnData.data.objectGetAll)
          {
            cacheArray[obj.id] = {};
            let ipfsData = await axios.get("https://ipfs.officer.watch/ipfs/" + obj.ipfsHash)
                                      .catch(function (err) {
                                        console.log("Unable to fetch -", err);
                                      });
            cacheArray[obj.id] = ipfsData.data;
          }
          fs.writeFileSync('ipfsCache.json', 
          JSON.stringify(cacheArray));
          //console.log(cacheArray);
      } catch (err) {
          console.error(err);
      }
    });
  });

  req.on('error', (error) => { console.error(error); });
  req.write(data);
  req.end();
}