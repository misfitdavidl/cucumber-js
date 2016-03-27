Feature: After hook interface

  As a developer
  I want a hook I can use to execute code before/after all hooks
  So I can setup and teardown resources shared by all scenarios

  Scenario: Passing before/after all hooks
    Given a file named "features/my_feature.feature" with:
      """
      Feature: a feature
        Scenario: a scenario
          Given a step
      """
    And a file named "features/step_definitions/my_steps.js" with:
      """
      assert = require('assert');

      module.exports = function() {
        var x;

        this.BeforeAll(function() {
          x = 1;
        })

        this.Given(/^a step$/, function () {
          assert.equal(x, 1);
        });
      };
      """
    When I run cucumber.js with `-f progress`
    Then it outputs this text:
      """
      .

      1 scenario (1 passed)
      1 step (1 passed)
      <duration-stat>
      """

  Scenario: Failing before all hook


  Scenario: Failing after all hook
