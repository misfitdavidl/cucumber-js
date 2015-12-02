function RerunFormatter(suite, log) {
  var Cucumber = require('../../cucumber');
  var path = require('path');

  var failures = {};

  suite.on('ScenarioResult', function(scenarioResult) {
    if (scenarioResult.getStatus() === Cucumber.Status.FAILED) {
      var scenario = scenarioResult.getScenario();
      var uri = path.relative(process.cwd(), scenario.getUri());
      var line = scenario.getLine();
      if (!failures[uri]) {
        failures[uri] = [];
      }
      failures[uri].push(line);
    }
  });

  suite.on('AfterFeatures', function() {
    for (var uri in failures) {
      log(uri + ':' + failures[uri].join(':') + '\n');
    }
  });
}

module.exports = RerunFormatter;
