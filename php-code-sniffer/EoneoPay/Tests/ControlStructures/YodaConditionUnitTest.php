<?php

namespace PHP_CodeSniffer\Standards\EoneoPay\Tests\ControlStructures;

use PHP_CodeSniffer\Tests\Standards\AbstractSniffUnitTest;

class YodaConditionUnitTest extends AbstractSniffUnitTest
{


    /**
     * Returns the lines where errors should occur.
     *
     * The key of the array should represent the line number and the value
     * should represent the number of errors that should occur on that line.
     *
     * @return array<int, int>
     */
    protected function getErrorList()
    {
        return [
            4 => 0,
            5 => 1,
            6 => 0,
            7 => 1,
            10 => 1,
            11 => 0,
            13 => 1,
            14 => 0,
            16 => 1,
            17 => 0,
            19 => 1,
            20 => 0,
            22 => 1,
            23 => 0,
            25 => 1,
            26 => 0,
            28 => 1,
            29 => 0
        ];

        return [
            4 => 1,
            5 => 0,
            6 => 1,
            7 => 0,
            10 => 0,
            11 => 1,
            13 => 0,
            14 => 1,
            16 => 0,
            17 => 1,
            19 => 0,
            20 => 1,
            22 => 0,
            23 => 1,
            25 => 0,
            26 => 1,
            28 => 0,
            29 => 1
        ];
    }


    /**
     * Returns the lines where warnings should occur.
     *
     * The key of the array should represent the line number and the value
     * should represent the number of warnings that should occur on that line.
     *
     * @return array<int, int>
     */
    protected function getWarningList()
    {
        return [];
    }
}
