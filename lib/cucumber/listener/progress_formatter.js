function ProgressFormatter(suite, log, options) {
  var Cucumber = require('../../cucumber');

  var colors = Cucumber.Util.Colors(options.useColors);

  var characters = {};
  characters[Cucumber.Status.AMBIGUOUS] = 'A';
  characters[Cucumber.Status.FAILED] = 'F';
  characters[Cucumber.Status.PASSED] = '.';
  characters[Cucumber.Status.PENDING] = 'P';
  characters[Cucumber.Status.SKIPPED] = '-';
  characters[Cucumber.Status.UNDEFINED] = 'U';

  suite.on('StepResult', function (stepResult) {
    var status = stepResult.getStatus();
    var step = stepResult.getStep();
    if (!step.isHidden() || status === Cucumber.Status.FAILED) {
      var character = colors[status](characters[status]);
      log(character);
    }
  });

  suite.on('AfterFeatures', function () {
    log('\n\n');
  });

  var summaryFormatterOptions = {
    snippets: options.snippets,
    snippetSyntax: options.snippetSyntax,
    useColors: options.useColors
  };
  Cucumber.Listener.SummaryFormatter(suite, log, summaryFormatterOptions);
}

module.exports = ProgressFormatter;
