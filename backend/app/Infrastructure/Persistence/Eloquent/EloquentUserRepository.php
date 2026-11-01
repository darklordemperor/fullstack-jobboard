<?php

namespace App\Infrastructure\Persistence\Eloquent;

use App\Domain\Auth\Entities\User as UserEntity;
use App\Domain\Auth\Enums\UserRole;
use App\Domain\Auth\Repositories\UserRepository;
use App\Domain\Auth\ValueObjects\Email;
use App\Domain\Auth\ValueObjects\PasswordHash;
use App\Domain\Auth\ValueObjects\UserName;
use App\Models\User as UserModel;
use DateTimeImmutable;

final class EloquentUserRepository implements UserRepository
{
    public function findById(int $id): ?UserEntity
    {
        $model = UserModel::query()->find($id);

        return $model === null ? null : $this->toEntity($model);
    }

    public function findByEmail(Email $email): ?UserEntity
    {
        $model = UserModel::query()->where('email', $email->value)->first();

        return $model === null ? null : $this->toEntity($model);
    }

    public function existsByEmail(Email $email): bool
    {
        return UserModel::query()->where('email', $email->value)->exists();
    }

    public function create(
        UserName $name,
        Email $email,
        PasswordHash $passwordHash,
        UserRole $role,
    ): UserEntity {
        $model = UserModel::query()->create([
            'name' => $name->value,
            'email' => $email->value,
            'password' => $passwordHash->value,
            'role' => $role->value,
        ]);

        return $this->toEntity($model);
    }

    public function save(UserEntity $user): UserEntity
    {
        /** @var UserModel $model */
        $model = UserModel::query()->findOrFail($user->id);
        $model->name = $user->name->value;
        $model->email = $user->email->value;
        $model->password = $user->passwordHash->value;
        $model->save();

        return $this->toEntity($model->refresh());
    }

    private function toEntity(UserModel $model): UserEntity
    {
        return new UserEntity(
            id: (int) $model->getKey(),
            name: new UserName($model->name),
            email: new Email($model->email),
            passwordHash: new PasswordHash($model->getRawOriginal('password')),
            role: UserRole::from($model->role),
            createdAt: DateTimeImmutable::createFromInterface($model->created_at),
            suspendedAt: $model->suspended_at === null ? null : DateTimeImmutable::createFromInterface($model->suspended_at),
        );
    }
}
