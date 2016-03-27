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
    And a file named "features/support/lifecycle_hooks.js" with:
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
    Given a file named "features/step_definitions/my_steps.js" with:
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
    Then the exit status should be 0

  Scenario: before all hook failure
    Given a file named "features/my_feature.feature" with:
      """
      Feature: a feature
        Scenario: first
          Given a step

        Scenario: second
          Given a step
      """
    And a file named "features/step_definitions/my_steps.js" with:
      """
      stepDefinitions = function() {
        this.BeforeAll(function() {
          throw new Error('error in before all hook');
        });

        this.When(/^a step$/, function () {});
      };

      module.exports = stepDefinitions
      """
    When I run cucumber.js
    Then the exit status should be 1
    And the output contains the text:
      """
      Failures:

      1) Step: Before All
         Step Definition: features/step_definitions/my_steps.js:5
         Message:
           error in before all hook

      1 scenario (1 failed)
      1 step (1 skipped)
      <duration-stat>
      """

  Scenario: after all hook failure
    Given a file named "features/my_feature.feature" with:
      """
      Feature: a feature
        Scenario: first
          Given a step

        Scenario: second
          Given a step
      """
    And a file named "features/step_definitions/my_steps.js" with:
      """
      stepDefinitions = function() {
        this.BeforeAll(function() {
          throw new Error('error in before all hook');
        });

        this.When(/^a step$/, function () {});
      };

      module.exports = stepDefinitions
      """
    When I run cucumber.js
    Then the exit status should be 1
    And the output contains the text:
      """
      Failures:

      1) Step: Before All
         Step Definition: features/step_definitions/my_steps.js:5
         Message:
           error in before all hook

      1 scenario (1 failed)
      1 step (1 skipped)
      <duration-stat>
      """
