require('../../support/spec_helper');

describe("Cucumber.Listener.ProgressFormatter", function () {
  var Cucumber = requireLib('cucumber');
  var events = require('events');
  var colors = require('colors/safe');
  colors.enabled = true;
  var suite, log, options;

  beforeEach(function () {
    suite = new events.EventEmitter();
    log = createSpy('log');
    options = {useColors: true};
    spyOn(Cucumber.Listener, 'SummaryFormatter');
    Cucumber.Listener.ProgressFormatter(suite, log, options);
  });

  describe("constructor", function () {
    it("creates a summary formatter", function () {
      expect(Cucumber.Listener.SummaryFormatter).toHaveBeenCalled();
    });
  });

  describe("suite emits a 'StepResult'", function () {
    var step, stepResult;

    beforeEach(function () {
      step       = createSpyWithStubs("step", {isHidden: false});
      stepResult = createSpyWithStubs("step result", {getStatus: undefined, getStep: step});
    });

    describe("when the is step hidden", function () {
      beforeEach(function () {
        step.isHidden.and.returnValue(true);
      });

      describe("when the step failed", function () {
        beforeEach(function () {
          stepResult.getStatus.and.returnValue(Cucumber.Status.FAILED);
          suite.emit('StepResult', stepResult);
        });

        it("logs a red F", function () {
          expect(log).toHaveBeenCalledWith(colors.red('F'));
        });
      });

      describe("when the step passed", function () {
        beforeEach(function () {
          stepResult.getStatus.and.returnValue(Cucumber.Status.PASSED);
          suite.emit('StepResult', stepResult);
        });

        it("does not log", function () {
          expect(log).not.toHaveBeenCalled();
        });
      });
    });

    describe("when the is step not hidden", function () {
      beforeEach(function () {
        step.isHidden.and.returnValue(false);
      });

      describe("when the step failed", function () {
        beforeEach(function () {
          stepResult.getStatus.and.returnValue(Cucumber.Status.FAILED);
          suite.emit('StepResult', stepResult);
        });

        it("logs a red 'F'", function () {
          expect(log).toHaveBeenCalledWith(colors.red('F'));
        });
      });

      describe("when the step passed", function () {
        beforeEach(function () {
          stepResult.getStatus.and.returnValue(Cucumber.Status.PASSED);
          suite.emit('StepResult', stepResult);
        });

        it("logs a green dot", function () {
          expect(log).toHaveBeenCalledWith(colors.green('.'));
        });
      });

      describe("when the step is pending", function () {
        beforeEach(function () {
          stepResult.getStatus.and.returnValue(Cucumber.Status.PENDING);
          suite.emit('StepResult', stepResult);
        });

        it("logs a yellow 'P'", function () {
          expect(log).toHaveBeenCalledWith(colors.yellow('P'));
        });
      });

      describe("when the step was skipped", function () {
        beforeEach(function () {
          stepResult.getStatus.and.returnValue(Cucumber.Status.SKIPPED);
          suite.emit('StepResult', stepResult);
        });

        it("logs a cyan '-'", function () {
          expect(log).toHaveBeenCalledWith(colors.cyan('-'));
        });
      });

      describe("when the step was undefined", function () {
        beforeEach(function () {
          stepResult.getStatus.and.returnValue(Cucumber.Status.UNDEFINED);
          suite.emit('StepResult', stepResult);
        });

        it("logs a yellow 'U'", function () {
          expect(log).toHaveBeenCalledWith(colors.yellow('U'));
        });
      });
    });
  });
});
