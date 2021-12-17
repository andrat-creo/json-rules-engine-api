const fs = require('fs');
const http = require('http');
const url = require('url');
const { Engine } = require('json-rules-engine');
const flamcoRule = require("./rules/flamco-metadata-rule");
const userAuthRule = require("./rules/user-authorized-rule");
 
/////////////////////////////////////////////////////////////
// FILES & RULES
/////////////////////////////////////////////////////////////
const PATH = 'app/dev-data/request-body.json'
const RULE_PATH = 'app/rules/flamco-metadata-rule.json'

console.log(`Read rule: ${flamcoRule["event"]["type"]}`)
console.log(`Read rule: ${userAuthRule["event"]["type"]}`)

// Invoke Rules Engine 
let engine = new Engine()
engine.addRule(flamcoRule);
engine.addRule(userAuthRule);

/////////////////////////////////////////////////////////////
// SERVER
/////////////////////////////////////////////////////////////
const server = http.createServer((req, res) => {
  const { query, pathname } = url.parse(req.url, true);
    let data = '';
    
    req.on('data', chunk => {
      data += chunk;
    })
    req.on('end', () => {
      // Overview page
      if (pathname === '/') {
        res.writeHead(200, {
          'Content-type': 'text/html'
        });
      res.end('<h1>Hello. Please use API at: /api</h1>');
      }

      // API 
      else if (pathname === '/api') {
        console.log('Rules Engine API called!');
        // fs.writeFile(PATH, data, 'utf-8', err => {
        //   console.log(`Request body has been written into a ${PATH}`);
        // });

        // Get some fields that will be used as facts for RE
        const request_facts = JSON.parse(data);
        const userGroup = request_facts['userGroup'];
        const isUserAuthorized = request_facts['isUserAuthorized'];

        const facts = {
          userGroup: userGroup,
          userAuthorized: isUserAuthorized
        };

        res.writeHead(200, {
          'Content-type': 'application/json'
        });

      // Evaluate the Rules Engine with obtained facts and manipulate output
      engine
      .run(facts)
      .then((events) => {
        if (events["almanac"]["events"]["failure"].length > 0) {
          console.log(`There's been failures when evaluating rules....`);
          events["almanac"]["events"]["failure"].map( (failure) => (
            console.log(`----> Type: ${failure["type"]}, Message: ${failure["params"]["message"]}`)
          ));
          res.end(JSON.stringify( {errorMessage: "Failure during facts validation"} ));
        }
        else {
          console.log(events)
          const userFiledsRule = events["almanac"]["events"]["success"]
            .filter( (success) => (
              success["type"] === flamcoRule["event"]["type"]
          ));
          res.end(JSON.stringify(userFiledsRule[0]["params"]["value"]));
        }
        })
    }

      // Not found
      else {
        res.writeHead(404, {
          'Content-type': 'text/html',
        });
        res.end('<h1>Page not found!</h1>');
      }
    });
});

server.listen(8000, '0.0.0.0', () => {
  console.log('Listening to requests on port 8000');
});
