# @sesteva/probe-server [![Build Status](https://travis-ci.com/sesteva/probe-server.svg?branch=master)](https://travis-ci.com/sesteva/probe-server)

>

## Install

```
$ npm i -D @sesteva/probe-server
```

```
$ yarn add -D @sesteva/probe-server
```

## Requirements

The module expects PROBE_PORT to be an ENV variable. Otherwise it defaults to port 9000

## Usage with Express

You can see a full example in the "example" folder on this repo.

```js
const probes = require("@sesteva/probe-server");
const Prometheus = require("prom-client");

const metricsInterval = Prometheus.collectDefaultMetrics();
const httpRequestDurationMicroseconds = new Prometheus.Histogram({
	name: "http_request_duration_ms",
	help: "Duration of HTTP requests in ms",
	labelNames: ["method", "route", "code"],
	buckets: [0.1, 5, 15, 50, 100, 200, 300, 400, 500] // buckets for response time from 0.1ms to 500ms
});

const probeServer = probes(Prometheus);

server.listen(port, err => {
	probeServer.signalReady();
	if (err) throw err;
	console.info(`> Ready on http://localhost:${port}`);
});
```

## Credits

Insipired by [Lightship](https://github.com/gajus/lightship)

## License

MIT © [sesteva](https://github.com/sesteva)
