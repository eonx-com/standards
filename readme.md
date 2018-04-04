# EoneoPay Standards Library

This library provides the tools required to check a codebase against the EoneoPay coding standards.

## Installation

This library is installed via composer:

    composer require --dev eoneopay/standards dev-master
    
### Requirements

This library requires a minimum of PHP 5.6.
    
### Compatible tools
    
This library will automatically run the following packages if they are found on the system. They can be installed via composer or available globally, e.g. installed via brew.

| Package | Purpose |
|---------|---------|
| [Copy/Paste Detector](https://github.com/sebastianbergmann/phpcpd) | Detect code duplication |
| [Paratest](https://github.com/paratestphp/paratest) | Run unit tests in parallel |
| [PHP CodeSniffer](https://github.com/squizlabs/PHP_CodeSniffer) | Check code style |
| [PHP Mess Detector](https://phpmd.org) | Check coding best practices |
| [PHPStan](https://github.com/phpstan/phpstan) | Static analysis of code to detect potential errors |
| [PHPUnit](https://phpunit.de) | Run unit tests |

### Recommended extensions

It's recommended you also install the following extensions for PHP.

| Extension | Purpose |
|-----------|---------|
| [Xdebug](https://xdebug.org) | Calculate code coverage of unit tests |

## Checking your codebase

You can simply run `es` from the vendor directory to check your code base, any packages which are installed will be run automatically.

    php vendor/bin/es
    
Any php files in the `app/`, `src/` or `tests/` directories of your application or library will be checked by default.

## Configuration

You can fine tune the configuration by adding an `standards.cfg` file to the root directory of your application or library and adjusting the following variables:

```
# Comma separated paths to files to check, absolute or relative to working directory
PATHS=app,src,tests

########## PHP COPY/PASTE DETECTOR CONFIGURATION ##########
# Whether or not to run phpstan as part of lctools, won't run if binary/vendor package is missing
PHPCPD_ENABLED=true
# The minimum number of lines which need to be duplicated to count as copy/paste
PHPCPD_MIN_LINES=5
# The minimum number of duplicated tokens within a line to count as copy/paste
PHPCPD_MIN_TOKENS=70

########## PHP CODE SNIFFER CONFIGURATION ##########
# Whether or not to run phpstan as part of lctools, won't run if binary/vendor package is missing
PHPCS_ENABLED=true
# The standards to compare code against, will be ignored if phpcs.xml exists
PHPCS_STANDARDS=vendor/eoneopay/standards/php-code-sniffer/EoneoPay

########## PHP MESS DETECTOR CONFIGURATION ##########
# Whether or not to run phpstan as part of lctools, won't run if binary/vendor package is missing
PHPMD_ENABLED=true
# The rulesets to use to determine issues, will be ignored if phpmd.xml exists
PHPMD_RULESETS=cleancode,codesize,controversial,design,naming,unusedcode

########## PHPSTAN CONFIGURATION ##########
# Whether or not to run phpstan as part of lctools, won't run if binary/vendor package is missing
PHPSTAN_ENABLED=true
# The reporting level, 1 = loose, 7 = strict
PHPSTAN_REPORTING_LEVEL=7

########## PHPUNIT CONFIGURATION ##########
# Whether or not to run phpunit as part of lctools, won't run if binary/vendor package is missing
PHPUNIT_ENABLED=true
# Whether or not to enable code coverage checks
PHPUNIT_ENABLE_CODE_COVERAGE=true
# The minimum percentage of coverage to have, will be ignored if coverage check is disabled
PHPUNIT_COVERAGE_MINIMUM_LEVEL=90
# The path to output junit parseable log file, can be relative, will be ignored if left blank
PHPUNIT_JUNIT_LOG_PATH=
# The directory containing tests, will be ignored it phpunit.xml exists in working directory
PHPUNIT_TEST_DIRECTORY=tests
```

### Tool configuration

You can also configure individual tools by adding configuration files to the root directory of your application or library.

| Package | Filename |
|---------|----------|
| [Paratest](https://phpunit.de/manual/current/en/appendixes.configuration.html) | phpunit.xml |
| [PHP CodeSniffer](https://github.com/squizlabs/PHP_CodeSniffer/wiki/Annotated-ruleset.xml) | phpcs.xml |
| [PHP Mess Detector](https://phpmd.org/documentation/creating-a-ruleset.html) | phpmd.xml |
| [PHPStan](https://github.com/phpstan/phpstan#configuration) | phpstan.neon |
| [PHPUnit](https://phpunit.de/manual/current/en/appendixes.configuration.html) | phpunit.xml |