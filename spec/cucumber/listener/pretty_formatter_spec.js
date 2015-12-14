require('../../support/spec_helper');

describe("Cucumber.Listener.PrettyFormatter", function () {
  var Cucumber = requireLib('cucumber');
  var path = require('path');
  var events = require('events');
  var colors = require('colors/safe');
  colors.enabled = true;
  var suite, logged, log, options;

  beforeEach(function () {
    suite = new events.EventEmitter();
    logged = '';
    log = createSpy('log').and.callFake(function (text) { logged += text; });
    options = {useColors: true};
    spyOn(Cucumber.Listener, 'SummaryFormatter');
    Cucumber.Listener.PrettyFormatter(suite, log, options);
  });

  describe("constructor", function () {
    it("creates a summaryFormatter", function () {
      expect(Cucumber.Listener.SummaryFormatter).toHaveBeenCalled();
    });
  });

  describe("suite emits 'BeforeFeature'", function () {
    var feature;

    beforeEach(function () {
      feature = createSpyWithStubs("feature", {
        getKeyword: "feature-keyword",
        getName: "feature-name",
        getDescription: '',
        getTags: []
      });
    });

    describe('no tags or description', function () {
      beforeEach(function (){
        suite.emit('BeforeFeature', feature);
      });

      it('logs the keyword and name', function () {
        expect(logged).toEqual('feature-keyword: feature-name\n\n');
      });
    });

    describe('with tags', function () {
      beforeEach(function (){
        feature.getTags.and.returnValue([
          createSpyWithStubs("tag1", {getName: '@tag1'}),
          createSpyWithStubs("tag2", {getName: '@tag2'})
        ]);
        suite.emit('BeforeFeature', feature);
      });

      it('logs the keyword and name', function () {
        var expected =
          colors.cyan('@tag1 @tag2') + '\n' +
          'feature-keyword: feature-name' + '\n\n';
        expect(logged).toEqual(expected);
      });
    });

    describe('with feature description', function () {
      beforeEach(function (){
        feature.getDescription.and.returnValue('line1\nline2');
        suite.emit('BeforeFeature', feature);
      });

      it('logs the keyword and name', function () {
        var expected =
          'feature-keyword: feature-name' + '\n\n' +
          '  line1' + '\n' +
          '  line2' + '\n\n';

        expect(logged).toEqual(expected);
      });
    });
  });

  describe("suite emits 'BeforeScenario'", function () {
    var scenario;

    beforeEach(function () {
      scenario = createSpyWithStubs("scenario", {
        getKeyword: "scenario-keyword",
        getName: "scenario-name",
        getUri: path.join(process.cwd(), "scenario-uri"),
        getLine: 1,
        getBackground: undefined,
        getOwnTags: [],
        getSteps: []
      });
    });

    describe('no tags, not showing source', function () {
      beforeEach(function (){
        suite.emit('BeforeScenario', scenario);
      });

      it('logs the keyword and name', function () {
        expect(logged).toEqual('  scenario-keyword: scenario-name\n');
      });
    });

    describe('with tags', function () {
      beforeEach(function (){
        scenario.getOwnTags.and.returnValue([
          createSpyWithStubs("tag1", {getName: '@tag1'}),
          createSpyWithStubs("tag2", {getName: '@tag2'})
        ]);
        suite.emit('BeforeScenario', scenario);
      });

      it('logs the keyword and name', function () {
        var expected =
          '  ' + colors.cyan('@tag1 @tag2') + '\n' +
          '  scenario-keyword: scenario-name' + '\n';
        expect(logged).toEqual(expected);
      });
    });

    describe('showing source', function () {
      beforeEach(function (){
        options.showSource = true;
        suite.emit('BeforeScenario', scenario);
      });

      it('logs the keyword and name', function () {
        var expected =
          '  scenario-keyword: scenario-name   ' + colors.gray('# scenario-uri:1') + '\n';
        expect(logged).toEqual(expected);
      });
    });
  });

  describe("suite emits 'AfterScenario'", function () {
    beforeEach(function () {
      suite.emit('AfterScenario');
    });

    it("logs a new line", function () {
      expect(log).toHaveBeenCalledWith("\n");
    });
  });

  describe("suite emits 'StepResult'", function () {
    var stepResult, step, stepDefinition;

    beforeEach(function () {
      stepDefinition = createSpyWithStubs("step definition", {
        getLine: 1,
        getUri: path.join(process.cwd(), 'step-definition-uri')
      });
      step = createSpyWithStubs("step", {
        getDataTable: null,
        getDocString: null,
        getKeyword: "step-keyword ",
        getName: "step-name",
        hasDataTable: null,
        hasDocString: null,
        isHidden: false
      });
      stepResult = createSpyWithStubs("step result", {
        getFailureException: null,
        getStep: step,
        getStepDefinition: stepDefinition,
        getStatus: Cucumber.Status.PASSED
      });
    });

    describe("passing step", function () {
      describe("hidden", function () {
        beforeEach(function () {
          step.isHidden.and.returnValue(true);
          suite.emit('StepResult', stepResult);
        });

        it('does not log', function () {
          expect(log).not.toHaveBeenCalled();
        });
      });

      describe("not hidden", function () {
        beforeEach(function () {
          suite.emit('StepResult', stepResult);
        });

        it('logs the keyword and name', function () {
          var expected =
            '    ' + colors.green('step-keyword step-name') + '\n';
          expect(logged).toEqual(expected);
        });
      });
    });

    describe("pending step", function () {
      beforeEach(function () {
        stepResult.getStatus.and.returnValue(Cucumber.Status.PENDING);
        suite.emit('StepResult', stepResult);
      });

      it('logs the keyword and name', function () {
        var expected =
          '    ' + colors.yellow('step-keyword step-name') + '\n';
        expect(logged).toEqual(expected);
      });
    });

    describe("skipped step", function () {
      beforeEach(function () {
        stepResult.getStatus.and.returnValue(Cucumber.Status.SKIPPED);
        suite.emit('StepResult', stepResult);
      });

      it('logs the keyword and name', function () {
        var expected =
          '    ' + colors.cyan('step-keyword step-name') + '\n';
        expect(logged).toEqual(expected);
      });
    });

    describe("undefined step", function () {
      beforeEach(function () {
        stepResult.getStatus.and.returnValue(Cucumber.Status.UNDEFINED);
        suite.emit('StepResult', stepResult);
      });

      it('logs the keyword and name', function () {
        var expected =
          '    ' + colors.yellow('step-keyword step-name') + '\n';
        expect(logged).toEqual(expected);
      });
    });

    describe("failed step", function () {
      beforeEach(function () {
        stepResult.getStatus.and.returnValue(Cucumber.Status.FAILED);
        stepResult.getFailureException.and.returnValue({stack: 'stack error\n  stacktrace1\n  stacktrace2'});
        suite.emit('StepResult', stepResult);
      });

      it('logs the keyword and name and failure', function () {
        var expected =
          '    ' + colors.red('step-keyword step-name') + '\n' +
          '      stack error' + '\n' +
          '        stacktrace1' + '\n' +
          '        stacktrace2' + '\n';
        expect(logged).toEqual(expected);
      });
    });

    describe("without name", function () {
      beforeEach(function () {
        step.getName.and.returnValue(undefined);
        suite.emit('StepResult', stepResult);
      });

      it('logs the keyword', function () {
        var expected =
          '    step-keyword ' + '\n';
        expect(colors.strip(logged)).toEqual(expected);
      });
    });

    describe("showing source", function () {
      beforeEach(function() {
        options.showSource = true;
        suite.emit('StepResult', stepResult);
      });

      it('logs the keyword and name', function () {
        var expected =
          '    step-keyword step-name# step-definition-uri:1' + '\n';
        expect(colors.strip(logged)).toEqual(expected);
      });
    });

    describe("with data table", function () {
      beforeEach(function() {
        var rows = [
          ["cuk", "cuke", "cukejs"],
          ["c",   "cuke", "cuke.js"],
          ["cu",  "cuke", "cucumber"]
        ];
        var dataTable = createSpyWithStubs("data table", {raw: rows});
        step.getDataTable.and.returnValue(dataTable);
        step.hasDataTable.and.returnValue(true);
        suite.emit('StepResult', stepResult);
      });

      it('logs the keyword and name and data table', function () {
        var expected =
          '    step-keyword step-name' + '\n' +
          '      | cuk | cuke | cukejs   |' + '\n' +
          '      | c   | cuke | cuke.js  |' + '\n' +
          '      | cu  | cuke | cucumber |' + '\n';
        expect(colors.strip(logged)).toEqual(expected);
      });
    });

    describe("with doc string", function () {
      beforeEach(function () {
        var contents = "this is a multiline\ndoc string\n\n:-)";
        var docString = createSpyWithStubs("doc string", {getContents: contents});
        step.getDocString.and.returnValue(docString);
        step.hasDocString.and.returnValue(true);
        suite.emit('StepResult', stepResult);
      });

      it('logs the keyword and name and doc string', function () {
        var expected =
          '    step-keyword step-name' + '\n' +
          '      """' + '\n' +
          '      this is a multiline' + '\n' +
          '      doc string' + '\n' +
          '\n' +
          '      :-)' + '\n' +
          '      """' + '\n';
        expect(colors.strip(logged)).toEqual(expected);
      });
    });
  });
});
