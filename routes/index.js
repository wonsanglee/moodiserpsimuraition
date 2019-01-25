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
   pool.query('SELECT row_to_json(t) FROM (SELECT id, name, customer, ordernumber, sunnyorderid, status FROM erporder ORDER BY id ASC) t', (error, results) => {
    if (error) {
      throw error
    }
/*    res.render('erporderlist', { records: results.records }); */
/*    res.status(200).json(results.rows)   */
      res.status(200).send(converTable_ERPList(req.protocol + '://' + req.get('host') + '/erporders',results.rows));
      

/*
console.log(results.rows);

    res.render('erporderlist', {
        records: results.rows    });
*/
  });
});

/* ERP Update   */
router.post('/erporders/:id', function(req, res, next) {

  const name = req.body.name;
  const code = req.body.code;
  const customer = req.body.customer;
  const ordernumber = req.body.ordernumber;
  const sunnyorderid = req.body.sunnyorderid;
  const status = req.body.status;
  
  /*const { name, code, customer, ordernumber, sunnyorderid, status } = req.body */
  const whereid = req.params.id;

  pool.query('UPDATE erporder set status = ($1) WHERE ID = ($2)', [status, whereid], (error, results) => {
    if (error) {
      throw error
    }
/* 1. call order sobject update
   2. call logistics post with datas  productname, customername, status
*/
    var sunnyOrder = nforce.createSObject('sunnyOrder__c');
    sunnyOrder.set('Id', sunnyorderid);
    sunnyOrder.set('sunnyOrderStatus__c', 'DeliveryStarted');

    org.update({ sobject: sunnyOrder })
        .then(function(){
            console.log('worked');
    })

/* Logistics Insert   */
    var headers = {
        'User-Agent':       'Super Agent/0.0.1',
        'Content-Type':     'application/json'
    }

    var options = {
        url: req.protocol + '://' + req.get('host') + '/logistics',
        method: 'POST',
        headers: headers,
        form: {"productname" : name, "customername" : customer, "sunnyorderid": sunnyorderid, "status" : "Delivery Started"}
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
  /* const { name, code, customer, ordernumber, sunnyorderid, status } = req.body */
  
  const name = req.body.name;
  const code = req.body.code;
  const customer = req.body.customer;
  const ordernumber = req.body.ordernumber;
  const sunnyorderid = req.body.sunnyorderid;
  const status = req.body.status;
  
  pool.query('INSERT INTO erporder (name, code, customer, ordernumber, sunnyorderid, status) VALUES ($1, $2, $3, $4, $5, $6)', [name, code, customer, ordernumber, sunnyorderid, status], (error, results) => {
    if (error) {
      throw error
    }
  res.redirect('/erporders');
  })
});

/* Logistics List     */
router.get('/logistics', function(req, res, next) {
   pool.query('SELECT row_to_json(t) FROM (SELECT id, productname, customername, sunnyorderid, status FROM logistics ORDER BY id ASC) t', (error, results) => {
    if (error) {
      throw error
    }
    //res.status(200).json(results.rows)   
    res.status(200).send(converTable_LogisticsList(req.protocol + '://' + req.get('host') + '/logistics',results.rows));
  });
});

/* Logistics Insert   */
router.post('/logistics', function(req, res, next) {

  const productname = req.body.productname;
  const customername = req.body.customername;
  const sunnyorderid = req.body.sunnyorderid;
  const status = req.body.status;
  
/*  const { productname, customername, sunnyorderid, status } = req.body */

  pool.query('INSERT INTO logistics (productname, customername, sunnyorderid, status) VALUES ($1, $2, $3, $4)', [productname, customername, sunnyorderid, status], (error, results) => {
    if (error) {
      throw error
    }

  res.redirect('/logistics');
  })
});

/* Logistics Update */
router.post('/logistics/:id', function(req, res, next) {
  /*const { sunnyorderid, status } = req.body */

  const sunnyorderid = req.body.sunnyorderid;
  const status = req.body.status;
  const whereid = req.params.id;

  pool.query('UPDATE logistics set status = ($1) WHERE ID = ($2)', [status, whereid], (error, results) => {
    if (error) {
      throw error
    }
  var sunnyOrder = nforce.createSObject('sunnyOrder__c');
  sunnyOrder.set('Id', sunnyorderid);
  sunnyOrder.set('sunnyOrderStatus__c', 'Delivered');

  org.update({ sobject: sunnyOrder })
        .then(function(){
            console.log('worked');
    })

  res.redirect('/logistics');
  })
});

/* Product List     */
router.get('/product', function(req, res, next) {
  org.query({ query: "Select Id, Name, sunnyProductCode__c, sunnyProductDesc__c, sunnyProductPrice__c, sunnyProductStock__c From sunnyProduct__c Order By sunnyProductCode__c" })
    .then(function(results){
//      res.render('index', { records: results.records });
    //res.status(200).json(results.records)  
    res.status(200).send(converTable_ProductList(req.protocol + '://' + req.get('host') + '/product',results.records));
//console.log(results);
//console.log(results.records);
    });
});

/* Product Update */
router.post('/product/:id', function(req, res, next) {

  var sunnyProduct = nforce.createSObject('sunnyProduct__c');
  sunnyProduct.set('Id', req.params.id);
  sunnyProduct.set('sunnyProductPrice__c', req.body.price);
  sunnyProduct.set('sunnyProductStock__c', req.body.stock);

  org.update({ sobject: sunnyProduct })
        .then(function(){
            console.log('worked');
    })

  res.redirect('/product');
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

function converTable_ERPList(_url, obj) {
  var _html_output = '<html><head><h3>Ildong Medicine Manufacture Factory System(ERP)</h3><title>ERP</title>';

  _html_output += '<style> table { width: 100%; border-top: 1px solid #444444; border-collapse: collapse; } th, td { border-bottom: 1px solid #444444; padding: 10px;} </style></head><p>';
  _html_output += '<img src=ildong_a.jpg>';
  _html_output += '<table><tr><td>ID</td><td>Product Name</td><td>Customer</td><td>Order Quantity</td><td>Order ID</td><td>Status</td><td>Start Delivery</td></tr>';
//  obj = JSON.parse(json);


  console.log(JSON.stringify(obj));
//  var _data_count = obj['rows'].length;

  var _data_count = obj.length;

  for (var i = 0;i < _data_count;i ++) {

    _id = obj[i]['row_to_json'].id;
    _name = obj[i]['row_to_json'].name;
    _customer = obj[i]['row_to_json'].customer;
    _ordernumber = obj[i]['row_to_json'].ordernumber;
    _sunnyorderid = obj[i]['row_to_json'].sunnyorderid;
    _status = obj[i]['row_to_json'].status;


    _html_output += '<tr><form method=\"post\" action=\"' + _url + '/' + _id + '\">';
    _html_output += '<td>';

    _html_output += '<input type=\"hidden\" name=\"name\" value=\"' + _name + '\">';
    _html_output += '<input type=\"hidden\" name=\"customer\" value=\"' + _customer + '\">';
    _html_output += '<input type=\"hidden\" name=\"ordernumber\" value=\"' + _ordernumber + '\">';
    _html_output += '<input type=\"hidden\" name=\"sunnyorderid\" value=\"' + _sunnyorderid + '\">';
    _html_output += '<input type=\"hidden\" name=\"status\" value=\"Delivery Started\">';

    _html_output += _id;
    _html_output += '</td><td>';
    _html_output += _name;
    _html_output += '</td><td>';
    _html_output += _customer;
    _html_output += '</td><td>';
    _html_output += _ordernumber;
    _html_output += '</td><td>';
    _html_output += _sunnyorderid;
    _html_output += '</td><td>';
    _html_output += _status;
    if (_status.trim() == 'Ordered') {
      _html_output += '</td><td><input type=\"submit\" value=\"Start Delivery\"></td></form></tr>\r\n';
    } else {
      _html_output += '</td><td><input type=\"submit\" value=\"Start Delivery\" disabled></td></form></tr>\r\n';
    }
    
  }
  _html_output += '</td></tr></table>';
  console.log(_html_output);
  return _html_output;
 
};


function converTable_LogisticsList(_url, obj) {
  var _html_output = '<html><head><h3>DHL Delivery Service</h3><title>DHL</title>';

  _html_output += '<style> table { width: 100%; border-top: 1px solid #444444; border-collapse: collapse; } th, td { border-bottom: 1px solid #444444; padding: 10px;} </style></head><p>';
  _html_output += '<img src=dhl_express_720x233.jpg height=>';
  _html_output += '<table><tr><td>ID</td><td>Product Name</td><td>Customer</td><td>Order ID</td><td>Status</td><td>Delivery Finished</td></tr>';
//  obj = JSON.parse(json);


//  console.log(JSON.stringify(obj));
//  var _data_count = obj['rows'].length;

  var _data_count = obj.length;

  for (var i = 0;i < _data_count;i ++) {

    _id = obj[i]['row_to_json'].id;
    _productname = obj[i]['row_to_json'].productname;
    _customername = obj[i]['row_to_json'].customername;
    _sunnyorderid = obj[i]['row_to_json'].sunnyorderid;
    _status = obj[i]['row_to_json'].status;


    _html_output += '<tr><form method=\"post\" action=\"' + _url + '/' + _id + '\">';
    _html_output += '<td>';

//    _html_output += '<input type=\"hidden\" name=\"name\" value=\"' + _productname + '\">';
//    _html_output += '<input type=\"hidden\" name=\"customer\" value=\"' + _customername + '\">';
    _html_output += '<input type=\"hidden\" name=\"sunnyorderid\" value=\"' + _sunnyorderid + '\">';
    _html_output += '<input type=\"hidden\" name=\"status\" value=\"Delivered\">';

    _html_output += _id;
    _html_output += '</td><td>';
    _html_output += _productname;
    _html_output += '</td><td>';
    _html_output += _customername;
    _html_output += '</td><td>';
    _html_output += _sunnyorderid;
    _html_output += '</td><td>';
    _html_output += _status;
    if (_status.trim() == 'Delivery Started') {
      _html_output += '</td><td><input type=\"submit\" value=\"Finish Delivery\"></td></form></tr>\r\n';
    } else {
      _html_output += '</td><td><input type=\"submit\" value=\"Delivered\" disabled></td></form></tr>\r\n';
    }
  }
  _html_output += '</td></tr></table>';
  console.log(_html_output);
  return _html_output;
};


function converTable_ProductList(_url, obj) {
  var _html_output = '<html><head><h3>Product Management</h3><title>Product</title>';

  _html_output += '<style> table { width: 100%; border-top: 1px solid #444444; border-collapse: collapse; } th, td { border-bottom: 1px solid #444444; padding: 10px;} </style></head><p>';
  _html_output += '<img src=201809121886331489_2.jpg height=>';
  _html_output += '<table><tr><td>ID</td><td>Product Name</td><td>Product Code</td><td>product Desc</td><td>Unit Price</td><td>Stock</td><td>Update</td></tr>';
//  obj = JSON.parse(json);


  //console.log(JSON.stringify(obj));
  
  obj = JSON.parse(JSON.stringify(obj));
  console.log(obj);
//  var _data_count = obj['rows'].length;

  var _data_count = obj.length;

  for (var i = 0;i < _data_count;i ++) {


console.log('id = ' + obj[i].id);
    _id = obj[i].id;
    _name = obj[i].name;
    _sunnyproductcode__c = obj[i].sunnyproductcode__c;
    _sunnyproductdesc__c = obj[i].sunnyproductdesc__c;
    _sunnyproductprice__c = obj[i].sunnyproductprice__c;
    _sunnyproductstock__c = obj[i].sunnyproductstock__c;


    _html_output += '<tr><form method=\"post\" action=\"' + _url + '/' + _id + '\">';
    _html_output += '<td>';


//    _html_output += '<input type=\"hidden\" name=\"price\" value=' + _sunnyproductprice__c + '>';
//    _html_output += '<input type=\"hidden\" name=\"stock\" value=' + _sunnyproductstock__c + '>';

    _html_output += _id;
    _html_output += '</td><td>';
    _html_output += _name;
    _html_output += '</td><td>';
    _html_output += _sunnyproductcode__c;
    _html_output += '</td><td>';
    _html_output += _sunnyproductdesc__c;
    _html_output += '</td><td>';
    //_html_output += _sunnyproductprice__c;
    _html_output += '<input type=\"text\" name=\"price\" value=' + _sunnyproductprice__c + '>';
    _html_output += '</td><td>';
    //_html_output += _sunnyproductstock__c;
    _html_output += '<input type=\"text\" name=\"stock\" value=' + _sunnyproductstock__c + '>';
    _html_output += '</td><td><input type=\"submit\" value=\"Modify\"></td></form></tr>\r\n';
    
  }
  _html_output += '</td></tr></table>';
  console.log(_html_output);
  return _html_output;
};

module.exports = router;
