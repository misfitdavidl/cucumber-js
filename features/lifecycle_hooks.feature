Feature: Lifecycle hooks

  BeforeAll and AfterAll hooks are run just once,
  at the beginning and end of the suite

  Background:
    Given a file named "features/my_feature.feature" with:
      """
      Feature: a feature
        Scenario: first
          Given a step

        Scenario: second
          Given a step
      """
    And a file named "features/support/counter.js" with:
      """
      module.exports = {value: 0};
      """
    And a file named "features/step_definitions/my_steps.js" with:
      """
      var assert = require('assert');
      var counter = require('../support/counter');

      var stepDefinitions = function() {
        this.When(/^a step$/, function () {
          assert.equal(counter.value, 1);
        });
      };

      module.exports = stepDefinitions;
      """

  Scenario: success
    Given a file named "features/support/lifecycle_hooks.js" with:
      """
      var assert = require('assert');
      var counter = require('../support/counter')

      var lifecycleHooks = function() {
        this.BeforeAll(function() {
          counter.value = 1
        });

        this.AfterAll(function() {
          assert.equal(counter.value, 1);
        });
      };

      module.exports = lifecycleHooks
      """
    When I run cucumber.js
    Then it outputs this text:
      """
      Feature: a feature

        Scenario: first
          Given a step

        Scenario: second
          Given a step

      2 scenarios (2 passed)
      2 steps (2 passed)
      <duration-stat>
      """

  Scenario: before all hook failure
    Given a file named "features/support/lifecycle_hooks.js" with:
      """
      var stepDefinitions = function() {
        this.BeforeAll(function() {
          throw 'error in before all hook';
        });
      };

      module.exports = stepDefinitions
      """
    When I run cucumber.js
    Then the output contains the text:
      """
      Failures:

      1) Step: Before All
         Step Definition: features/support/lifecycle_hooks.js:2
         Message:
           error in before all hook

      0 scenarios
      0 steps
      <duration-stat>
      """
    And the exit status should be 1

  Scenario: after all hook failure
    Given a file named "features/support/lifecycle_hooks.js" with:
      """
      var counter = require('../support/counter');

      var stepDefinitions = function() {
        this.BeforeAll(function() {
          counter.value = 1
        });

        this.AfterAll(function() {
          throw 'error in after all hook';
        });
      };

      module.exports = stepDefinitions
      """
    When I run cucumber.js
    Then the output contains the text:
      """
      Feature: a feature

        Scenario: first
          Given a step

        Scenario: second
          Given a step

      Failures:

      1) Step: After All
         Step Definition: features/support/lifecycle_hooks.js:8
         Message:
           error in after all hook

      2 scenarios (2 passed)
      2 steps (2 passed)
      <duration-stat>
      """
    And the exit status should be 1
