<?php

/**
 * Checks the class has a strict declaration type immediately preceding the opening tag and there
 * are no spaces within the declaration
 *
 * @author Scott Dawson <scott@loyaltycorp.com.au>
 * @copyright 2018 Loyalty Corp Pty Ltd (ABN 39 615 958 873)
 * @license https://github.com/loyaltycorp/standards/blob/master/licence BSD Licence
 */

namespace PHP_CodeSniffer\Standards\EoneoPay\Sniffs\Classes;

use PHP_CodeSniffer\Files\File;
use PHP_CodeSniffer\Sniffs\Sniff;

class StrictDeclarationSniff implements Sniff
{
    /**
     * The phpcs file instance
     *
     * @var \PHP_CodeSniffer\Files\File
     */
    private $phpcsFile;

    /**
     * The tokens from the file
     *
     * @var array
     */
    private $tokens;

    /**
     * Processes this test, when one of its tokens is encountered
     *
     * @param \PHP_CodeSniffer\Files\File $phpcsFile The file being scanned
     * @param int $stackPtr The position of the current token in the stack passed in $tokens
     *
     * @return void
     */
    public function process(File $phpcsFile, $stackPtr)
    {
        // Capture the file
        $this->phpcsFile = $phpcsFile;

        // Get tokens
        $this->tokens = $phpcsFile->getTokens();

        // From opening tag, find declaration
        $declarationPtr = $phpcsFile->findNext(T_DECLARE, $stackPtr);
        if (!\is_int($declarationPtr)) {
            $this->throwError('Strict type declaration not found in file', $stackPtr, 'MissingDeclaration');

            return;
        }

        /** @var int $declarationPtr */
        $openingTag = $this->tokens[$stackPtr];
        $declaration = $this->tokens[$declarationPtr];

        // Check that the declaration immediately follows the opening tag
        if ($declaration['line'] !== $openingTag['line'] + 1) {
            $this->throwError(
                'Strict type declaration must be on the line immediately following the opening tag',
                $stackPtr
            );

            return;
        }

        // Ensure there are no leading spaces
        if ($declaration['column'] !== 1) {
            $this->throwError('Strict type declaration must be on it\'s own line with no leading spaces', $stackPtr);

            return;
        }

        // Get pointers
        $openParenthesisPtr = $phpcsFile->findNext(T_OPEN_PARENTHESIS, $declarationPtr);
        $stringPtr = $phpcsFile->findNext(T_STRING, (int)$openParenthesisPtr);
        $equalsPtr = $phpcsFile->findNext(T_EQUAL, (int)$stringPtr);
        $valuePtr = $phpcsFile->findNext(T_LNUMBER, (int)$equalsPtr);
        $closeParenthesisPtr = $phpcsFile->findNext(T_CLOSE_PARENTHESIS, (int)$valuePtr);
        $semicolonPtr = $phpcsFile->findNext(T_SEMICOLON, (int)$closeParenthesisPtr);

        // Get data
        $openParenthesis = $this->tokens[(int)$openParenthesisPtr];
        $string = $this->tokens[(int)$stringPtr];
        $equals = $this->tokens[(int)$equalsPtr];
        $value = $this->tokens[(int)$valuePtr];
        $closeParenthesis = $this->tokens[(int)$closeParenthesisPtr];
        $semicolon = $this->tokens[(int)$semicolonPtr];

        // Ensure declaration is exactly as expected
        if (!\is_int($openParenthesisPtr) ||
            !\is_int($stringPtr) ||
            !\is_int($equalsPtr) ||
            !\is_int($valuePtr) ||
            !\is_int($closeParenthesisPtr) ||
            !\is_int($semicolonPtr) ||
            $string['content'] !== 'strict_types' ||
            $value['content'] !== '1' ||
            $openParenthesis['line'] !== $declaration['line'] ||
            $string['line'] !== $declaration['line'] ||
            $equals['line'] !== $declaration['line'] ||
            $value['line'] !== $declaration['line'] ||
            $closeParenthesis['line'] !== $declaration['line'] ||
            $semicolon['line'] !== $declaration['line'] ||
            $openParenthesis['column'] !== $declaration['column'] + $declaration['length'] ||
            $string['column'] !== $openParenthesis['column'] + $openParenthesis['length'] ||
            $equals['column'] !== $string['column'] + $string['length'] ||
            $value['column'] !== $equals['column'] + $equals['length'] ||
            $closeParenthesis['column'] !== $value['column'] + $value['length'] ||
            $semicolon['column'] !== $closeParenthesis['column'] + $closeParenthesis['length']
        ) {
            $this->throwError('Strict type declaration invalid, must be `declare(strict_types=1);`', $stackPtr);

            return;
        }
    }

    /**
     * Returns the token types that this sniff is interested in
     *
     * @return array
     */
    public function register()
    {
        return [T_OPEN_TAG];
    }

    /**
     * Throw an error
     *
     * @param string $message The message to send
     * @param int $pointer The pointer position
     * @param string $type The message type
     *
     * @return void
     */
    private function throwError($message, $pointer, $type = null)
    {
        $this->phpcsFile->addError(
            $message,
            $pointer,
            (string)$type ?: 'InvalidDeclaration'
        );
    }
}
