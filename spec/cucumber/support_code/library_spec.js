require('../../support/spec_helper');

describe("Cucumber.SupportCode.Library", function () {
  var Cucumber = requireLib('cucumber');
  var library, rawSupportCode;

  beforeEach(function () {
    rawSupportCode = createSpy("Raw support code");
  });

  describe("constructor", function () {
    beforeEach(function () {
      spyOn(Cucumber.SupportCode, 'Hook');
      spyOn(Cucumber.SupportCode, 'StepDefinition');
      library = Cucumber.SupportCode.Library(rawSupportCode);
    });

    it("executes the raw support code", function () {
      expect(rawSupportCode).toHaveBeenCalled();
    });

    it("executes the raw support code with a support code helper as 'this'", function () {
      expect(rawSupportCode.calls.mostRecent().object).toBeDefined();
    });

    describe("code support helper", function () {
      var supportCodeHelper;

      beforeEach(function () {
        supportCodeHelper = rawSupportCode.calls.mostRecent().object;
      });

      describe("Before", function () {
        var code, hook;

        beforeEach(function () {
          code = createSpy("hook code");
          hook = createSpy("hook");
          Cucumber.SupportCode.Hook.and.returnValue(hook);
        });

        describe("without options", function () {
          beforeEach(function () {
            supportCodeHelper.Before(code);
          });

          it("creates a before hook with the code", function () {
            expect(Cucumber.SupportCode.Hook).toHaveBeenCalledWith(code, {}, jasmine.any(String), jasmine.any(Number));
          });
        });

        describe("with options", function () {
          var options;

          beforeEach(function () {
            options = {some: 'data'};
            supportCodeHelper.Before(options, code);
          });

          it("creates a before hook with the code", function () {
            expect(Cucumber.SupportCode.Hook).toHaveBeenCalledWith(code, options, jasmine.any(String), jasmine.any(Number));
          });
        });

        describe("lookupBeforeHooksByScenario()", function () {
          var scenario, beforeHook1, beforeHook2, beforeHook3;

          beforeEach(function () {
            scenario = createSpy('scenario');
            beforeHook1 = createSpyWithStubs("before hook 1", {appliesToScenario: true});
            beforeHook2 = createSpyWithStubs("before hook 2", {appliesToScenario: false});
            beforeHook3 = createSpyWithStubs("before hook 3", {appliesToScenario: true});
            Cucumber.SupportCode.Hook.and.returnValues(beforeHook1, beforeHook2, beforeHook3);
            supportCodeHelper.Before();
            supportCodeHelper.Before();
            supportCodeHelper.Before();
          });

          it("checks whether each before hook applies to the scenario", function () {
            library.lookupBeforeHooksByScenario(scenario);
            expect(beforeHook1.appliesToScenario).toHaveBeenCalledWith(scenario);
            expect(beforeHook2.appliesToScenario).toHaveBeenCalledWith(scenario);
            expect(beforeHook3.appliesToScenario).toHaveBeenCalledWith(scenario);
          });

          it("returns the matching hooks", function () {
            var result = library.lookupBeforeHooksByScenario(scenario);
            expect(result).toEqual([beforeHook1, beforeHook3]);
          });
        });
      });

      describe("After", function () {
        var code, hook;

        beforeEach(function () {
          code = createSpy("hook code");
          hook = createSpy("hook");
          Cucumber.SupportCode.Hook.and.returnValue(hook);
        });

        describe("without options", function () {
          beforeEach(function () {
            supportCodeHelper.After(code);
          });

          it("creates a before hook with the code", function () {
            expect(Cucumber.SupportCode.Hook).toHaveBeenCalledWith(code, {}, jasmine.any(String), jasmine.any(Number));
          });
        });

        describe("with a tag group", function () {
          var options;

          beforeEach(function () {
            options = {some: 'data'};
            supportCodeHelper.After(options, code);
          });

          it("creates a before hook with the code", function () {
            expect(Cucumber.SupportCode.Hook).toHaveBeenCalledWith(code, options, jasmine.any(String), jasmine.any(Number));
          });
        });

        describe("lookupAfterHooksByScenario()", function () {
          var scenario, afterHook1, afterHook2, afterHook3;

          beforeEach(function () {
            scenario = createSpy('scenario');
            afterHook1 = createSpyWithStubs("after hook 1", {appliesToScenario: true});
            afterHook2 = createSpyWithStubs("after hook 2", {appliesToScenario: false});
            afterHook3 = createSpyWithStubs("after hook 3", {appliesToScenario: true});
            Cucumber.SupportCode.Hook.and.returnValues(afterHook1, afterHook2, afterHook3);
            supportCodeHelper.After();
            supportCodeHelper.After();
            supportCodeHelper.After();
          });

          it("checks whether each after hook applies to the scenario", function () {
            library.lookupAfterHooksByScenario(scenario);
            expect(afterHook1.appliesToScenario).toHaveBeenCalledWith(scenario);
            expect(afterHook2.appliesToScenario).toHaveBeenCalledWith(scenario);
            expect(afterHook3.appliesToScenario).toHaveBeenCalledWith(scenario);
          });

          it("returns the matching hooks", function () {
            var result = library.lookupAfterHooksByScenario(scenario);
            expect(result).toEqual([afterHook1, afterHook3]);
          });
        });
      });

      it("exposes a method to define Given steps", function () {
        expect(supportCodeHelper.Given).toBeAFunction ();
        expect(supportCodeHelper.Given).toBe(supportCodeHelper.defineStep);
      });

      it("exposes a method to define When steps", function () {
        expect(supportCodeHelper.When).toBeAFunction ();
        expect(supportCodeHelper.Given).toBe(supportCodeHelper.defineStep);
      });

      it("exposes a method to define Then steps", function () {
        expect(supportCodeHelper.Then).toBeAFunction ();
        expect(supportCodeHelper.Given).toBe(supportCodeHelper.defineStep);
      });

      it("exposes a method to define any step", function () {
        expect(supportCodeHelper.defineStep).toBeAFunction ();
        expect(supportCodeHelper.defineStep).toBe(library.defineStep);
      });

      it("exposes the World constructor", function () {
        expect(supportCodeHelper.World).toBeAFunction();
      });
    });
  });

  describe('Step Definitions', function () {
    describe("lookupStepDefinitionsByName()", function () {
      var stepName, stepDefinition1, stepDefinition2, stepDefinition3;

      beforeEach(function () {
        stepName = 'step name';
        stepDefinition1 = createSpyWithStubs("step definition 1", {matchesStepName: false});
        stepDefinition2 = createSpyWithStubs("step definition 2", {matchesStepName: true});
        stepDefinition3 = createSpyWithStubs("step definition 3", {matchesStepName: true});
        spyOn(Cucumber.SupportCode, 'StepDefinition').and.returnValues(stepDefinition1, stepDefinition2, stepDefinition3);
        library.defineStep();
        library.defineStep();
        library.defineStep();
      });

      it("checks whether each step defintion matches the step name", function () {
        library.lookupStepDefinitionsByName(stepName);
        expect(stepDefinition1.matchesStepName).toHaveBeenCalledWith(stepName);
        expect(stepDefinition2.matchesStepName).toHaveBeenCalledWith(stepName);
        expect(stepDefinition3.matchesStepName).toHaveBeenCalledWith(stepName);
      });

      it("returns the matching hooks", function () {
        var result = library.lookupStepDefinitionsByName(stepName);
        expect(result).toEqual([stepDefinition2, stepDefinition3]);
      });
    });

    describe("defineStep()", function () {
      var name, code, stepDefinition;

      beforeEach(function () {
        name           = createSpy("step definition name");
        code           = createSpy("step definition code");
        stepDefinition = createSpy("step definition");
        spyOn(Cucumber.SupportCode, 'StepDefinition').and.returnValue(stepDefinition);
      });

      describe('without options', function () {
        beforeEach(function () {
          library.defineStep(name, code);
        });

        it("creates a step definition with the name, empty options, and code", function () {
          expect(Cucumber.SupportCode.StepDefinition).toHaveBeenCalledWith(name, {}, code, jasmine.any(String), jasmine.any(Number));
        });
      });

      describe('with options', function () {
        var options;

        beforeEach(function () {
          options = {some: 'data'};
          library.defineStep(name, options, code);
        });

        it("creates a step definition with the name, options, and code", function () {
          expect(Cucumber.SupportCode.StepDefinition).toHaveBeenCalledWith(name, options, code, jasmine.any(String), jasmine.any(Number));
        });
      });
    });
  });

  describe('World construction', function () {
    beforeEach(function () {
      library = Cucumber.SupportCode.Library(rawSupportCode);
    });

    describe("instantiateNewWorld()", function () {
      it("creates a new instance of the World", function () {
        var world = library.instantiateNewWorld();
        expect(typeof world).toBe('object');
      });
    });

    describe("when the default World constructor is replaced by a custom one", function () {
      it("instantiates a custom World", function () {
        var customWorldConstructor = function () {};
        rawSupportCode             = function () { this.World = customWorldConstructor; };
        library                    = Cucumber.SupportCode.Library(rawSupportCode);

        var world = library.instantiateNewWorld();
        expect(world.constructor).toBe(customWorldConstructor);
      });
    });
  });
});
