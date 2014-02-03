var parseconfig = require('./config'),
    amqp = require('amqplib'),
    when = require('when');

module.exports = function (options, callback) {
  
  var opts = parseconfig(options);
  var amqpSettings = {durable: true, autoDelete: false};

  amqp.connect(opts.endpoint).then(function(conn) {  
    process.once('SIGINT', function() { conn.close(); });

    // create a new channel
    return conn.createChannel().then(function(ch) {
      var ok;

      if (options.useDeadLettering) {
        // dead letter exchange
        ok = ch.assertExchange(opts.dlx, 'topic', amqpSettings);
        
        // dead leatter queue
        ok = ok.then(function() {
          console.log('Initialized', opts.dlx);
          return ch.assertQueue(opts.dlq, amqpSettings);
        });
        
        // binding dead letter queue to dead letter exchange
        ok = ok.then(function(qok) {
          var q = qok.queue;
          console.log('Initialized', q);
          return ch.bindQueue(q, opts.dlx, '#');
        });
      }

      // primary exchange
      ok = ch.assertExchange(opts.px, 'topic', amqpSettings);
      
      // primary queue
      ok = ok.then(function () {
        console.log('Initialized', opts.px);

        var settings = amqpSettings;
        if(options.useDeadLettering) {
          settings.arguments = { 'x-dead-letter-exchange': opts.dlx };
        }
        
        return ch.assertQueue(opts.pq, settings);
      })

      // bind primary queue to exchange
      ok = ok.then(function(qok) {
        var q = qok.queue;
        console.log('Initialized', q);
        return when.all(opts.bindings.map(function (key) {
          ch.bindQueue(q, opts.px, key);
        })).then(function () { return q; });
      });
      
      // consume messages from primary queue
      ok = ok.then(function() {
        var q = opts.pq;
        console.log('Subscribing to', q);
        return ch.consume(q, function (message) {
          callback(ch, message);
        });
      });

      return ok.then(function() {
        console.log('[*] Waiting for logs. To exit press CTRL+C.');
      });
    }).then(null, console.warn);
  });
};