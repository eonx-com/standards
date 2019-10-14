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
| [PHP CS Fixer](https://github.com/FriendsOfPHP/PHP-CS-Fixer) | Standardise code style |
| [PHP Mess Detector](https://phpmd.org) | Check coding best practices |
| [PHPStan](https://github.com/phpstan/phpstan) | Static analysis of code to detect potential errors |
| [PHPUnit](https://phpunit.de) | Run unit tests |
| [Security Checker](https://security.symfony.com/) | Check project's dependencies for known vulnerabilities |

### Recommended extensions

It's recommended you also install the following extensions for PHP.

| Extension | Purpose |
|-----------|---------|
| [Xdebug](https://xdebug.org) | Calculate code coverage of unit tests |

## Checking your codebase

You can simply run `es` from the vendor directory to check your code base, any packages which are installed will be run automatically.

    bash vendor/bin/es
    
Any php files in the `app/`, `src/` or `tests/` directories of your application or library will be checked by default.

## Configuration

You can fine tune the configuration by adding an `standards.cfg` file to the root directory of your application or library and adjusting the following variables:

```
# Comma separated paths to files to check, absolute or relative to working directory
PATHS=app,src,tests

########## CHANGE DETECTION CONFIGURATION ##########
# The primary branch for your repository which feature branches are merged into
CD_PRIMARY_BRANCH=development
# Branches which a full scan of the paths above should be performed
CD_FULL_SCAN_BRANCHES=master,${CD_PRIMARY_BRANCH}

########## PHP COPY/PASTE DETECTOR CONFIGURATION ##########
# Whether or not to run php copy/paste detector, will run if phpcpd binary is found
PHPCPD_ENABLED=true
# A comma seperated list of regexes to exclude from copy/paste detection
PHPCPD_EXCLUDE_REGEX=
# The minimum number of lines which need to be duplicated to count as copy/paste
PHPCPD_MIN_LINES=5
# The minimum number of duplicated tokens within a line to count as copy/paste
PHPCPD_MIN_TOKENS=70

########## PHP CODE SNIFFER CONFIGURATION ##########
# Whether or not to run php code sniffer, will run if phpcs binary is found
PHPCS_ENABLED=true
# The standards to compare code against, will be ignored if phpcs.xml exists
PHPCS_STANDARDS=vendor/eoneopay/standards/php-code-sniffer/EoneoPay
# Whether to show the code sniffs name on report output
PHPCS_SHOW_SNIFF_NAME=true

########## PHP CS FIXER CONFIGURATION ##########
# Whether or not to run php code sniffer, will run if phpcs binary is found
PHPCS_FIXER_ENABLED=true
# Default rules to be used when no .php_cs file exists in the project
PHPCS_FIXER_RULES='@PSR2,trailing_comma_in_multiline_array'

########## PHP MESS DETECTOR CONFIGURATION ##########
# Whether or not to run php mess destector, will run if phpmd binary is found
PHPMD_ENABLED=true
# The rulesets to use to determine issues, will be ignored if phpmd.xml exists
PHPMD_RULESETS=cleancode,codesize,controversial,design,naming,unusedcode

########## PHPSTAN CONFIGURATION ##########
# Whether or not to run phpstan, will run if phpstan binary is found
PHPSTAN_ENABLED=true
# The reporting level, 1 = loose, 7 = strict
PHPSTAN_REPORTING_LEVEL=7

########## PHPUNIT CONFIGURATION ##########
# Whether or not to run phpunit, will run if paratest or phpunit binary is found
PHPUNIT_ENABLED=true
# Whether or not to enable code coverage checks
PHPUNIT_ENABLE_CODE_COVERAGE=true
# The minimum percentage of coverage to have, will be ignored if coverage check is disabled
PHPUNIT_COVERAGE_MINIMUM_LEVEL=90
# The testsuites to run with coverage
PHPUNIT_COVERAGE_TEST_SUITES=
# The path to output junit parseable log file, can be relative, will be ignored if left blank
PHPUNIT_JUNIT_LOG_PATH=
# The directory containing tests, will be ignored it phpunit.xml exists in working directory
PHPUNIT_TEST_DIRECTORY=tests
# The test suites to run, will run all tests if not specified
PHPUNIT_TEST_SUITES=

########## SECURITY CHECKER CONFIGURATION ##########
# Whether or not to run security-checker, will run if security-checker binary is found
SECURITY_CHECKER_ENABLED=true
```

### Tool configuration

You can also configure individual tools by adding configuration files to the root directory of your application or library.

| Package | Filename |
|---------|----------|
| [Paratest](https://phpunit.de/manual/current/en/appendixes.configuration.html) | phpunit.xml |
| [PHP CodeSniffer](https://github.com/squizlabs/PHP_CodeSniffer/wiki/Annotated-ruleset.xml) | phpcs.xml |
| [PHP CS Fixer](https://github.com/FriendsOfPHP/PHP-CS-Fixer#usage) | .php_cs |
| [PHP Mess Detector](https://phpmd.org/documentation/creating-a-ruleset.html) | phpmd.xml |
| [PHPStan](https://github.com/phpstan/phpstan#configuration) | phpstan.neon |
| [PHPUnit](https://phpunit.de/manual/current/en/appendixes.configuration.html) | phpunit.xml |
