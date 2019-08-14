# @flia/probe-metrics-server [![Build Status](https://travis-ci.com/sesteva/probe-server.svg?branch=master)](https://travis-ci.com/sesteva/probe-server)

<!-- TODO: add example of shutting down, add TOC, add tests, add more metrics based on those to oberserve, update example app -->

This module offers a companion api to report the state of your NodeJS app and present metrics to Prometheus.

## HTTP liveness probe /healthz/liveness

"Many applications running for long periods of time eventually transition to broken states, and cannot recover except by being restarted. Kubernetes provides liveness probes to detect and remedy such situations.

To perform a probe, the kubelet sends an HTTP GET request to the server that is running in the Container and listening on port 8080. If the handler for the server’s /healthz path returns a success code, the kubelet considers the Container to be alive and healthy. If the handler returns a failure code, the kubelet kills the Container and restarts it.

Any code greater than or equal to 200 and less than 400 indicates success. Any other code indicates failure."

## HTTP readiness probe /healthz/readiness

"Sometimes, applications are temporarily unable to serve traffic. For example, an application might need to load large data or configuration files during startup, or depend on external services after startup. In such cases, you don’t want to kill the application, but you don’t want to send it requests either. Kubernetes provides readiness probes to detect and mitigate these situations. A pod with containers reporting that they are not ready does not receive traffic through Kubernetes Services."

## Metrics /metrics

Metrics to observe:

- Error Rate: Because errors are user facing and immediately affect your customers.
- Response time: Because the latency directly affects your customers and business.
- Throughput: The traffic helps you to understand the context of increased
  error rates and the latency too.
- Saturation: It tells how "full" your service is. If the CPU usage is 90%, can your system handle more traffic?

Prometheus uses the HTTP pull model, which means that every application needs to expose a GET /metrics endpoint that can be periodically fetched by the Prometheus instance.

## Questions

### Why is this run on a different port instead of being added as new routes to my expressJs server for example?

Using a secondary port you can safely expose your primary without the complexity of making certain paths private.

In addition, you could be running something a server which we don't the api. Therefore we could not simply do "app.use"

## Usage

### Install

```
$ npm i @flia/probe-server
```

or

```
$ yarn add @flia/probe-server
```

### Requirements

The module expects PROBE_PORT to be an ENV variable. Otherwise it defaults to port 9000

### API

- probe.isReady() returns readiness status
- probe.isShuttingDown() returns if the server is shutting down
- probe.emitNotReady() updates the status to NOT ready
- probe.emitReady() updates the status to ready
- probe.emitShutdown() updates the status to 'is shutting down'

### Usage with Express

You can see a full example in the "example" folder on this repo.

```js
const probes = require("@flia/probe-server");
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

## License

MIT © [sesteva](https://github.com/sesteva)
