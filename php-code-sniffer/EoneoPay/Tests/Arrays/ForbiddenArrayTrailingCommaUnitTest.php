<?php
declare(strict_types=1);

namespace Tests\EoneoPay\Standards\CodeSniffer\Arrays;

use PHP_CodeSniffer\Tests\Standards\AbstractSniffUnitTest;

class ForbiddenArrayTrailingCommaUnitTest extends AbstractSniffUnitTest
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
            5 => 1
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
