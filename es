#!/bin/bash

# Comma separated paths to files to check, absolute or relative to working directory
PATHS=app,src,tests

########## PHP COPY/PASTE DETECTOR CONFIGURATION ##########
# Whether or not to run php copy/paste detector, will run if phpcpd binary is found
PHPCPD_ENABLED=true
# The minimum number of lines which need to be duplicated to count as copy/paste
PHPCPD_MIN_LINES=5
# The minimum number of duplicated tokens within a line to count as copy/paste
PHPCPD_MIN_TOKENS=70

########## PHP CODE SNIFFER CONFIGURATION ##########
# Whether or not to run php code sniffer, will run if phpcs binary is found
PHPCS_ENABLED=true
# The standards to compare code against, will be ignored if phpcs.xml exists
PHPCS_STANDARDS=PSR1,PSR2

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
# The path to output junit parseable log file, can be relative, will be ignored if left blank
PHPUNIT_JUNIT_LOG_PATH=
# The directory containing tests, will be ignored it phpunit.xml exists in working directory
PHPUNIT_TEST_DIRECTORY=tests

### DO NOT EDIT BELOW THIS LINE ###

# Assume success
exitcode=0

# Find executable
resolve_executable () {
    # Prefer executable in vendor directory
    if [ -f "vendor/bin/${1}" ]; then
        executable="php vendor/bin/${1}"
        return 0
    elif [ $(command -v ${1}) ]; then
        executable=${1}
        return 0
    fi

    return 1
}

# Process paths
resolve_paths () {
    local IFS=','

    checks=()
    for check in ${1}; do
        if [ -d "${check}" ] || [ -f "${check}" ]; then
            checks+=("${check}")
        fi
    done
}

# Set up results function
results () {
    results=$(${@})
    if [ ${?} -ne 0 ]; then
        exitcode=1
        echo -e "\n${results}\n"
    fi
}

# Import config if it exists
if [ -f "standards.cfg" ]; then
    set -a
    source standards.cfg
    set +a
fi

resolve_paths ${PATHS}

if [ ${#checks[@]} -lt 1 ]; then
    echo "Paths specfiied in configuration file are invalid or could not be found"
    echo "PATHS=<path>,<path>,..."
    exit 1
fi

# Combine directories into a single variable
checks=${checks[@]}

# Run phpcpd
if ${PHPCPD_ENABLED}; then
    resolve_executable phpcpd

    if [ ${?} -eq 0 ]; then
        echo "Running php copy/paste detector..."
        results ${executable} --ansi --min-lines=${PHPCPD_MIN_LINES} --min-tokens=${PHPCPD_MIN_TOKENS} ${checks}
    fi
fi

# Run phpcs
if ${PHPCS_ENABLED}; then
    resolve_executable phpcs

    if [ ${?} -eq 0 ]; then
        echo "Running php code sniffer..."
        if [ -f phpcs.xml ]; then
            results ${executable} --colors ${checks}
        else
            results ${executable} --standard=${PHPCS_STANDARDS} --colors --report=full ${checks}
        fi
    fi
fi

# Run phpmd
if ${PHPMD_ENABLED}; then
    resolve_executable phpmd

    if [ ${?} -eq 0 ]; then
        echo "Running php mess detector..."
        if [ -f phpmd.xml ]; then
            results ${executable} ${checks// /,} text phpmd.xml
        else
            results ${executable} ${checks// /,} text ${PHPMD_RULESETS}
        fi
    fi
fi

# Run phpstan
if ${PHPSTAN_ENABLED}; then
    resolve_executable phpstan

    if [ ${?} -eq 0 ]; then
        echo "Running phpstan..."
        if [ -f phpstan.neon ]; then
            results ${executable} analyze ${checks} -c phpstan.neon --ansi --level ${PHPSTAN_REPORTING_LEVEL} --no-progress
        else
            results ${executable} analyze ${checks} --ansi --level ${PHPSTAN_REPORTING_LEVEL} --no-progress
        fi
    fi
fi

# Run phpunit
if ${PHPUNIT_ENABLED}; then
    echo "Running phpunit..."
    # Make sure this can run
    if [ ! -f phpunit.xml ] && ([ ! -f vendor/autoload.php ] || [ ! -d ${PHPUNIT_TEST_DIRECTORY} ]); then
        echo "ERROR: Can't run phpunit as phpunit.xml can't be loaded and vendor/autoload.php or tests directory is missing"
    else
        # Prefer paratest
        resolve_executable paratest

        if [ ${?} -eq 0 ]; then
            if [ -f phpunit.xml ]; then
                phpunit_command="${executable} -p8 --runner=WrapperRunner --colors"
            else
                phpunit_command="${executable} -p8 --runner=WrapperRunner --bootstrap=vendor/autoload.php --colors ${PHPUNIT_TEST_DIRECTORY}"
            fi
        else
            resolve_executable phpunit

            if [ ${?} -eq 0 ]; then
                if [ -f phpunit.xml ]; then
                    phpunit_command="${executable} --colors=always"
                else
                    phpunit_command="${executable} --bootstrap vendor/autoload.php --colors=always ${PHPUNIT_TEST_DIRECTORY}"
                fi
            fi
        fi

        if [ ! -z ${phpunit_command+xxx} ]; then
            # If coverage is enabled, add it
            if ${PHPUNIT_ENABLE_CODE_COVERAGE}; then
                phpunit_command="${phpunit_command} --coverage-text"
            fi

            # If junit is enabled, add it
            if [ ! -z ${PHPUNIT_JUNIT_LOG_PATH} ]; then
                phpunit_command="${phpunit_command} --log-junit=${PHPUNIT_JUNIT_LOG_PATH}"
            fi

            # Run and capture result
            results=$(${phpunit_command})
            if [ ${?} -ne 0 ]; then
                exitcode=1
                echo -e "\n${results}\n"
            fi

            # Check coverage if applicable
            if ${PHPUNIT_ENABLE_CODE_COVERAGE}; then
                phpunit_line_coverage=$(echo "${results}" | grep -i 'lines:' | head -1 | perl -ne 'print ${1} if /([\.\d]+(?=%))/')

                # If coverage didn't run, warn but don't fail, otherwise compare it
                if [ -z ${phpunit_line_coverage} ]; then
                    echo -e "\033[43;5;30mWARNING: Code coverage not checked, xdebug may not be installed\033[49;5;39m"
                else
                    if [ $(echo "${phpunit_line_coverage} < ${PHPUNIT_COVERAGE_MINIMUM_LEVEL}" | bc -l) -eq 1 ]; then
                        exitcode=1
                        echo -e "\n${results}\n"
                        echo -e "Minimum code coverage level not met, expected ${PHPUNIT_COVERAGE_MINIMUM_LEVEL}% got ${phpunit_line_coverage}%"
                    fi
                fi
            fi
        fi
    fi
fi

if [ ${exitcode} -eq 0 ]; then
    echo -e "\033[1;92m"
    echo "It all looks fine to me you fucking champion!"
else
    echo -e "\033[1;91m"
    echo -e "Oh you screwed up somewhere, go fix your errors"
fi

printf "\033[m\n"

# If there was an error exit with error code
exit ${exitcode}