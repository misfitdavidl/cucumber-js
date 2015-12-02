function Runtime(configuration) {
  var Cucumber = require('../cucumber');

  var listeners = [];

  var self = {
    start: function start(callback) {
      if (typeof(callback) !== 'function')
        throw new Error(Runtime.START_MISSING_CALLBACK_ERROR);

      var features = self.getFeatures();
      var supportCodeLibrary = self.getSupportCodeLibrary();
      var options = {
        dryRun: configuration.isDryRunRequested && configuration.isDryRunRequested(),
        failFast: configuration.isFailFastRequested && configuration.isFailFastRequested(),
        strict: configuration.isStrictRequested && configuration.isStrictRequested()
      };

      var astTreeWalker = Runtime.AstTreeWalker(features, supportCodeLibrary, options);
      self.attachFormatters(astTreeWalker);

      if (configuration.shouldFilterStackTraces())
        Runtime.StackTraceFilter.filter();

      astTreeWalker.walk(function (result) {
        Runtime.StackTraceFilter.unfilter();
        self.finishFormatters(function (){
          callback(result);
        });
      });
    },

    attachFormatters: function attachFormatters(astTreeWalker) {
      var formats = configuration.getFormats();
      var formatterOptions = configuration.getFormatterOptions();
      formats.forEach(function(format){
        var builder = self.getFormatterBuilder(format.type);
        var log = function (str) {
          format.stream.write(str);
        };
        builder(astTreeWalker, log, formatterOptions);
      });
    },

    finishFormatters: function finishFormatters(callback) {
      var formats = configuration.getFormats();
      var iterator = function (format, callback) {
        if (format.stream !== process.stdout) {
          format.stream.end(callback);
        } else {
          callback();
        }
      };
      Cucumber.Util.asyncForEach(formats, iterator, callback)
    },

    getFormatterBuilder: function getFormatterBuilder(type) {
      switch(type) {
        case 'json':
          return Cucumber.Listener.JsonFormatter;
        case 'progress':
          return Cucumber.Listener.ProgressFormatter;
        case 'pretty':
          return Cucumber.Listener.PrettyFormatter;
        case 'summary':
          return Cucumber.Listener.SummaryFormatter;
        case 'rerun':
          return Cucumber.Listener.RerunFormatter;
        default:
          throw new Error('Unknown formatter name "' + format.type + '".');
      }
    },

    getFeatures: function getFeatures() {
      var featureSources = configuration.getFeatureSources();
      var astFilter      = configuration.getAstFilter();
      var parser         = Cucumber.Parser(featureSources, astFilter);
      var features       = parser.parse();
      return features;
    },

    getSupportCodeLibrary: function getSupportCodeLibrary() {
      var supportCodeLibrary = configuration.getSupportCodeLibrary();
      return supportCodeLibrary;
    }
  };
  return self;
}

Runtime.START_MISSING_CALLBACK_ERROR = 'Cucumber.Runtime.start() expects a callback';
Runtime.AstTreeWalker                = require('./runtime/ast_tree_walker');
Runtime.Attachment                   = require('./runtime/attachment');
Runtime.FeaturesResult               = require('./runtime/features_result');
Runtime.ScenarioResult               = require('./runtime/scenario_result');
Runtime.StackTraceFilter             = require('./runtime/stack_trace_filter');
Runtime.StepResult                   = require('./runtime/step_result');

module.exports = Runtime;
