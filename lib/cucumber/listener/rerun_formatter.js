function RerunFormatter(suite, log, options) {
  var Cucumber = require('../../cucumber');
  var path = require('path');

  var statsJournal = Cucumber.Listener.StatsJournal(suite);
  var failures = {};

  suite.on('AfterScenario', function(scenario) {
    var isCurrentScenarioFailing = statsJournal.isCurrentScenarioFailing();
    console.log(isCurrentScenarioFailing)

    if (isCurrentScenarioFailing) {
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
