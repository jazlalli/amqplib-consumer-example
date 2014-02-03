module.exports = function (options) {
  var opts = {};
  opts.endpoint = process.env.AMQP_URL || '<amqp url>';

  // default queue name
  if (!options.queue) {
    options.queue = 'DefaultQueue'
  }

  // default binding key
  if (!options.bindings || options.bindings.length == 0) {
    options.bindings = ['#']
  }

  // primary exchange & queue details
  opts.px = 'MyExchange';
  opts.pq = options.queue;
  opts.bindings = options.bindings;

  // dead letter details
  if (options.useDeadLettering) {
    if (!options.source) {
      throw new Error('source is required if using dead lettering');
    }

    if (!options.channel) {
      throw new Error('channel is required if using dead lettering');
    }

    opts.dlx = [options.source, options.channel, 'DLX'].join('.');
    opts.dlq = [options.source, options.channel, 'DLQ'].join('.');
  }

  return opts;
};