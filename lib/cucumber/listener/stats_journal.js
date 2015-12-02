function StatsJournal(suite) {
  var Cucumber = require('../../cucumber');
  var _ = require('lodash');

  function getCountsObject () {
    var statuses = [
      Cucumber.Status.AMBIGUOUS,
      Cucumber.Status.FAILED,
      Cucumber.Status.PASSED,
      Cucumber.Status.PENDING,
      Cucumber.Status.SKIPPED,
      Cucumber.Status.UNDEFINED
    ];
    var counts = {};
    statuses.forEach(function (status) {
      counts[status] = 0;
    });
    return counts;
  }

  var scenarioResult;
  var scenarioCounts = getCountsObject();
  var stepCounts = getCountsObject();
  var duration = 0;

  suite.on('BeforeScenario', function () {
    scenarioResult = Cucumber.Runtime.ScenarioResult();
  });

  suite.on('AfterScenario', function () {
    scenarioCounts[scenarioResult.getStatus()] += 1;
  });

  suite.on('StepResult', function (stepResult) {
    var stepDuration = stepResult.getDuration();
    if (stepDuration) {
      duration += stepDuration;
    }

    var status = stepResult.getStatus();
    var step = stepResult.getStep();

    if (!step.isHidden()) {
      stepCounts[status] += 1;
    }

    scenarioResult.witnessStepResult(stepResult);
  });

  var self = {
    isCurrentScenarioFailing: function isCurrentScenarioFailing() {
      return scenarioResult.getStatus() === Cucumber.Status.FAILED;
    },

    getScenarioCounts: function getScenarioCounts() {
      return _.clone(scenarioCounts);
    },

    getStepCounts: function getStepCounts() {
      return _.clone(stepCounts);
    },

    getDuration: function getDuration() {
      return duration;
    }
  }

  return self;
}

module.exports = StatsJournal;
