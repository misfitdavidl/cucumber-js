function PrettyFormatter(suite, log, options) {
  var Cucumber         = require('../../cucumber');
  var path             = require('path');

  var colors           = Cucumber.Util.Colors(options.useColors);
  var summaryFormatterOptions = {
    snippets: options.snippets,
    snippetSyntax: options.snippetSyntax,
    hideFailedStepResults: true,
    useColors: options.useColors
  };
  Cucumber.Listener.SummaryFormatter(suite, log, summaryFormatterOptions);
  var uriCommentIndex = 0;

  suite.on('BeforeFeature', function (feature) {
    var source = '';

    var tagsSource = formatTags(feature.getTags());
    if (tagsSource) {
      source = tagsSource + '\n';
    }

    var identifier = feature.getKeyword() + ': ' + feature.getName();
    source += identifier;

    var description = feature.getDescription();
    if (description) {
      source += '\n\n' + indent(description, 1);
    }

    source += '\n\n';

    log(source);
  });

  suite.on('BeforeScenario', function (scenario) {
    var source = '';

    var tagsSource = formatTags(scenario.getOwnTags());
    if (tagsSource) {
      source = tagsSource + '\n';
    }

    var identifier = scenario.getKeyword() + ': ' + scenario.getName();
    if (options.showSource) {
      var lineLengths = [identifier.length, determineMaxStepLengthForElement(scenario)];
      if (scenario.getBackground() !== undefined) {
        lineLengths.push(determineMaxStepLengthForElement(scenario.getBackground()));
      }
      uriCommentIndex = Math.max.apply(null, lineLengths) + 1;

      identifier = pad(identifier, uriCommentIndex + 2) +
                   colors.comment('# ' + path.relative(process.cwd(), scenario.getUri()) + ':' + scenario.getLine());
    }
    source += identifier;

    logIndented(source, 1);
    log('\n');
  });

  suite.on('AfterScenario', function () {
    log('\n');
  });

  suite.on('StepResult', function (stepResult) {
    var step = stepResult.getStep();
    if (!step.isHidden() || stepResult.getStatus() === Cucumber.Status.FAILED) {
      logStepResult(step, stepResult);
    }
  });

  function applyColor (stepResult, source) {
    var status = stepResult.getStatus();
    return colors[status](source);
  }

  function formatTags(tags) {
    if (tags.length === 0) {
      return '';
    }

    var tagNames = tags.map(function (tag) {
      return tag.getName();
    });

    return colors.tag(tagNames.join(' '));
  }

  function logStepResult(step, stepResult) {
    var identifier = step.getKeyword() + (step.getName() || '');
    var stepDefintion = stepResult.getStepDefinition();

    if (options.showSource && stepDefintion) {
      identifier = pad(identifier, uriCommentIndex);
      identifier += colors.comment('# ' + path.relative(process.cwd(), stepDefintion.getUri()) + ':' + stepDefintion.getLine());
    }

    identifier = applyColor(stepResult, identifier);
    logIndented(identifier, 2);
    log('\n');

    if (step.hasDataTable()) {
      var dataTable = step.getDataTable();
      var dataTableSource = formatDataTable(stepResult, dataTable);
      logIndented(dataTableSource, 3);
    }

    if (step.hasDocString()) {
      var docString = step.getDocString();
      var docStringSource = formatDocString(stepResult, docString);
      logIndented(docStringSource, 3);
    }

    if (stepResult.getStatus() === Cucumber.Status.FAILED) {
      var failure            = stepResult.getFailureException();
      var failureDescription = failure.stack || failure;
      logIndented(failureDescription, 3);
      log('\n');
    }
  }

  function formatDataTable(stepResult, dataTable) {
    var rows         = dataTable.raw();
    var columnWidths = determineColumnWidthsFromRows(rows);
    var source = '';
    rows.forEach(function (row) {
      source += '|';
      row.forEach(function (cell, columnIndex) {
        var columnWidth = columnWidths[columnIndex];
        source += ' ' + applyColor(stepResult, pad(cell, columnWidth)) + ' |';
      });
      source += '\n';
    });
    return source;
  }

  function formatDocString(stepResult, docString) {
    var contents = '"""\n' + docString.getContents() + '\n"""';
    return applyColor(stepResult, contents) + '\n';
  }

  function logIndented(text, level) {
    var indented = indent(text, level);
    log(indented);
  }

  function indent(text, level) {
    var indented;
    text.split('\n').forEach(function (line) {
      var prefix = new Array(level + 1).join('  ');
      line = (prefix + line).replace(/\s+$/, '');
      indented = (typeof(indented) === 'undefined' ? line : indented + '\n' + line);
    });
    return indented;
  }

  function determineMaxStepLengthForElement(element) {
    var max = 0;
    element.getSteps().forEach(function (step) {
      var stepLength = step.getKeyword().length + step.getName().length;
      if (stepLength > max) max = stepLength;
    });
    return max;
  }

  function determineColumnWidthsFromRows(rows) {
    var columnWidths = [];
    var currentColumn;

    rows.forEach(function (cells) {
      currentColumn = 0;
      cells.forEach(function (cell) {
        var currentColumnWidth = columnWidths[currentColumn];
        var currentCellWidth   = cell.length;
        if (typeof currentColumnWidth === 'undefined' || currentColumnWidth < currentCellWidth)
          columnWidths[currentColumn] = currentCellWidth;
        currentColumn += 1;
      });
    });

    return columnWidths;
  }

  function pad(text, width) {
    var padded = '' + text;
    while (padded.length < width) {
      padded += ' ';
    }
    return padded;
  }
}

module.exports = PrettyFormatter;
