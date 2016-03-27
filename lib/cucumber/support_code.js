var SupportCode                          = {};
SupportCode.Hook                         = require('./support_code/hook');
SupportCode.Library                      = require('./support_code/library');
SupportCode.LifecycleHook                = require('./support_code/lifecycle_hook');
SupportCode.StepDefinition               = require('./support_code/step_definition');
SupportCode.StepDefinitionSnippetBuilder = require('./support_code/step_definition_snippet_builder');
module.exports                           = SupportCode;
