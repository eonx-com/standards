#!/bin/bash

# Comma separated paths to files to check, absolute or relative to working directory
PATHS=${PATHS:=app,src,tests}

########## CHANGE DETECTION CONFIGURATION ##########
# The primary branch for your repository which feature branches are merged into
CD_PRIMARY_BRANCH=${CD_PRIMARY_BRANCH:=development}
# Branches which a full scan of the paths above should be performed
CD_FULL_SCAN_BRANCHES=${CD_FULL_SCAN_BRANCHES:=master,${CD_PRIMARY_BRANCH}}

########## PHP COPY/PASTE DETECTOR CONFIGURATION ##########
# Whether or not to run php copy/paste detector, will run if phpcpd binary is found
PHPCPD_ENABLED=${PHPCPD_ENABLED:=true}
# A comma seperated list of regexes to exclude from copy/paste detection
PHPCPD_EXCLUDE_REGEX=${PHPCPD_EXCLUDE_REGEX:=}
# The minimum number of lines which need to be duplicated to count as copy/paste
PHPCPD_MIN_LINES=${PHPCPD_MIN_LINES:=5}
# The minimum number of duplicated tokens within a line to count as copy/paste
PHPCPD_MIN_TOKENS=${PHPCPD_MIN_TOKENS:=70}

########## PHP CODE SNIFFER CONFIGURATION ##########
# Whether or not to run php code sniffer, will run if phpcs binary is found
PHPCS_ENABLED=${PHPCS_ENABLED:=true}
# The standards to compare code against, will be ignored if phpcs.xml exists
PHPCS_STANDARDS=${PHPCS_STANDARDS:=vendor/eonx-com/standards/php-code-sniffer/EoneoPay}
# Whether to show the code sniffs name on report output
PHPCS_SHOW_SNIFF_NAME=${PHPCS_SHOW_SNIFF_NAME:=true}

########## PHP CS FIXER CONFIGURATION ##########
# Whether or not to run php code sniffer, will run if phpcs binary is found
PHPCS_FIXER_ENABLED=${PHPCS_FIXER_ENABLED:=true}
# Default rules to be used when no .php_cs file exists in the project
PHPCS_FIXER_RULES=${PHPCS_FIXER_RULES:='@PSR2,trailing_comma_in_multiline_array'}

########## PHP MESS DETECTOR CONFIGURATION ##########
# Whether or not to run php mess destector, will run if phpmd binary is found
PHPMD_ENABLED=${PHPMD_ENABLED:=true}
# The rulesets to use to determine issues, will be ignored if phpmd.xml exists
PHPMD_RULESETS=${PHPMD_RULESETS:=cleancode,codesize,controversial,design,naming,unusedcode}

########## PHPSTAN CONFIGURATION ##########
# Whether or not to run phpstan, will run if phpstan binary is found
PHPSTAN_ENABLED=${PHPSTAN_ENABLED:=true}
# The reporting level, 1 = loose, 7 = strict
PHPSTAN_REPORTING_LEVEL=${PHPSTAN_REPORTING_LEVEL:=7}

########## PHPUNIT CONFIGURATION ##########
# Whether or not to run phpunit, will run if phpunit binary is found
PHPUNIT_ENABLED=${PHPUNIT_ENABLED:=true}
# Whether or not to enable code coverage checks
PHPUNIT_ENABLE_CODE_COVERAGE=${PHPUNIT_ENABLE_CODE_COVERAGE:=true}
# The minimum percentage of coverage to have, will be ignored if coverage check is disabled
PHPUNIT_COVERAGE_MINIMUM_LEVEL=${PHPUNIT_COVERAGE_MINIMUM_LEVEL:=90}
# The testsuites to run with coverage
PHPUNIT_COVERAGE_TEST_SUITES=${PHPUNIT_COVERAGE_TEST_SUITES:=}
# The path to output junit parseable log file, can be relative, will be ignored if left blank
PHPUNIT_JUNIT_LOG_PATH=${PHPUNIT_JUNIT_LOG_PATH:=}
# The directory containing tests, will be ignored it phpunit.xml exists in working directory
PHPUNIT_TEST_DIRECTORY=${PHPUNIT_TEST_DIRECTORY:=tests}
# The test suites to run, will run all tests if not specified
PHPUNIT_TEST_SUITES=${PHPUNIT_TEST_SUITES:=}

########## SECURITY CHECKER CONFIGURATION ##########
# Whether or not to run security-checker, will run if security-checker binary is found
SECURITY_CHECKER_ENABLED=${SECURITY_CHECKER_ENABLED:=false}

### DO NOT EDIT BELOW THIS LINE ###

# Assume success
exitcode=0

# Capture options
while getopts "f" option; do
    case ${option} in
        f)
            FORCE_FULL_SCAN=true
        ;;
    esac
done

### FUNCTIONS FOR SPECIFIC CHECKS ###
function run_phpcpd() {
    # If check is disabled, skip
    if [ ${PHPCPD_ENABLED} == false ]; then
        echo -e "\033[1;93mNot running php copy/paste detector as it's disabled...\033[49;5;39m"

        return 0
    fi

    # Find executable
    local executable=$(resolve_executable phpcpd)

    # If executable can't be found, abort
    if [ -z "${executable}" ]; then
        echo -e "\033[1;91mUnable to run php copy/paste detector as the executable can't be found...\033[49;5;39m"

        return 1
    fi

    # Always do a full compare for phpcpd since we want to check copy/paste across everything
    local paths=$(get_full_scan_paths)

    echo "Running php copy/paste detector..."
    if [ -z "${PHPCPD_EXCLUDE_REGEX}" ]; then
        results ${executable} --ansi --min-lines=${PHPCPD_MIN_LINES} --min-tokens=${PHPCPD_MIN_TOKENS} ${paths}
    else
        results ${executable} --ansi --min-lines=${PHPCPD_MIN_LINES} --min-tokens=${PHPCPD_MIN_TOKENS} --regexps-exclude="${PHPCPD_EXCLUDE_REGEX}" ${paths}
    fi

    return ${?}
}

function run_phpcs() {
    # If check is disabled, skip
    if [ ${PHPCS_ENABLED} == false ]; then
        echo -e "\033[1;93mNot running php code sniffer as it's disabled...\033[49;5;39m"

        return 0
    fi

    # Find executable
    local executable=$(resolve_executable phpcs)

    # If executable can't be found, abort
    if [ -z "${executable}" ]; then
        echo -e "\033[1;91mUnable to run php code sniffer as the executable can't be found...\033[49;5;39m"

        return 1
    fi

    # Do a partial scan if possible
    local paths=$(get_paths)

    show_sniff_arg=$([ "${PHPCS_SHOW_SNIFF_NAME}" == true ] && echo '-s')
    echo "Running php code sniffer..."
    if [ -f phpcs.xml ]; then
        results ${executable} --colors ${paths} ${show_sniff_arg}
    else
        results ${executable} --standard=${PHPCS_STANDARDS} --colors --report=full ${paths} ${show_sniff_arg}
    fi

    return ${?}
}

function run_phpmd() {
    # If check is disabled, skip
    if [ ${PHPMD_ENABLED} == false ]; then
        echo -e "\033[1;93mNot running php mess detector as it's disabled...\033[49;5;39m"

        return 0
    fi

    # Find executable
    local executable=$(resolve_executable phpmd)

    # If executable can't be found, abort
    if [ -z "${executable}" ]; then
        echo -e "\033[1;91mUnable to run php mess detector as the executable can't be found...\033[49;5;39m"

        return 1
    fi

    # Do a partial scan if possible
    local paths=$(get_paths)

    echo "Running php mess detector..."
    if [ -f phpmd.xml ]; then
        results ${executable} ${paths// /,} text phpmd.xml
    else
        results ${executable} ${paths// /,} text ${PHPMD_RULESETS}
    fi

    return ${?}
}

function run_phpstan() {
    # If check is disabled, skip
    if [ ${PHPSTAN_ENABLED} == false ]; then
        echo -e "\033[1;93mNot running phpstan as it's disabled...\033[49;5;39m"

        return 0
    fi

    # Find executable
    local executable=$(resolve_executable phpstan)

    # If executable can't be found, abort
    if [ -z "${executable}" ]; then
        echo -e "\033[1;91mUnable to run phpstan as the executable can't be found...\033[49;5;39m"

        return 1
    fi

    # Do a partial scan if possible
    local paths=$(get_paths)

    echo "Running phpstan..."
    if [ -f phpstan.neon ]; then
        results ${executable} analyze ${paths} -c phpstan.neon --ansi --level ${PHPSTAN_REPORTING_LEVEL} --no-progress
    else
        results ${executable} analyze ${paths} --ansi --level ${PHPSTAN_REPORTING_LEVEL} --no-progress
    fi

    return ${?}
}

function run_phpunit() {
    # If check is disabled, skip
    if [ ${PHPUNIT_ENABLED} == false ]; then
        echo -e "\033[1;93mNot running phpunit detector as it's disabled...\033[49;5;39m"

        return 0
    fi

    # Find executable
    local executable=$(resolve_executable phpunit)

    # If executable can't be found, abort
    if [ -z "${executable}" ]; then
        echo -e "\033[1;91mUnable to run phpunit as the executable can't be found...\033[49;5;39m"

        return 1
    fi

    # Make sure phpunit can run
    if [ ! -f phpunit.xml ] && ([ ! -f vendor/autoload.php ] || [ ! -d ${PHPUNIT_TEST_DIRECTORY} ]); then
        echo -e "\033[1;91mUnable to run phpunit as phpunit.xml can't be loaded and vendor/autoload.php is missing or tests directory is not valid...\033[49;5;39m"

        return 1
    fi

    # Prefer using phpunit.xml
    if [ -f phpunit.xml ]; then
        local command="${executable} --colors=always"
    else
        local command="${executable} --bootstrap vendor/autoload.php --colors=always ${PHPUNIT_TEST_DIRECTORY}"
    fi

    # If suites aren't defined, run full
    if [ -z "${PHPUNIT_TEST_SUITES}" ]; then
        if [ ${PHPUNIT_ENABLE_CODE_COVERAGE} == false ]; then
            phpunit_without_coverage "${command}"
        else
            phpunit_with_coverage "${command}"
        fi

        return ${?}
    fi

    # Run each test suite if we need coverage, otherwise run them all
    if [ ${PHPUNIT_ENABLE_CODE_COVERAGE} == false ]; then
        phpunit_without_coverage "${command}" ${PHPUNIT_TEST_SUITES}

        return ${?}
    fi

    # Run each test suite, only run coverage where needed
    local IFS=','
    local returncode=0
    for testsuite in ${PHPUNIT_TEST_SUITES}; do
        for covered in ${PHPUNIT_COVERAGE_TEST_SUITES}; do
            if [ ${testsuite} == ${covered} ]; then
                # Run with coverage
                phpunit_with_coverage "${command}" ${testsuite}

                # Update return code
                returncode=$((${returncode} + ${?}))

                # Skip to next suite
                continue 2
            fi
        done

        # Run without coverage
        phpunit_without_coverage "${command}" ${testsuite}

        # Update return code
        returncode=$((${returncode} + ${?}))
    done

    return ${returncode}
}

function run_security() {
    # If check is disabled, skip
    if [ ${SECURITY_CHECKER_ENABLED} == false ]; then
        echo -e "\033[1;93mNot running security checker as it's disabled...\033[49;5;39m"

        return 0
    fi

    # Find executable
    executable=$(resolve_executable security-checker)

    # If executable can't be found, abort
    if [ -z "${executable}" ]; then
        echo -e "\033[1;91mUnable to run security checker as the executable can't be found...\033[49;5;39m"

        return 1
    fi

    echo "Running security-checker..."
    results ${executable} security:check

    return ${?}
}

### FUNCTIONS FOR MISCELLANEOUS TASKS ###

# Get the paths to check for a full scan
function get_full_scan_paths() {
    local IFS=','

    # A partial scan wasn't done, so perform a full scan
    local paths=()
    for check in ${PATHS}; do
        # Only add file/directory if it's legit
        if [ -d "${PWD}/${check}" ] || [ -f "${PWD}/${check}" ]; then
            paths+=("${PWD}/${check}")
        fi
    done

    # If we have paths, return
    if [ ${#paths[@]} -gt 0 ]; then
        echo ${paths[@]}

        return 0
    fi

    return 1
}

# Get the files to check for a partial scan
function get_partial_scan_paths() {
    # Use git to determine what files have changed, if git doesn't exist, abort
    local git=$(command -v git)
    if [ -z ${git} ] || [ ! -x ${git} ]; then
        return 1
    fi

    # Determine current branch and changes made from checkout
    local current_branch=$(${git} rev-parse --abbrev-ref HEAD 2>/dev/null)
    local vcs_changes=$(${git} diff --name-only ${current_branch} $(${git} merge-base ${current_branch} ${CD_PRIMARY_BRANCH}))

    # Process each change and make filename safe for bash
    local changeset=""
    local IFS=$'\n'
    for change in ${vcs_changes}; do
        # Remove surrounding quotes
        change=${change%\"}
        change=${change#\"}

        # Remove escaped quotes
        change=${change//\\"/"}

        # Only php files and only if the file still exists
        if [ -f ${change} ] && [[ ${change} == *".php"* ]]; then
            change=$(printf "%q" "${change}")
            changeset+=("${change}")
        fi
    done

    # If we have a changeset, return
    if [ ${#changeset[@]} -gt 0 ]; then
        echo ${changeset[@]}

        return 0
    fi

    return 1
}

# Determine paths to check
function get_paths() {
    # Always perform a local scan if we can
    if [ $(should_perform_full_scan) == false ]; then
        local paths=$(get_partial_scan_paths)

        # If paths were found, return
        if [ ! -z "${paths}" ]; then
            echo ${paths}

            return 0
        fi
    fi

    # Get full scan path
    paths=$(get_full_scan_paths)
    echo ${paths}

    return ${?}
}

# Run phpunit with coverage
function phpunit_with_coverage() {
    # Add coverage to command
    local command="${1} --coverage-text"

    # If junit is enabled, add it
    if [ ! -z "${PHPUNIT_JUNIT_LOG_PATH}" ]; then
        command="${command} --log-junit=${PHPUNIT_JUNIT_LOG_PATH}"
    fi

    # Prefer running with phpdbg if possible
    local phpdbg=$(command -v phpdbg)
    if [ ! -z "${phpdbg}" ]; then
        local php=$(command -v php)
        command="${phpdbg} -qrr ${command#${php} }"
    fi

    # If a test suite has been passed, use it
    if [ ! -z "${2}" ]; then
        echo "Running phpunit with coverage for testsuite(s): ${2}..."
        command="${command} --testsuite ${2}"
    else
        echo "Running phpunit with coverage..."
    fi

    local IFS=' ';
    local results=$(${command})

    # If phpunit failed, abort since output will have been shown already
    if [ ${?} -ne 0 ]; then
        echo "${command}"
        echo -e "\n${results}\n"

        return ${?}
    fi

    # Check coverage results
    if ${PHPUNIT_ENABLE_CODE_COVERAGE}; then
        local phpunit_line_coverage=$(echo "${results}" | grep -i 'lines:' | head -1 | perl -ne 'print ${1} if /([\.\d]+(?=%))/')

        # If coverage didn't run, warn but don't fail, otherwise compare it
        if [ -z ${phpunit_line_coverage} ]; then
            echo -e "\033[43;5;30mCode coverage not checked, xdebug may not be installed\033[49;5;39m"

            return 1
        else
            if [ $(echo "${phpunit_line_coverage} < ${PHPUNIT_COVERAGE_MINIMUM_LEVEL}" | bc -l) -eq 1 ]; then
                echo -e "\n${results}\n"
                echo -e "Minimum code coverage level not met, expected ${PHPUNIT_COVERAGE_MINIMUM_LEVEL}% got ${phpunit_line_coverage}%"

                return 1
            fi
        fi
    fi
}

# Run phpunit without coverage
function phpunit_without_coverage() {
    # If a test suite has been passed, use it
    if [ ! -z "${2}" ]; then
        echo "Running phpunit for testsuite(s): ${2}..."
        # Add coverage to parameters
        local command="${1} --testsuite ${2}"
    else
        echo "Running phpunit..."
        local command="${1}"
    fi

    results ${command}

    return ${?}
}

# Find executable
function resolve_executable() {
    # Prefer executable in vendor directory
    local php=$(command -v php)
    if [ ! -z ${php} ] && [ -x ${php} ] && [ -f "vendor/bin/${1}" ]; then
        echo "${php} vendor/bin/${1}"

        return 0
    elif [ $(command -v ${1}) ]; then
        echo ${1}

        return 0
    fi

    return 1
}

# Run executable and capture results
function results() {
    # Ensure we're using a space for parameters
    local IFS=' ';

    # Output command being run
    results=$(${@})
    local returncode=${?}

    # If there was an issue, display output
    if [ ${returncode} -ne 0 ]; then
        echo ${@}
        echo -e "\n${results}\n"

        return ${returncode}
    fi

    return 0
}

# Run a command and update exit code
function run() {
    run_${1}

    # Update exit code with return
    exitcode=$((${exitcode} + ${?}))
}

# Determine if a full scan is needed
function should_perform_full_scan() {
    # If a full scan is forced, return
    if [ ${FORCE_FULL_SCAN:=false} == true ]; then
        echo true

        return 0
    fi

    local IFS=','

    # Attempt to find git, only continue if git is executable and es is being run from inside a working directory
    local git=$(command -v git)
    if [ -z ${git} ] || [ ! -x ${git} ] || [[ $(${git} rev-parse --is-inside-work-tree 2>/dev/null) != "true" ]]; then
        echo true

        return 0
    fi

    # If the current branch is a full scan branch, perform a don't detect changes
    local current_branch=$(${git} rev-parse --abbrev-ref HEAD 2>/dev/null)
    for branch in ${CD_FULL_SCAN_BRANCHES}; do
        if [ ${current_branch} == ${branch} ]; then
            echo true

            return 0
        fi
    done

    # If there has been no issues, perform a partial scan
    echo false
}

# Import config if it exists
if [ -f "standards.cfg" ]; then
    set -a
    source standards.cfg
    set +a
fi

# Output the type of scan being performed
if [ $(should_perform_full_scan) == false ] && [[ $(get_paths) != $(get_full_scan_paths) ]]; then
    echo -e "\033[1;34mPerforming a partial scan...\033[m\n"
else
    echo -e "\033[1;34mPerforming a full scan...\033[m\n"
fi

# Run checks
run phpcpd
run phpcs
run phpmd
run phpstan
run phpunit
run security

# Done son
if [ ${exitcode} -eq 0 ]; then
    echo -e "                  _      _        _______ ______  _____ _______ _____   _____         _____ _____ ______ _____          "
    echo -e "            /\   | |    | |      |__   __|  ____|/ ____|__   __/ ____| |  __ \ /\    / ____/ ____|  ____|  __ \         "
    echo -e "           /  \  | |    | |         | |  | |__  | (___    | | | (___   | |__) /  \  | (___| (___ | |__  | |  | |        "
    echo -e "          / /\ \ | |    | |         | |  |  __|  \___ \   | |  \___ \  |  ___/ /\ \  \___ \\\\\\___ \|  __| | |  | |        "
    echo -e "         / ____ \| |____| |____     | |  | |____ ____) |  | |  ____) | | |  / ____ \ ____) |___) | |____| |__| |        "
    echo -e "        /_/    \_\______|______|    |_|  |______|_____/   |_| |_____/  |_| /_/    \_\_____/_____/|______|_____/         "
    echo -e ""
    echo -e "((((//,,*(#%%%%%%%%%%%%%%%#(*,,,****************************************************,*/(((((((((/((((////****/((##%%%%%%"
    echo -e "(((((//,,*(%%%%%%%%%%%%%%%%%##/*****************************************************,,*/(///(//////****//((##%%%%%%%%%%%"
    echo -e "(((((//***/#%%%%%%%%%%%%%%%%%%%#(/***************************************************,*//////////*//((#%%%%%%%%%%%%%%%%%"
    echo -e "////////***/##%%%%%%%%%%%%%%%%%%%##(*,***********************************************,,*////////(###%%%%%%%%%%%%%%%%%%%%"
    echo -e "****//////**/(#%%%%%%%%%%%%%%%%%%%%%#(/**********************************************,,,***/(##%%%%%%%%%%%%%%%%%%%%%%%%%"
    echo -e "********///***/(#%%%%%%%%%%%%%%%%%%%%%%#(/***********************************,****,****/((#%%%%%%%%%%%%%%%%%%%%%%%%%%%%#"
    echo -e "*********//****/(##%%%%%%%%%%%%%%%%%%%%%%##//**************//////////////////////((#####%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%#("
    echo -e "*****************/(#%%%%%%%%%%%%%%%%%%%%%%%##################%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%##(/"
    echo -e "****************,,*/##%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%###((//"
    echo -e "****************,,,,*(#%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%##(//**//"
    echo -e "*****************,,,,*/(#%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%#(//*******"
    echo -e ",***,,,,,,,,,,,,*,,,,,,*/(######%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%##(/**********"
    echo -e ",,,,,,,,,,,,,,,,,,,,*,,,,*///((#%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%###(/************"
    echo -e ",,*,,,,,,,,,,,,,,,,,****,,,*/(#%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%#######(//**************"
    echo -e ",,,,,,,,,,,,,,,,,,,,,,**,,,/(%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%#((//******************"
    echo -e ",,,,,,,,,,,,,,,,,..,,,,,,,*(#%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%#(/*******************"
    echo -e ",,,,,,,,,,,,,.......,,,,,,/#%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%#####%%%%%%%%%%%%%%%%#(/******************"
    echo -e ",,,,,,,,,,,,......,,,*,,,*(#%%%%%%%%##(((/(##%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%##(((/*/((#%%%%%%%%%%%%%%#(/*****************"
    echo -e ",,,,,,,,,,,,,.....,,**,,*/#%%%%%%%##((((*,**/#%%%%%%%%%%%%%%%%%%%%%%%%%%%%##((##/,,,*(#%%%%%%%%%%%%%%#(*****************"
    echo -e ",,,,,,,,,,,,,,,,*****,,,/(%%%%%%%%#(//(#/,..*/#%%%%%%%%%%%%%%%%%%%%%%%%%%%#(//(#/,..,/(#%%%%%%%%%%%%%%#/*****///////////"
    echo -e ",,,,,,,,,,,*,,*******,,,(#%%%%%%%%#(*,,,....,/#%%%%%%%%%%%%%%%%%%%%%%%%%%%#(*,,,....,/(#%%%%%%%%%%%%%%#(*,**////////////"
    echo -e ".....,,,,,,*,********,,*(#%%%%%%%%%#(/*,,...,/#%%%%%%%%%%%%%%%%%%%%%%%%%%%%#(/*,,..,*/##%%%%%%%%%%%%%%%#(***////////////"
    echo -e ".......,,*,**********,,/#%%%%%%%%%%%%#((////((#%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%##((///(#%%%%%%%%%%%%%%%%%%(/**////////////"
    echo -e ".......,,,**********,,*(#%%%%%%%%%%%%%%%%%%#%%%%%%%%#((///((#%%%%%%%%%%%%%%%%%%%%%#%%%%%%%%%%%%%%%%%%%%%#/**////////////"
    echo -e ".......,,***********,,/(####%%%%%%%%%%%%%%%%%%%%%%%%#(/*,,,*(#%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%#(/*////////////"
    echo -e "......,,,**********,..,***//((##%%%%%%%%%%%%%%%%%%%%%%%##((##%%%%%%%%%%%%%%%%%%%%%%%%%##(((((((((###%%%%%#/**///////////"
    echo -e ",,,,,,*************,..,*******/(#%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%##///*//////((#%%%%%#(**///////////"
    echo -e "*****/***////*****,.,*///////**/#%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%#(////////////(#%%%%%#/**//////////"
    echo -e "*****/////*******,..,*//////////(#%%%%%%%%%%%%%%%%%%%%##########%%%%%%%%%%%%%%%%%%%%#(///////////*/(#%%%%%#(***/////////"
    echo -e "******///********,..,*//////////#%%%%%%%%%%%%%%%%%%#(//*****///(((##%%%%%%%%%%%%%%%%#(///////////**/##%%%%##/***////////"
    echo -e "*****************,.,,***///////(#%%%%%%%%%%%%%%%%#(/*,,,*//((((////(#%%%%%%%%%%%%%%%#((////////////(#%%%%%%#(*********//"
    echo -e ",,**************,,,*//******//(#%%%%%%%%%%%%%%%%%#(*,,*/(((#####(((((#%%%%%%%%%%%%%%%##///////////(#%%%%%%%%#(***///////"
    echo -e ",,************,,,,,/(##((((####%%%%%%%%%%%%%%%%%%%(/**/(((#((((#((//(#%%%%%%%%%%%%%%%%%#(((((((((##%%%%%%%%%%#/**///////"
    echo -e "************,,,,,,,*(#%#%%%%%%%%%%%%%%%%%%%%%%%%%%#(**/((#(#(((#((//(#%%%%%%%%%%%%%%%%%%%%%%%#%#%%%%%%%%%%%%%#(**///////"
    echo -e "**********,****,,,,,/(#%%%%%%%%%%%%%%%%%%%%%%%%%%%%#(/*/((((#((((///(#%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%(/*///////"
    echo -e "*******************,*/#%%%%%%%%%%%%%%%%%%%%%%%%%%%%%##(////////////(#%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%#/**/////*"
    echo -e "///////////////////***/#%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%####(((((((###%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%#(********"
    echo -e "////////////////////***/#%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%#(/*******"
    echo -e "/////////////////*******(#%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%##(*******"
    echo -e "////////////////********/(#%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%(*******"
    echo -e "\033[1;92m"
    echo "It all looks fine to me you fucking champion!"
else
    echo -e "\033[1;91mOh you screwed up somewhere, go fix your errors"
fi

printf "\033[m\n"

# If there was an error exit with error code
exit ${exitcode}
