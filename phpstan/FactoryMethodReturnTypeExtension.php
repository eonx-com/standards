<?php
declare(strict_types=1);

namespace EoneoPay\Standards\Phpstan;

use PhpParser\Node\Expr\MethodCall;
use PHPStan\Analyser\Scope;
use PHPStan\Reflection\MethodReflection;
use PHPStan\Type\Constant\ConstantStringType;
use PHPStan\Type\DynamicMethodReturnTypeExtension;
use PHPStan\Type\MixedType;
use PHPStan\Type\ObjectType;
use PHPStan\Type\Type;

/**
 * This is a generic extension for PHPStan that will define a dynamic return type
 * based on a function argument, allowing factory methods to exist and be correctly
 * validated by PHPStan instead of being ignored or requiring instanceof checks.
 *
 * This can be coupled with .phpstorm.meta.php which can also provide dynamic return
 * types based on arguments to avoid PHPStorm errors of the same type.
 *
 * A new extension must be created and used for each different class (or different
 * methods that use different argument positions for working out what the return type
 * is).
 *
 * To use this extension, it must be added to the services key of phpstan.neon:
 *
 * services:
 *   -
 *     class: EoneoPay\Standards\Phpstan\FactoryMethodReturnTypeExtension
 *     arguments:
 *       - LoyaltyCorp\RequestHandlers\Builder\Interfaces\ObjectBuilderInterface
 *       - ['build', 'buildWithContext']
 *     tags:
 *       - phpstan.broker.dynamicMethodReturnTypeExtension
 */
final class FactoryMethodReturnTypeExtension implements DynamicMethodReturnTypeExtension
{
    /**
     * The supported class for the dynamic return type.
     *
     * @var string
     */
    private $class;

    /**
     * The methods that are supported for determining the return type.
     *
     * @var string[]
     */
    private $methods;

    /**
     * The method arg that contains the return type class.
     *
     * @var int
     */
    private $dynamicArg;

    /**
     * Constructor
     *
     * @param string $class
     * @param string[] $methods
     * @param int|null $dynamicArg
     */
    public function __construct(string $class, array $methods, ?int $dynamicArg = null)
    {
        $this->class = $class;
        $this->dynamicArg = $dynamicArg ?? 0;
        $this->methods = $methods;
    }

    /**
     * {@inheritdoc}
     */
    public function getClass(): string
    {
        return $this->class;
    }

    /**
     * {@inheritdoc}
     */
    public function isMethodSupported(MethodReflection $methodReflection): bool
    {
        return \in_array($methodReflection->getName(), $this->methods, true);
    }

    /**
     * {@inheritdoc}
     */
    public function getTypeFromMethodCall(
        MethodReflection $methodReflection,
        MethodCall $methodCall,
        Scope $scope
    ): Type {
        $argType = $scope->getType($methodCall->args[$this->dynamicArg]->value);
        if ($argType instanceof ConstantStringType === false) {
            return new MixedType();
        }

        /**
         * @var \PHPStan\Type\Constant\ConstantStringType $argType
         *
         * @see https://youtrack.jetbrains.com/issue/WI-37859 - typehint required until PhpStorm recognises === chec
         */

        return new ObjectType($argType->getValue());
    }
}
