Feature: After hook interface

  BeforeAll and AfterAll hooks are run just once,
  at the beginning and end of the suite

  Scenario: success
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
      var assert = require('assert');

      var counter = 0;

      stepDefinitions = function() {
        this.BeforeAll(function() {
          counter = 1;
        });

        this.AfterAll(function(){
          assert.equal(counter, 1);
        });

        this.When(/^a step$/, function () {
          assert.equal(counter, 1);
        });
      };

      module.exports = stepDefinitions
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
      BeforeAll
        error in before all hook
      """
