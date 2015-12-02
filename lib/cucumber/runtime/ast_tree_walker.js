function AstTreeWalker(features, supportCodeLibrary, options) {
  var Cucumber = require('../../cucumber');
  var events = require('events');

  var world;
  var featuresResult = Cucumber.Runtime.FeaturesResult(options.strict);
  var emptyHook = Cucumber.SupportCode.Hook(function () {}, {});
  var beforeSteps = Cucumber.Type.Collection();
  var afterSteps = Cucumber.Type.Collection();
  var attachments = [];
  var apiScenario, scenarioResult;

  var self = new events.EventEmitter();

  self.walk = function walk(callback) {
    self.visitFeatures(features, function () {
      callback(featuresResult.isSuccessful());
    });
  };

  self.visitFeatures = function visitFeatures(features, callback) {
    var eventName = AstTreeWalker.FEATURES_EVENT_NAME;
    var eventArguments = [features];
    var userFunction = function (callback) {
      features.acceptVisitor(self, function() {
        self.broadcastEvent(AstTreeWalker.FEATURES_RESULT_EVENT_NAME, [featuresResult]);
        callback();
      });
    };
    self.broadcastEventAroundUserFunction(eventName, eventArguments, userFunction, callback);
  };

  self.visitFeature = function visitFeature(feature, callback) {
    if (!featuresResult.isSuccessful() && options.failFast) {
      return callback();
    }
    var eventName = AstTreeWalker.FEATURE_EVENT_NAME;
    var eventArguments = [feature];
    var userFunction = function (callback) {
      feature.acceptVisitor(self, callback);
    };
    self.broadcastEventAroundUserFunction(eventName, eventArguments, userFunction, callback);
  };

  self.visitBackground = function visitBackground(background, callback) {
    self.broadcastEvent(AstTreeWalker.BACKGROUND_EVENT_NAME, [background]);
    callback();
  };

  self.visitScenario = function visitScenario(scenario, callback) {
    if (!featuresResult.isSuccessful() && options.failFast) {
      return callback();
    }
    var world = supportCodeLibrary.instantiateNewWorld();
    self.setWorld(world);
    self.witnessNewScenario(scenario);
    self.createBeforeAndAfterStepsForAroundHooks(scenario);
    self.createBeforeStepsForBeforeHooks(scenario);
    self.createAfterStepsForAfterHooks(scenario);
    var eventName = AstTreeWalker.SCENARIO_EVENT_NAME;
    var eventArguments = [scenario];
    var userFunction = function (callback) {
      self.visitBeforeSteps(function () {
        scenario.acceptVisitor(self, function () {
          self.visitAfterSteps(function() {
            self.visitScenarioResult(scenarioResult, callback);
          });
        });
      });
    };
    self.broadcastEventAroundUserFunction(eventName, eventArguments, userFunction, callback);
  };

  self.createBeforeAndAfterStepsForAroundHooks = function createBeforeAndAfterStepsForAroundHooks(scenario) {
    var aroundHooks = supportCodeLibrary.lookupAroundHooksByScenario(scenario);
    aroundHooks.forEach(function (aroundHook) {
      var beforeStep = Cucumber.Ast.HookStep(AstTreeWalker.AROUND_STEP_KEYWORD);
      beforeStep.setHook(aroundHook);
      beforeSteps.add(beforeStep);
      var afterStep = Cucumber.Ast.HookStep(AstTreeWalker.AROUND_STEP_KEYWORD);
      afterStep.setHook(emptyHook);
      afterSteps.unshift(afterStep);
      aroundHook.setAfterStep(afterStep);
    });
  };

  self.createBeforeStepsForBeforeHooks = function createBeforeStepsForBeforeHooks(scenario) {
    var beforeHooks = supportCodeLibrary.lookupBeforeHooksByScenario(scenario);
    beforeHooks.forEach(function (beforeHook) {
      var beforeStep = Cucumber.Ast.HookStep(AstTreeWalker.BEFORE_STEP_KEYWORD);
      beforeStep.setHook(beforeHook);
      beforeSteps.add(beforeStep);
    });
  };

  self.createAfterStepsForAfterHooks = function createAfterStepsForAfterHooks(scenario) {
    var afterHooks = supportCodeLibrary.lookupAfterHooksByScenario(scenario);
    afterHooks.forEach(function (afterHook) {
      var afterStep = Cucumber.Ast.HookStep(AstTreeWalker.AFTER_STEP_KEYWORD);
      afterStep.setHook(afterHook);
      afterSteps.unshift(afterStep);
    });
  };

  self.visitBeforeSteps = function visitBeforeSteps(callback) {
    beforeSteps.asyncForEach(function (beforeStep, callback) {
      self.witnessHook();
      self.executeHookStep(beforeStep, callback);
    }, callback);
  };

  self.visitAfterSteps = function visitAfterSteps(callback) {
    afterSteps.asyncForEach(function (afterStep, callback) {
      self.witnessHook();
      self.executeHookStep(afterStep, callback);
    }, callback);
  };

  self.visitStep = function visitStep(step, callback) {
    self.witnessNewStep();
    var eventName = AstTreeWalker.STEP_EVENT_NAME;
    var eventArguments = [step];
    var userFunction = function (callback) {
      self.processStep(step, callback);
    };
    self.broadcastEventAroundUserFunction(eventName, eventArguments, userFunction, callback);
  };

  self.visitStepResult = function visitStepResult(stepResult, callback) {
    scenarioResult.witnessStepResult(stepResult);
    featuresResult.witnessStepResult(stepResult);
    self.broadcastEvent(AstTreeWalker.STEP_RESULT_EVENT_NAME, [stepResult]);
    callback();
  };

  self.visitScenarioResult = function visitScenarioResult(scenarioResult, callback) {
    featuresResult.witnessScenarioResult(scenarioResult);
    self.broadcastEvent(AstTreeWalker.SCENARIO_RESULT_EVENT_NAME, [scenarioResult]);
    callback();
  };

  self.broadcastEventAroundUserFunction = function broadcastEventAroundUserFunction (eventName, eventArguments, userFunction, callback) {
    self.broadcastBeforeEvent(eventName, eventArguments);
    userFunction(function() {
      self.broadcastAfterEvent(eventName, eventArguments);
      callback();
    });
  };

  self.broadcastBeforeEvent = function broadcastBeforeEvent(eventName, eventArguments) {
    var preEventName = AstTreeWalker.BEFORE_EVENT_NAME_PREFIX + eventName;
    self.broadcastEvent(preEventName, eventArguments);
  };

  self.broadcastAfterEvent = function broadcastAfterEvent(eventName, eventArguments) {
    var postEventName = AstTreeWalker.AFTER_EVENT_NAME_PREFIX + eventName;
    self.broadcastEvent(postEventName, eventArguments);
  };

  self.broadcastEvent = function broadcastEvent(eventName, eventArguments) {
    var emitArguments = [eventName].concat(eventArguments);
    self.emit.apply(self, emitArguments);
  };

  self.setWorld = function setWorld(newWorld) {
    world = newWorld;
  };

  self.getWorld = function getWorld() {
    return world;
  };

  self.getDefaultTimeout = function getDefaultTimeout() {
    return supportCodeLibrary.getDefaultTimeout();
  };

  self.getScenarioStatus = function getScenarioStatus() {
    return scenarioResult.getStatus();
  };

  self.getScenarioFailureException = function getScenarioFailureException() {
    return scenarioResult.getFailureException();
  };

  self.attach = function attach(data, mimeType) {
    attachments.push(Cucumber.Runtime.Attachment({mimeType: mimeType, data: data}));
  };

  self.getAttachments = function getAttachments() {
    return attachments;
  };

  self.witnessHook = function witnessHook() {
    attachments = [];
  };

  self.witnessNewStep = function witnessNewStep() {
    attachments = [];
  };

  self.witnessNewScenario = function witnessNewScenario(scenario) {
    apiScenario    = Cucumber.Api.Scenario(self, scenario);
    scenarioResult = Cucumber.Runtime.ScenarioResult(scenario);
    beforeSteps.clear();
    afterSteps.clear();
  };

  self.getScenario = function getScenario() {
    return apiScenario;
  };

  self.isSkippingSteps = function isSkippingSteps() {
    return self.getScenarioStatus() !== Cucumber.Status.PASSED;
  };

  self.processStep = function processStep(step, callback) {
    var stepName = step.getName();
    var stepDefinitions = supportCodeLibrary.lookupStepDefinitionsByName(stepName);
    if (stepDefinitions.length === 0) {
      self.skipUndefinedStep(step, callback);
    } else if (stepDefinitions.length > 1) {
      self.skipAmbiguousStep(step, stepDefinitions, callback);
    } else if (options.dryRun || self.isSkippingSteps()) {
      self.skipStep(step, stepDefinitions[0], callback);
    } else {
      self.executeStep(step, stepDefinitions[0], callback);
    }
  };

  self.executeHookStep = function executeHook(hookStep, callback) {
    var stepDefinition = hookStep.getHook();
    self.executeStep(hookStep, stepDefinition, callback);
  };

  self.executeStep = function executeStep(step, stepDefinition, callback) {
    var world          = self.getWorld();
    var scenario       = self.getScenario();
    var defaultTimeout = self.getDefaultTimeout();
    stepDefinition.invoke(step, world, scenario, defaultTimeout, function (stepResult) {
      self.visitStepResult(stepResult, callback);
    });
  };

  self.skipAmbiguousStep = function skipAmbiguousStep(step, stepDefinitions, callback) {
    var ambiguousStepResult = Cucumber.Runtime.StepResult({
      ambiguousStepDefinitions: stepDefinitions,
      step: step,
      status: Cucumber.Status.AMBIGUOUS
    });
    self.visitStepResult(ambiguousStepResult, callback);
  };

  self.skipStep = function skipStep(step, stepDefinition, callback) {
    var skippedStepResult = Cucumber.Runtime.StepResult({
      step: step,
      stepDefinition: stepDefinition,
      status: Cucumber.Status.SKIPPED
    });
    self.visitStepResult(skippedStepResult, callback);
  };

  self.skipUndefinedStep = function skipUndefinedStep(step, callback) {
    var undefinedStepResult = Cucumber.Runtime.StepResult({step: step, status: Cucumber.Status.UNDEFINED});
    self.visitStepResult(undefinedStepResult, callback);
  };

  return self;
}

AstTreeWalker.FEATURES_EVENT_NAME                 = 'Features';
AstTreeWalker.FEATURES_RESULT_EVENT_NAME          = 'FeaturesResult';
AstTreeWalker.FEATURE_EVENT_NAME                  = 'Feature';
AstTreeWalker.BACKGROUND_EVENT_NAME               = 'Background';
AstTreeWalker.SCENARIO_EVENT_NAME                 = 'Scenario';
AstTreeWalker.SCENARIO_RESULT_EVENT_NAME          = 'ScenarioResult';
AstTreeWalker.STEP_EVENT_NAME                     = 'Step';
AstTreeWalker.STEP_RESULT_EVENT_NAME              = 'StepResult';
AstTreeWalker.ROW_EVENT_NAME                      = 'ExampleRow';
AstTreeWalker.BEFORE_EVENT_NAME_PREFIX            = 'Before';
AstTreeWalker.AFTER_EVENT_NAME_PREFIX             = 'After';
AstTreeWalker.NON_EVENT_LEADING_PARAMETERS_COUNT  = 0;
AstTreeWalker.NON_EVENT_TRAILING_PARAMETERS_COUNT = 2;
AstTreeWalker.AROUND_STEP_KEYWORD                 = 'Around ';
AstTreeWalker.BEFORE_STEP_KEYWORD                 = 'Before ';
AstTreeWalker.AFTER_STEP_KEYWORD                  = 'After ';
AstTreeWalker.Event                               = require('./ast_tree_walker/event');

module.exports = AstTreeWalker;
