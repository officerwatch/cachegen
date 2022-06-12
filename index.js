const https = require('https');
const fs = require('fs');
const axios = require('axios');
const { execSync } = require('child_process');

// this is for caching all objects in the blockchain data store
if (process.argv[2] == "--task" && process.argv[3] == "objectGetAll") {
  const data = JSON.stringify({
    // build request for graphql
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

  // https options
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

  // send request
  // TODO: convert to axois so it can refactored to use async/await
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

// this is for caching all ipfs json
// TODO: also query for objType and filter
// this currently will error out hard if ipfsHash points to media data
if (process.argv[2] == "--task" && process.argv[3] == "objectGetIpfs") {
  const data = JSON.stringify({
    // build query for graphql
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

  // send request
  // TODO: convert to axois so it can refactored to use async/await
  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (d) => { data += d; });
    res.on('end', async () => {
      try {
          let returnData = JSON.parse(data);
          for (const obj of returnData.data.objectGetAll)
          {
            cacheArray[obj.id] = {};
            // fetch data at the ipfs hash
            let ipfsData = await axios.get("https://ipfs.officer.watch/ipfs/" + obj.ipfsHash)
                                      .catch(function (err) {
                                        console.error("Unable to fetch -", err);
                                      });
            // add fetched data to generated json object
            cacheArray[obj.id] = ipfsData.data;
          }
          // write generated json to file
          fs.writeFileSync('ipfsCache.json', 
          JSON.stringify(cacheArray));

          // add generated file to ipfs
          /*
          try {
            let options = {stdio : 'pipe' };
            let ipfsExec = execSync('ipfs add ipfsCache.json', options);
            let newIpfsHash = execSync('ipfs add ipfsCache.json -q --only-hash');
            newIpfsHash = newIpfsHash.toString().trim();
            let mirrorExec = execSync('ipfs pin remote add --service=pinata --name=ipfsCache.json '+ newIpfsHash);
          } catch (ierr) {
            console.error("Unable to add to ipfs -", err);
          }
          */

          // TODO: add generated file to blockchain
          //
          // code goes here
          //
      } catch (err) {
          console.error(err);
      }
    });
  });

  req.on('error', (error) => { console.error(error); });
  req.write(data);
  req.end();
}