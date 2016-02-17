function RerunFormatter(suite, log) {
  var Cucumber = require('../../cucumber');
  var path = require('path');
  var _ = require('lodash');

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
    var text = _.map(failures, function(lines, uri) {
      return uri + ':' + lines.join(':');
    }).join('\n');
    log(text);
  });
}

module.exports = RerunFormatter;
