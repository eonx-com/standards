<?php
declare(strict_types=1);

/**
 * Checks function comment blocks follow our standards.
 *
 * @author Nathan Page <nathan.page@loyaltycorp.com.au>
 * @copyright 2018 Loyalty Corp Pty Ltd (ABN 39 615 958 873)
 * @license https://github.com/loyaltycorp/standards/blob/master/licence BSD Licence
 */

namespace PHP_CodeSniffer\Standards\EoneoPay\Sniffs\Commenting;

use PHP_CodeSniffer\Files\File;
use PHP_CodeSniffer\Standards\Squiz\Sniffs\Commenting\FunctionCommentSniff as SquizFunctionCommentSniff;
use PHP_CodeSniffer\Util\Tokens;

class FunctionCommentSniff extends SquizFunctionCommentSniff
{
    /**
     * @var \PHP_CodeSniffer\Files\File
     */
    private $phpcsFile;

    /**
     * Cache for class parents and interfaces.
     *
     * @var mixed[]
     */
    protected $parentsAndInterfaces;

    /**
     * Cache for test classes indexed by stack pointer.
     *
     * @var mixed[]
     */
    protected $testClasses = [];

    /**
     * Cache for test class methods indexed by stack pointer.
     *
     * @var mixed[]
     */
    protected $testClassMethods = [];

    /**
     * PHPUnit test class prototypes
     *
     * @var mixed[]
     */
    protected static $testClassPrototypes = [
        'PHPUnit_Framework_TestCase',
        'PHPUnit\\Framework\\TestCase',
    ];

    /**
     * Get class parents and interfaces.
     * Returns array of class and interface names or false if the class cannot be loaded.
     *
     * @return mixed[]|bool
     *
     * @throws \PHP_CodeSniffer\Exceptions\RuntimeException
     */
    public function getClassParentsAndInterfaces()
    {
        $phpcsFile = $this->phpcsFile;
        $tokens    = $phpcsFile->getTokens();
        $nsStart   = $phpcsFile->findNext(array(T_NAMESPACE), 0);
        $class     = '';

        // Set the default return value.
        $this->parentsAndInterfaces = false;

        // Build the namespace.
        if (false !== $nsStart) {
            $nsEnd = $phpcsFile->findNext(array(T_SEMICOLON), $nsStart + 2);
            for ($i = $nsStart + 2; $i < $nsEnd; $i++) {
                $class .= $tokens[$i]['content'];
            }
            $class .= '\\';
        } else {
            $nsEnd = 0;
        }

        // Find the class/interface declaration.
        $classPtr = $phpcsFile->findNext(array(T_CLASS, T_INTERFACE), $nsEnd);

        if (false !== $classPtr) {
            $class .= $phpcsFile->getDeclarationName($classPtr);

            if (\class_exists($class) || \interface_exists($class)) {
                $this->parentsAndInterfaces = \array_merge(\class_parents($class), \class_implements($class));
            }
        }

        return $this->parentsAndInterfaces;
    }

    /**
     * Check if a class is a PHPUnit test class.
     *
     * @param  int $stackPtr
     *
     * @return bool
     *
     * @throws \PHP_CodeSniffer\Exceptions\RuntimeException
     */
    public function isTestClass($stackPtr)
    {
        if (!\array_key_exists($stackPtr, $this->testClasses)) {
            $this->testClasses[$stackPtr] = false;

            $classes = $this->getClassParentsAndInterfaces();

            if (false !== $classes) {
                foreach ($classes as $class) {
                    if (\in_array($class, self::$testClassPrototypes, true)) {
                        $this->testClasses[$stackPtr] = true;
                        break;
                    }
                }
            }
        }

        return $this->testClasses[$stackPtr];
    }

    /**
     * Check if a method is a PHPUnit test class method.
     *
     * @param  int $stackPtr
     *
     * @return bool
     *
     * @throws \PHP_CodeSniffer\Exceptions\RuntimeException
     * @throws \PHP_CodeSniffer\Exceptions\TokenizerException
     */
    public function isTestClassMethod($stackPtr)
    {
        if (!\array_key_exists($stackPtr, $this->testClassMethods)) {
            $this->testClassMethods[$stackPtr] = false;
            if ($this->isTestClass($stackPtr)) {
                $props = $this->phpcsFile->getMethodProperties($stackPtr);

                if ('public' === ($props['scope'] ?? null)
                    && ($props['is_abstract'] ?? false) === false
                    && ($props['is_closure'] ?? false) === false
                    && \stripos($this->phpcsFile->getDeclarationName($stackPtr), 'test') === 0
                ) {
                    $this->testClassMethods[$stackPtr] = true;
                }
            }
        }

        return $this->testClassMethods[$stackPtr];
    }

    /**
     * {@inheritdoc}
     *
     * @throws \PHP_CodeSniffer\Exceptions\RuntimeException
     * @throws \PHP_CodeSniffer\Exceptions\TokenizerException
     */
    public function process(File $phpcsFile, $stackPtr)
    {
        $this->phpcsFile = $phpcsFile;

        $tokens = $phpcsFile->getTokens();
        $find = Tokens::$methodPrefixes;
        $find[] = T_WHITESPACE;

        $commentEnd = $phpcsFile->findPrevious($find, $stackPtr - 1, null, true);
        if ($tokens[$commentEnd]['code'] === T_COMMENT) {
            // Inline comments might just be closing comments for
            // control structures or functions instead of function comments
            // using the wrong comment type. If there is other code on the line,
            // assume they relate to that code.
            $prev = $phpcsFile->findPrevious($find, $commentEnd - 1, null, true);
            if ($prev !== false && $tokens[$prev]['line'] === $tokens[$commentEnd]['line']) {
                $commentEnd = $prev;
            }
        }

        if ($tokens[$commentEnd]['code'] !== T_DOC_COMMENT_CLOSE_TAG
            && $tokens[$commentEnd]['code'] !== T_COMMENT
        ) {
            // [1] Added PHPUnit test class control for methods without doc comment.
            if (!$this->isTestClassMethod($stackPtr)) {
                $phpcsFile->addError('Missing function doc comment', $stackPtr, 'Missing');
                $phpcsFile->recordMetric($stackPtr, 'Function has doc comment', 'no');
            }
            return;
        } else {
            $phpcsFile->recordMetric($stackPtr, 'Function has doc comment', 'yes');
        }

        if ($tokens[$commentEnd]['code'] === T_COMMENT) {
            $phpcsFile->addError('You must use "/**" style comments for a function comment', $stackPtr, 'WrongStyle');
            return;
        }

        if ($tokens[$commentEnd]['line'] !== ($tokens[$stackPtr]['line'] - 1)) {
            $error = 'There must be no blank lines after the function comment';
            $phpcsFile->addError($error, $commentEnd, 'SpacingAfter');
        }

        $commentStart = $tokens[$commentEnd]['comment_opener'];
        foreach ($tokens[$commentStart]['comment_tags'] as $tag) {
            if ($tokens[$tag]['content'] === '@see') {
                // Make sure the tag isn't empty.
                $string = $phpcsFile->findNext(T_DOC_COMMENT_STRING, $tag, $commentEnd);
                if ($string === false || $tokens[$string]['line'] !== $tokens[$tag]['line']) {
                    $error = 'Content missing for @see tag in function comment';
                    $phpcsFile->addError($error, $tag, 'EmptySees');
                }
            }
        }

        // [2] Added {@inheritdoc} validation for override methods.
        if ($this->validateInheritdoc($phpcsFile, $stackPtr, $commentStart, $commentEnd)) {
            return;
        }

        parent::process($phpcsFile, $stackPtr);
    }

    /**
     * Avoid processing throws.
     *
     * @param \PHP_CodeSniffer\Files\File $phpcsFile
     * @param $stackPtr
     * @param $commentStart
     *
     * @return void
     */
    protected function processThrows(File $phpcsFile, $stackPtr, $commentStart)
    {
    }

    /**
     * Avoid processing params.
     *
     * @param \PHP_CodeSniffer\Files\File $phpcsFile
     * @param $stackPtr
     * @param $commentStart
     *
     * @return void
     */
    protected function processParams(File $phpcsFile, $stackPtr, $commentStart)
    {
    }

    /**
     * Process the return comment of this function comment.
     *
     * @param \PHP_CodeSniffer\Files\File $phpcsFile The file being scanned.
     * @param int $stackPtr The position of the current token
     *                                                  in the stack passed in $tokens.
     * @param int $commentStart The position in the stack where the comment started.
     *
     * @return void
     *
     * @throws \PHP_CodeSniffer\Exceptions\RuntimeException
     */
    protected function processReturn(File $phpcsFile, $stackPtr, $commentStart)
    {
        $tokens = $phpcsFile->getTokens();

        // Skip constructor and destructor.
        $methodName = $phpcsFile->getDeclarationName($stackPtr);
        $isSpecialMethod = ($methodName === '__construct' || $methodName === '__destruct');

        $return = null;
        foreach ($tokens[$commentStart]['comment_tags'] as $tag) {
            if ($tokens[$tag]['content'] === '@return') {
                if ($return !== null) {
                    $error = 'Only 1 @return tag is allowed in a function comment';
                    $phpcsFile->addError($error, $tag, 'DuplicateReturn');
                    return;
                }

                $return = $tag;
            }
        }

        if ($isSpecialMethod === true) {
            return;
        }

        if ($return !== null) {
            $content = $tokens[$return + 2]['content'];
            if (empty($content) === true || $tokens[$return + 2]['code'] !== T_DOC_COMMENT_STRING) {
                $error = 'Return type missing for @return tag in function comment';
                $phpcsFile->addError($error, $return, 'MissingReturnType');
            } else {
                // Support both a return type and a description.
                \preg_match('`^((?:\|?(?:array\([^\)]*\)|[\\\\a-z0-9\[\]]+))*)( .*)?`i', $content, $returnParts);
                if (isset($returnParts[1]) === false) {
                    return;
                }

                $returnType = $returnParts[1];
                $typeNames = \explode('|', $returnType);

                // If the return type is void, make sure there is
                // no return statement in the function.
                if ($returnType === 'void') {
                    if (isset($tokens[$stackPtr]['scope_closer']) === true) {
                        $endToken = $tokens[$stackPtr]['scope_closer'];
                        for ($returnToken = $stackPtr; $returnToken < $endToken; $returnToken++) {
                            if ($tokens[$returnToken]['code'] === T_CLOSURE
                                || $tokens[$returnToken]['code'] === T_ANON_CLASS
                            ) {
                                $returnToken = $tokens[$returnToken]['scope_closer'];
                                continue;
                            }

                            if ($tokens[$returnToken]['code'] === T_RETURN
                                || $tokens[$returnToken]['code'] === T_YIELD
                                || $tokens[$returnToken]['code'] === T_YIELD_FROM
                            ) {
                                break;
                            }
                        }

                        if ($returnToken !== $endToken) {
                            // If the function is not returning anything, just
                            // exiting, then there is no problem.
                            $semicolon = $phpcsFile->findNext(T_WHITESPACE, $returnToken + 1, null, true);
                            if ($tokens[$semicolon]['code'] !== T_SEMICOLON) {
                                $error = 'Function return type is void, but function contains return statement';
                                $phpcsFile->addError($error, $return, 'InvalidReturnVoid');
                            }
                        }
                    }//end if
                } else if ($returnType !== 'mixed' && \in_array('void', $typeNames, true) === false) {
                    // If return type is not void, there needs to be a return statement
                    // somewhere in the function that returns something.
                    if (isset($tokens[$stackPtr]['scope_closer']) === true) {
                        $endToken = $tokens[$stackPtr]['scope_closer'];
                        for ($returnToken = $stackPtr; $returnToken < $endToken; $returnToken++) {
                            if ($tokens[$returnToken]['code'] === T_CLOSURE
                                || $tokens[$returnToken]['code'] === T_ANON_CLASS
                            ) {
                                $returnToken = $tokens[$returnToken]['scope_closer'];
                                continue;
                            }

                            if ($tokens[$returnToken]['code'] === T_RETURN
                                || $tokens[$returnToken]['code'] === T_YIELD
                                || $tokens[$returnToken]['code'] === T_YIELD_FROM
                            ) {
                                break;
                            }
                        }

                        if ($returnToken === $endToken) {
                            $error = 'Function return type is not void, but function has no return statement';
                            $phpcsFile->addError($error, $return, 'InvalidNoReturn');
                        } else {
                            $semicolon = $phpcsFile->findNext(T_WHITESPACE, $returnToken + 1, null, true);

                            if ($tokens[$semicolon]['code'] === T_SEMICOLON) {
                                $error = 'Function return type is not void, but function is returning void here';
                                $phpcsFile->addError($error, $returnToken, 'InvalidReturnNotVoid');
                            }
                        }
                    }//end if
                }//end if
            }//end if
        } else {
            $error = 'Missing @return tag in function comment';
            $phpcsFile->addError($error, $tokens[$commentStart]['comment_closer'], 'MissingReturn');
        }//end if

    }//end processReturn()

    /**
     * Check if a comment has a valid 'inheritdoc' annotation.
     *
     * @param  File $phpcsFile
     * @param  int $stackPtr
     * @param  int $commentStart
     * @param  int $commentEnd
     *
     * @return bool
     *
     * @throws \PHP_CodeSniffer\Exceptions\RuntimeException
     */
    protected function validateInheritdoc(File $phpcsFile, $stackPtr, $commentStart, $commentEnd)
    {
        $commentString = $phpcsFile->getTokensAsString($commentStart, $commentEnd - $commentStart + 1);

        if (\preg_match('/\@inheritdoc/', $commentString)) {
            $classes = $this->getClassParentsAndInterfaces();

            if (false !== $classes) {
                $method = $phpcsFile->getDeclarationName($stackPtr);
                foreach ($classes as $class) {
                    if (\method_exists($class, $method)) {
                        return true;
                    }
                }
                $error = 'No override method found for {@inheritdoc} annotation';
                $phpcsFile->addError($error, $commentStart, 'InvalidInheritdoc');
            } else {
                return true;
            }
        }

        return false;
    }
}
