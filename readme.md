# @sesteva/probe-server [![Build Status](https://travis-ci.com/sesteva/probe-server.svg?branch=master)](https://travis-ci.com/sesteva/probe-server)

>

## Install

```
$ npm i -D @sesteva/probe-server
```

```
$ yarn add -D @sesteva/probe-server
```

## Usage with Express

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
	console.log(`> Ready on http://localhost:${port}`);
});
```

## API

## License

MIT © [<%= name %>](https://github.com/<%= githubUsername %>)
