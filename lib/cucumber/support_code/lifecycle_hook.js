function LifecycleHook(options, code, uri, line) {
  var Cucumber = require('../../cucumber');
  var self = Cucumber.SupportCode.StepDefinition('', options, code, uri, line);

  self.buildInvocationParameters = function buildInvocationParameters(step, scenario, callback) {
    return [callback];
  };

  self.validCodeLengths = function validCodeLengths() {
    return [0, 1];
  };

  self.invalidCodeLengthMessage = function invalidCodeLengthMessage() {
    return self.buildInvalidCodeLengthMessage('0', '1');
  };

  self.getType = function getType () {
    return 'lifecycle hook';
  };

  return self;
}

module.exports = LifecycleHook;
