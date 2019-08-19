<?php
declare(strict_types=1);

namespace Tests\EoneoPay\Standards\Stubs\Phpstan;

use PhpParser\Node\Expr;
use PHPStan\Analyser\Scope;
use PHPStan\Type\Type;

class ScopeStub extends Scope
{
    /**
     * @var \PHPStan\Type\Type
     */
    private $returnType;

    /**
     * Intentionally overridden.
     *
     * @noinspection PhpMissingParentConstructorInspection
     *
     * @param \PHPStan\Type\Type $returnType
     */
    public function __construct(Type $returnType)
    {
        $this->returnType = $returnType;
    }

    /**
     * @noinspection PhpMissingParentCallCommonInspection
     *
     * {@inheritdoc}
     */
    public function getType(Expr $node): Type
    {
        return $this->returnType;
    }
}
