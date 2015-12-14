require('../../support/spec_helper');
require('../../support/configurations_shared_examples.js');

describe("Cucumber.Cli.Configuration", function () {
  var Cucumber = requireLib('cucumber');
  var fs = require('fs');
  var args, configuration, options;
  var context = {};

  beforeEach(function () {
    options = {};
    args = [];
    configuration = Cucumber.Cli.Configuration(options, args);
    context.configuration = configuration;
  });

  itBehavesLikeAllCucumberConfigurations(context);

  describe("getFormats()", function () {
    describe("with no output redirection", function () {
      describe("with a single format", function () {
        beforeEach(function () {
          options.format = ['json'];
        })

        it("returns the type and stdout as the output", function () {
          expect(configuration.getFormats()).toEqual([{type: 'json', stream: process.stdout}]);
        });
      });

      describe("with multiple format", function () {
        beforeEach(function () {
          options.format = ['json', 'progress'];
        })

        it("returns the last type and stdout as the output", function () {
          expect(configuration.getFormats()).toEqual([{type: 'progress', stream: process.stdout}]);
        });
      });
    });

    describe("when the formatter output is redirected", function () {
      var fd, stream, result;

      beforeEach(function () {
        fd = createSpy('fd');
        spyOn(fs, 'openSync').and.returnValue(fd);

        stream = createSpy('stream');
        spyOn(fs, 'createWriteStream').and.returnValue(stream);

        options.format = ['json:path/to/file'];
        result = configuration.getFormats();
      });

      it("opens the file for writing", function () {
        expect(fs.openSync).toHaveBeenCalledWith('path/to/file', 'w');
      });

      it("creates a write stream to the file", function () {
        expect(fs.createWriteStream).toHaveBeenCalledWith(null, {fd: fd});
      });

      it("returns the type and stream output", function () {
        expect(result).toEqual([{type: 'json', stream: stream}]);
      });
    });
  });
});
