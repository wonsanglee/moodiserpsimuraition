var express = require('express');
var router = express.Router();

var Promise = require("bluebird");

var nforce = require('nforce');
var org = require('../lib/connection');

var request = require('request');

const Pool = require('pg').Pool
const pool = new Pool({
  user: 'xclxbjpavasdsw',
  host: 'ec2-54-235-68-3.compute-1.amazonaws.com',
  database: 'ddkpvh8aebt8ev',
  password: 'aaa4ac7b07de3ea6013083cff4ec98b0a06c6a28175611f8861603e157986811',
  port: 5432,
})

/* home page. */
router.get('/', function(req, res, next) {

  org.query({ query: "Select Id, Name, Type, Industry, Rating From Account Order By LastModifiedDate DESC" })
    .then(function(results){
      res.render('index', { records: results.records });
console.log(results);
console.log(results.records);
    });

});

/* Display new account form */
router.get('/new', function(req, res, next) {
  res.render('new');
});

/* Creates a new the record */
router.post('/', function(req, res, next) {

  var acc = nforce.createSObject('Account');
  acc.set('Name', req.body.name);
  acc.set('Industry', req.body.industry);
  acc.set('Type', req.body.type);
  acc.set('AccountNumber', req.body.accountNumber);
  acc.set('Description', req.body.description);

  org.insert({ sobject: acc })
    .then(function(account){
      res.redirect('/' + account.id);
    })
});

/* Sunny Add... */
/* ERP List     */
router.get('/erporders', function(req, res, next) {
   pool.query('SELECT id, name, customer, ordernumber, sunnyorderid, status FROM erporder ORDER BY id ASC', (error, results) => {
    if (error) {
      throw error
    }
/*    res.render('erporderlist', { records: results.records }); */
    res.status(200).json(results.rows)   

/*
console.log(results.rows);

    res.render('erporderlist', {
        records: results.rows    });
*/
  });
});

/* ERP Update   */
router.post('/erporders/:id', function(req, res, next) {
  const { name, code, customer, ordernumber, sunnyorderid, status } = req.body
  const whereid = req.params.id;

  pool.query('UPDATE erporder set status = ($1) WHERE ID = ($2)', [status, whereid], (error, results) => {
    if (error) {
      throw error
    }
/* 1. call order sobject update
   2. call logistics post with datas  productname, customername, status

    var sunnyOrder = nforce.createSObject('sunnyOrder__c');
    sunnyOrder.set('Name', sunnyorderid);
    sunnyOrder.set('sunnyOrderStatus__c', 'Delivery Started');

    org.update({ sobject: sunnyOrder })
        .then(function(){
            console.log('worked');
//            res.redirect('/' + req.params.id);
    })
*/
    var headers = {
        'User-Agent':       'Super Agent/0.0.1',
        'Content-Type':     'application/json'
    }
//a030o00001GcHoQAAV
//"https://sunnytest-dev-ed.my.salesforce.com/services/data/v44.0/sobjects/sunnyOrder__c/a030o00001GcHoQAAV?_HttpMethod=PATCH"
    var options = {
        url: 'https://sunnytest-dev-ed.my.salesforce.com/services/data/v44.0/sobjects/sunnyOrder__c/'+ sunnyorderid + '?_HttpMethod=PATCH',
        method: 'POST',
        headers: headers,
        form: {"sunnyOrderStatus__c": "????????"}
    }

    // Start the request 
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 204) {
            // Print out the response body
            console.log(body)
            throw error
        }
    })

    var options = {
        url: 'https://sunnytest-dev-ed.my.salesforce.com/services/data/v44.0/sobjects/sunnyOrder__c/'+ sunnyorderid + '?_HttpMethod=PATCH',
        method: 'POST',
        headers: headers,
        form: {"sunnyOrderStatus__c": "????????"}
    }

    // Start the request 
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            // Print out the response body
            console.log(body)
            throw error
        }
    })
    
    res.redirect('/erporders');
  })
});

/* ERP Insert   */
router.post('/erporders', function(req, res, next) {
  const { name, code, customer, ordernumber, sunnyorderid, status } = req.body

  pool.query('INSERT INTO erporder (name, code, customer, ordernumber, sunnyorderid, status) VALUES ($1, $2, $3, $4, $5, $6)', [name, code, customer, ordernumber, sunnyorderid, status], (error, results) => {
    if (error) {
      throw error
    }
  res.redirect('/erporders');
  })
});

/* Logistics List     */
router.get('/logistics', function(req, res, next) {
   pool.query('SELECT id, productname, customername, status FROM logistics ORDER BY id ASC', (error, results) => {
    if (error) {
      throw error
    }
    res.status(200).json(results.rows)   
  });
});

/* Logistics Insert   */
router.post('/logistics', function(req, res, next) {
  const { productname, customername, status } = req.body

  pool.query('INSERT INTO logistics (productname, customername, status) VALUES ($1, $2, $3)', [productname, customername, status], (error, results) => {
    if (error) {
      throw error
    }

  res.redirect('/logistics');
  })
});

/* ERP Update */
router.post('/logistics', function(req, res, next) {
  const { productname, customername, status } = req.body

  pool.query('INSERT INTO logistics (productname, customername, status) VALUES ($1, $2, $3)', [productname, customername, status], (error, results) => {
    if (error) {
      throw error
    }

  res.redirect('/logistics');
  })
});
/* Sunny Add... */

/* Record detail page */
router.get('/:id', function(req, res, next) {
  // query for record, contacts and opportunities
  Promise.join(
    org.getRecord({ type: 'account', id: req.params.id }),
    org.query({ query: "Select Id, Name, Email, Title, Phone From Contact where AccountId = '" + req.params.id + "'"}),
    org.query({ query: "Select Id, Name, StageName, Amount, Probability From Opportunity where AccountId = '" + req.params.id + "'"}),
    function(account, contacts, opportunities) {
        res.render('show', { record: account, contacts: contacts.records, opps: opportunities.records });
    });
});

/* Display record update form */
router.get('/:id/edit', function(req, res, next) {
  org.getRecord({ id: req.params.id, type: 'Account'})
    .then(function(account){
      res.render('edit', { record: account });
    });
});

/* Display record update form */
router.get('/:id/delete', function(req, res, next) {

  var acc = nforce.createSObject('Account');
  acc.set('Id', req.params.id);

  org.delete({ sobject: acc })
    .then(function(account){
      res.redirect('/');
    });
});

/* Updates the record */
router.post('/:id', function(req, res, next) {

  var acc = nforce.createSObject('Account');
  acc.set('Id', req.params.id);
  acc.set('Name', req.body.name);
  acc.set('Industry', req.body.industry);
  acc.set('Type', req.body.type);
  acc.set('AccountNumber', req.body.accountNumber);
  acc.set('Description', req.body.description);

  org.update({ sobject: acc })
    .then(function(){
      res.redirect('/' + req.params.id);
    })
});

module.exports = router;
