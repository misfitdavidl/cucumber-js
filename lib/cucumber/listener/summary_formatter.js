function SummaryFormatter(suite, log, options) {
  var Cucumber = require('../../cucumber');
  var Duration = require('duration');
  var Table    = require('cli-table');
  var path     = require('path');
  var _        = require('lodash');

  var ambiguousStepLogBuffer = '';
  var failedScenarioLogBuffer = '';
  var failedStepResultLogBuffer = '';
  var undefinedStepLogBuffer = '';
  var colors = Cucumber.Util.Colors(options.useColors);
  var statusReportOrder = [
    Cucumber.Status.FAILED,
    Cucumber.Status.UNDEFINED,
    Cucumber.Status.AMBIGUOUS,
    Cucumber.Status.PENDING,
    Cucumber.Status.SKIPPED,
    Cucumber.Status.PASSED
  ];

  suite.on('StepResult', function(stepResult) {
    var status = stepResult.getStatus();
    switch (status) {
      case Cucumber.Status.AMBIGUOUS:
        storeAmbiguousStepResult(stepResult);
        break;
      case Cucumber.Status.FAILED:
        storeFailedStepResult(stepResult);
        break;
      case Cucumber.Status.UNDEFINED:
        storeUndefinedStepResult(stepResult);
        break;
    }
  });

  suite.on('ScenarioResult', function(scenarioResult) {
    if (scenarioResult.getStatus() === Cucumber.Status.FAILED) {
      var scenario = scenarioResult.getScenario();
      storeFailedScenario(scenario);
    }
  });

  suite.on('FeaturesResult', function(featuresResult) {
    if (options.prefix) {
      log(options.prefix);
    }
    logSummary(featuresResult);
  });

  function storeAmbiguousStepResult(stepResult) {
    var step = stepResult.getStep();
    var stepDefinitions = stepResult.getAmbiguousStepDefinitions();

    var table = new Table({
      chars: {
        'bottom': '', 'bottom-left': '', 'bottom-mid': '', 'bottom-right': '',
        'left': '', 'left-mid': '',
        'mid': '', 'mid-mid': '',
        'middle': ' ',
        'right': '', 'right-mid': '',
        'top': '' , 'top-left': '', 'top-mid': '', 'top-right': ''
      },
      style: {
        'padding-left': 0, 'padding-right': 0
      }
    });
    table.push.apply(table, stepDefinitions.map(function (stepDefinition) {
      var pattern = stepDefinition.getPattern();
      var relativeUri = path.relative(process.cwd(), stepDefinition.getUri());
      var line = stepDefinition.getLine();
      return [colors.ambiguous(pattern), colors.comment('# ' + relativeUri + ':' + line)];
    }));
    var message = colors.ambiguous('"' + step.getName() + '" matches:') + '\n' + table.toString();
    if (ambiguousStepLogBuffer.indexOf(message) === -1) {
      ambiguousStepLogBuffer += message + '\n\n';
    }
  }

  function storeFailedStepResult(failedStepResult) {
    var failureException = failedStepResult.getFailureException();
    var failureMessage = failureException.stack || failureException;
    failedStepResultLogBuffer += failureMessage + '\n\n';
  };

  function storeFailedScenario(failedScenario) {
    var name        = failedScenario.getName();
    var relativeUri = path.relative(process.cwd(), failedScenario.getUri());
    var line        = failedScenario.getLine();
    failedScenarioLogBuffer += relativeUri + ':' + line + ' # Scenario: ' + name + '\n';
  };

  function storeUndefinedStepResult(stepResult) {
    var step = stepResult.getStep();
    var snippetBuilder = Cucumber.SupportCode.StepDefinitionSnippetBuilder(step, options.snippetSyntax);
    var snippet        = snippetBuilder.buildSnippet();
    if (undefinedStepLogBuffer.indexOf(snippet) === -1) {
      undefinedStepLogBuffer += snippet + '\n';
    }
  };

  function logSummary(featuresResult) {
    if (failedScenarioLogBuffer) {
      if (!options.hideFailedStepResults) {
        logFailedStepResults();
      }
      logFailedScenarios();
    }
    logScenariosSummary(featuresResult);
    logStepsSummary(featuresResult);
    logDuration(featuresResult);
    if (undefinedStepLogBuffer)
      logUndefinedStepSnippets();
    if (ambiguousStepLogBuffer)
      logAmbiguousSteps();
  };

  function logAmbiguousSteps() {
    log(colors.ambiguous('\nThe following steps have multiple matching definitions:\n\n'));
    log(colors.ambiguous(ambiguousStepLogBuffer));
  }

  function logFailedStepResults() {
    log('(::) failed steps (::)\n\n');
    log(failedStepResultLogBuffer);
  }

  function logFailedScenarios() {
    log('Failing scenarios:\n');
    log(failedScenarioLogBuffer);
    log('\n');
  }

  function logScenariosSummary(featuresResult) {
    logCountSummary('scenario', featuresResult.getScenarioCounts());
  }

  function logStepsSummary(featuresResult) {
    logCountSummary('step', featuresResult.getStepCounts());
  }

  function logDuration(featuresResult) {
    var nanoseconds = featuresResult.getDuration();
    var milliseconds = Math.ceil(nanoseconds / 1e6);
    var start = new Date(0);
    var end = new Date(milliseconds);
    var duration = new Duration(start, end);

    log(duration.minutes + 'm' +
        duration.toString('%S') + '.' +
        duration.toString('%L') + 's' + '\n');
  }

  function logUndefinedStepSnippets() {
    if (options.snippets) {
      log(colors.pending('\nYou can implement step definitions for undefined steps with these snippets:\n\n'));
      log(colors.pending(undefinedStepLogBuffer));
    }
  }

  function logCountSummary (type, counts) {
    var total = _.reduce(counts, function(memo, value){
      return memo + value;
    });

    log(total + ' ' + type + (total !== 1 ? 's' : ''));
    if (total > 0) {
      var details = [];
      statusReportOrder.forEach(function (status) {
        if (counts[status] > 0)
          details.push(colors[status](counts[status] + ' ' + status));
      });
      log(' (' + details.join(', ') + ')');
    }
    log('\n');
  }
}

module.exports = SummaryFormatter;
