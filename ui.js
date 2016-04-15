// ui.js

var application_root = __dirname,
    express = require('express'),
    http = require('http'),
    sys = require('sys'),
    ini = require('ini'),
    errorhandler = require('errorhandler'),
    bodyParser = require('body-parser'),
    path = require('path'),
    fs = require('fs'),
    methodOverride = require('method-override'),
    request = require('request'),
    mongo = require('mongojs')

////////////////////////////////////////////////////////// SETUP
var startup_start = process.hrtime() // start the spool up timer
var app = express();
var gc = ini.parse(fs.readFileSync('platoon-ui.conf', 'utf-8'))
var static = path.join(__dirname + '/static/')
var db = mongo(gc.db.url + '/cluster')


////////////////////////////////////////////////////////// ALLOW XSS / CORS
var allowCrossDomain = function(req, res, next) {
    /* 
        re-write headers to allow cross-domain access to our API's
    */
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
      res.header('Access-Control-Allow-Methods', '*');
      res.header('Access-Control-Allow-Headers', '*');
      res.header('Access-Control-Allow-Headers', 'X-Requested-With, Accept, Origin, Referer, User-Agent, Content-Type, Authorization');

      // intercept OPTIONS method
      if (req.method === 'OPTIONS') {
        res.send(200);
      }
      else {
        next();
      }
    };

    app.use(allowCrossDomain);   // make sure this is is called before the router
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}))
    app.use(methodOverride());
    app.use(errorhandler());
    app.use(express.static(path.join(application_root, "public")));

////////////////////////////////////////////////////////// PRIVATE
var ts = function () {
    /* 
        returns a timestamp as a string, useful for things
    */
    return Date().toString()
}

var load_config = function () {
    /*
        callable function to load the config file into variable 'gc'
    */
    gc = ini.parse(fs.readFileSync('platoon-ui.conf', 'utf-8'))
}

var log = function (msg) {
    /*
        logging function; outputs a timestamp and logging message to the log file
        defined in the global config. creates a new log if none exist. also writes
        to stdout for use with journald.
    */
    var timestamp = ts()
    // exists is dep'd in node 0.12, use fs.access in 0.12 !
    if (fs.existsSync(gc.global.log) == true) {
        fs.appendFileSync(gc.global.log, timestamp + ' :: ' + msg + '\n')
    } else {
        fs.writeFileSync(gc.global.log, timestamp + ' :: ' + msg + '\n')
    }
    console.log(timestamp + ' :: ' + msg)
    return
}

var get_servers = function (callback) { 
    db.collection('servers').find(function (err, data) {
        if (err) {
            log(err)
            db.close()
            return callback(err)
        } else {
            return callback(null, data)
        }
    })
}

var get_details = function (req, callback) {
    var tdb = mongo(gc.db.url + '/' + req.query.region).collection(req.query.cluster_id)
    tdb.find(function (err, data) {
        if (err) {
            return callback(err)
        } else {
            return callback(null, data)
        }
    })
}

////////////////////////////////////////////////////////// PUBLIC
app.use('/', express.static(static))

app.get('/getServers', function (req, res) {
    get_servers(function (err, data) {
        if (err) {
            log(err)
        } else {
            res.send(data)
        }
    })
})

app.get('/getDetails', function (req, res) {
    get_details(req, function (err, data) {
        if (err) {
            log(err)
        } else {
            res.send(data)
        }
    })
})

////////////////////////////////////////////////////////// SERVER

app.listen(gc.global.http_port, function(err) {
    if (err) {
        log(err)
    } else {
        app.listen(gc.global.api_port, function (err) {
            if (err) {
                log(err)
            } else {
                log('UI HTTP server listening on port ' + gc.global.http_port)
                log('UI API server listening on port ' + gc.global.api_port)
                log('UI spooled up in ' + (process.hrtime(startup_start)[1] / 1000000).toFixed(2) + 'ms')
            }
        })
    }
})