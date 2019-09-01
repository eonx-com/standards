<?php
declare(strict_types=1);

namespace Tests\EoneoPay\Standards\Phpstan;

use DateTime;
use EoneoPay\Standards\Phpstan\FactoryMethodReturnTypeExtension;
use PhpParser\Node\Arg;
use PhpParser\Node\Expr\ClassConstFetch;
use PhpParser\Node\Expr\MethodCall;
use PhpParser\Node\Expr\Variable;
use PhpParser\Node\Name\FullyQualified;
use PhpParser\Node\Scalar\String_;
use PHPStan\Reflection\Dummy\DummyMethodReflection;
use PHPStan\Testing\TestCase;
use PHPStan\Type\Constant\ConstantStringType;
use PHPStan\Type\ObjectType;
use stdClass;
use Tests\EoneoPay\Standards\Stubs\Phpstan\ScopeStub;

/**
 * @covers \EoneoPay\Standards\Phpstan\FactoryMethodReturnTypeExtension
 */
class FactoryMethodReturnTypeExtensionTest extends TestCase
{
    /**
     * Tests the extension supports the class supplied in the constructor.
     *
     * @return void
     */
    public function testSupportedClass(): void
    {
        $extension = new FactoryMethodReturnTypeExtension(stdClass::class, ['build']);

        static::assertSame(stdClass::class, $extension->getClass());
    }

    /**
     * Tests the extension doesnt support a class not supplied in the constructor.
     *
     * @return void
     */
    public function testUnsupportedClass(): void
    {
        $extension = new FactoryMethodReturnTypeExtension(stdClass::class, ['build']);

        static::assertNotSame(DateTime::class, $extension->getClass());
    }

    /**
     * Tests extension supports the method in the constructor method
     *
     * @return void
     */
    public function testSupportedMethod(): void
    {
        $extension = new FactoryMethodReturnTypeExtension(stdClass::class, ['build']);

        $method = new DummyMethodReflection('build');

        static::assertTrue($extension->isMethodSupported($method));
    }

    /**
     * Tests extension does not support a method not supplied in the constructor
     *
     * @return void
     */
    public function testUnsupportedMethod(): void
    {
        $extension = new FactoryMethodReturnTypeExtension(stdClass::class, ['build']);

        $method = new DummyMethodReflection('destroy');

        static::assertFalse($extension->isMethodSupported($method));
    }

    /**
     * Tests that when not provided, the extension will use the first
     * argument for the return type.
     *
     * @return void
     */
    public function testGetTypeFromMethodCallUsesDefaultArgumentZero(): void
    {
        $extension = new FactoryMethodReturnTypeExtension(stdClass::class, ['build']);

        $method = new DummyMethodReflection('build');
        $call = new MethodCall(
            new MethodCall(
                new Variable('this'),
                'getObjectBuilder'
            ),
            'buildWithContext',
            [
                new Arg(
                    new ClassConstFetch(
                        new FullyQualified('stdClass'),
                        'name'
                    )
                )
            ]
        );
        $type = new ConstantStringType('stdClass');
        $scope = new ScopeStub($type);

        $expected = new ObjectType('stdClass');

        $result = $extension->getTypeFromMethodCall(
            $method,
            $call,
            $scope
        );

        static::assertEquals($expected, $result);
    }

    /**
     * Tests that when not provided, the extension will use the first
     * argument for the return type.
     *
     * @return void
     */
    public function testGetTypeFromMethodCallUsesSpecifiedArg(): void
    {
        $extension = new FactoryMethodReturnTypeExtension(stdClass::class, ['build'], 1);

        $method = new DummyMethodReflection('build');
        $call = new MethodCall(
            new MethodCall(
                new Variable('this'),
                'getObjectBuilder'
            ),
            'buildWithContext',
            [
                new Arg(new String_('value')),
                new Arg(
                    new ClassConstFetch(
                        new FullyQualified('stdClass'),
                        'name'
                    )
                )
            ]
        );
        $type = new ConstantStringType('stdClass');
        $scope = new ScopeStub($type);

        $expected = new ObjectType('stdClass');

        $result = $extension->getTypeFromMethodCall(
            $method,
            $call,
            $scope
        );

        static::assertEquals($expected, $result);
    }
}
