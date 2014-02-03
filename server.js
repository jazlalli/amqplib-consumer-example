var consume = require('./consumer');

var options = {
  source: 'MySource',
  channel: 'MyChannel',
  queue: 'MyQueue',
  bindings: ['#'],
  useDeadLettering: true
};

var route = function (key, msg, callback) {
  // do some async stuff with the msg

  callback();
};

// GO
consume(options, function (channel, message) {
  
  // extract routingkey and deserialize payload  
  var routingKey = message.fields.routingKey;
  var msgStr = message.content.toString();
  var data = JSON.parse(msgStr);

  // dummy implementation for this example - data is routed to a handler
  route(routingKey, data, function (error) {
    if (error) {
      channel.nack(message, false, false);
      console.log(routingKey + ' message routed to DLX');
    } else {
      channel.ack(message);
    }
  });

});

console.log('Consumer process started');

process.on('exit', function () {
  console.log('Consumer process exiting');
});