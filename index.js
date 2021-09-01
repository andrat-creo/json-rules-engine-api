const fs = require('fs');
const http = require('http');
const url = require('url');
const { Engine } = require('json-rules-engine')

/////////////////////////////////////////////////////////////
// FILES & RULES
/////////////////////////////////////////////////////////////
const PATH = './dev-data/request-body.json'

// Invoke Rules Engine 
let engine = new Engine()

// Define Rules (can - or even should - be an external JSON file)
engine.addRule({
  conditions: {
    any: [{
      all: [{
        fact: 'B2',
        operator: 'lessThanInclusive',
        value: 20
      }, {
        fact: 'B3',
        operator: 'greaterThanInclusive',
        value: 100
      }]
    }, {
      all: [{
        fact: 'B2',
        operator: 'greaterThanInclusive',
        value: 100
      }, {
        fact: 'B3',
        operator: 'lessThanInclusive',
        value: 20
      }]
    }]
  },
  event: {
    type: 'OverwriteB4Filed',
    params: {
      message: 'Change value of the field B4',
      value: '0'
    }
  }
})

/////////////////////////////////////////////////////////////
// SERVER
/////////////////////////////////////////////////////////////
const server = http.createServer((req, res) => {
  const { query, pathname } = url.parse(req.url, true);
    let data = '';
    let fetched;

    req.on('data', chunk => {
      data += chunk;
    })
    req.on('end', () => {
      // Queue asynchronious calls so they will be executed in an order
      fs.writeFile(PATH, `${data}`, 'utf-8', err => {
        console.log(`Request body has been written into a ${PATH}`);
        fs.readFile(PATH, 'utf-8', (err2, fetched) => {

          // Overview page
          if (pathname === '/') {
            res.writeHead(200, {
              'Content-type': 'text/html'
            });
          res.end('<h1>Hello. Please user api at /api</h1>');


          // API
          } else if (pathname === '/api') {
            console.log('Rules Engine API called!');
            res.writeHead(200, {
              'Content-type': 'application/json'
            });

            // Get some fields that will be used as facts for RE
            let modified = JSON.parse(fetched);
            let filedB2 = modified['params'][0];
            let filedB3 = modified['params'][1];

            let facts = {
              B2: filedB2['value'],
              B3: filedB3['value']
            };

            // Evaluate the Rules Engine with obtained facts and manipulate output
            engine
            .run(facts)
            .then(({ events }) => {
              events.map(event => {
                modified['params'][2]['value'] = event.params.value;
                console.log(`Rules Engine Message: ${event.params.message} to the value of ${event.params.value}`);
                res.end(JSON.stringify(modified));
              })
            });


          // Not found
          } else {
            res.writeHead(404, {
              'Content-type': 'text/html',
            });
          res.end('<h1>Page not found!</h1>');
          }
        });
      });
    });
});

server.listen(8000, '127.0.0.1', () => {
  console.log('Listening to requests on port 8000');
});
