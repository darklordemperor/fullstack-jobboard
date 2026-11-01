<?php

use App\Application\Auth\Contracts\AuthSession;
use App\Application\Auth\Contracts\PasswordHasher;
use App\Application\Auth\DTOs\LoginData;
use App\Application\Auth\DTOs\RegisterUserData;
use App\Application\Auth\DTOs\UpdateAccountProfileData;
use App\Application\Auth\Exceptions\EmailAlreadyRegistered;
use App\Application\Auth\Exceptions\InvalidCredentials;
use App\Application\Auth\UseCases\LoginUser;
use App\Application\Auth\UseCases\RegisterUser;
use App\Application\Auth\UseCases\UpdateAccountProfile;
use App\Domain\Auth\Entities\User;
use App\Domain\Auth\Enums\UserRole;
use App\Domain\Auth\Repositories\UserRepository;
use App\Domain\Auth\ValueObjects\Email;
use App\Domain\Auth\ValueObjects\PasswordHash;
use App\Domain\Auth\ValueObjects\UserName;

function authUserRepository(?User $storedUser = null, ?User $otherUser = null): UserRepository
{
    return new class($storedUser, $otherUser) implements UserRepository
    {
        public function __construct(public ?User $storedUser, public ?User $otherUser = null) {}

        public function findById(int $id): ?User
        {
            if ($this->storedUser?->id === $id) {
                return $this->storedUser;
            }

            return $this->otherUser?->id === $id ? $this->otherUser : null;
        }

        public function findByEmail(Email $email): ?User
        {
            if ($this->storedUser?->email->value === $email->value) {
                return $this->storedUser;
            }

            return $this->otherUser?->email->value === $email->value ? $this->otherUser : null;
        }

        public function existsByEmail(Email $email): bool
        {
            return $this->findByEmail($email) !== null;
        }

        public function create(
            UserName $name,
            Email $email,
            PasswordHash $passwordHash,
            UserRole $role,
        ): User {
            return $this->storedUser = new User(
                id: 42,
                name: $name,
                email: $email,
                passwordHash: $passwordHash,
                role: $role,
                createdAt: new DateTimeImmutable('2026-10-29T00:00:00+00:00'),
            );
        }

        public function save(User $user): User
        {
            return $this->storedUser = $user;
        }
    };
}

function authPasswordHasher(): PasswordHasher
{
    return new class implements PasswordHasher
    {
        public function hash(string $plainTextPassword): PasswordHash
        {
            return new PasswordHash('hashed:'.$plainTextPassword);
        }

        public function verify(string $plainTextPassword, PasswordHash $passwordHash): bool
        {
            return $passwordHash->value === 'hashed:'.$plainTextPassword;
        }
    };
}

function authSession(): AuthSession
{
    return new class implements AuthSession
    {
        public ?int $userId = null;

        public function login(int $userId): void
        {
            $this->userId = $userId;
        }

        public function currentUserId(): ?int
        {
            return $this->userId;
        }

        public function logout(): void
        {
            $this->userId = null;
        }
    };
}

test('register user applies domain values, hashes the password, and starts a session', function () {
    $users = authUserRepository();
    $session = authSession();
    $useCase = new RegisterUser($users, authPasswordHasher(), $session);

    $user = $useCase->execute(new RegisterUserData(
        name: ' Jane Candidate ',
        email: 'JANE@EXAMPLE.COM',
        password: 'password',
        role: UserRole::Jobseeker,
    ));

    expect($user->id)->toBe(42)
        ->and($user->name->value)->toBe('Jane Candidate')
        ->and($user->email->value)->toBe('jane@example.com')
        ->and($user->passwordHash->value)->toBe('hashed:password')
        ->and($session->currentUserId())->toBe(42);
});

test('register user rejects an existing email before persistence', function () {
    $existingUser = new User(
        id: 1,
        name: new UserName('Existing User'),
        email: new Email('existing@example.com'),
        passwordHash: new PasswordHash('hashed:password'),
        role: UserRole::Employer,
        createdAt: new DateTimeImmutable,
    );

    $useCase = new RegisterUser(
        authUserRepository($existingUser),
        authPasswordHasher(),
        authSession(),
    );

    expect(fn () => $useCase->execute(new RegisterUserData(
        name: 'Duplicate User',
        email: 'existing@example.com',
        password: 'password',
    )))->toThrow(EmailAlreadyRegistered::class);
});

test('login verifies credentials and starts a session', function () {
    $user = new User(
        id: 7,
        name: new UserName('Employer User'),
        email: new Email('employer@example.com'),
        passwordHash: new PasswordHash('hashed:password'),
        role: UserRole::Employer,
        createdAt: new DateTimeImmutable,
    );
    $session = authSession();
    $useCase = new LoginUser(authUserRepository($user), authPasswordHasher(), $session);

    $authenticatedUser = $useCase->execute(new LoginData('employer@example.com', 'password'));

    expect($authenticatedUser->id)->toBe(7)
        ->and($session->currentUserId())->toBe(7);
});

test('login rejects an invalid password without starting a session', function () {
    $user = new User(
        id: 7,
        name: new UserName('Employer User'),
        email: new Email('employer@example.com'),
        passwordHash: new PasswordHash('hashed:password'),
        role: UserRole::Employer,
        createdAt: new DateTimeImmutable,
    );
    $session = authSession();
    $useCase = new LoginUser(authUserRepository($user), authPasswordHasher(), $session);

    expect(fn () => $useCase->execute(new LoginData('employer@example.com', 'wrong')))
        ->toThrow(InvalidCredentials::class)
        ->and($session->currentUserId())->toBeNull();
});

test('update account profile updates name, email, and optionally hashes new password', function () {
    $user = new User(
        id: 11,
        name: new UserName('Jane Candidate'),
        email: new Email('jane@example.com'),
        passwordHash: new PasswordHash('hashed:old-password'),
        role: UserRole::Jobseeker,
        createdAt: new DateTimeImmutable,
    );
    $useCase = new UpdateAccountProfile(authUserRepository($user), authPasswordHasher());

    $updated = $useCase->execute(new UpdateAccountProfileData(
        userId: 11,
        name: ' Jane Updated ',
        email: 'JANE.UPDATED@EXAMPLE.COM',
        currentPassword: 'old-password',
        newPassword: 'new-password',
    ));

    expect($updated->name->value)->toBe('Jane Updated')
        ->and($updated->email->value)->toBe('jane.updated@example.com')
        ->and($updated->passwordHash->value)->toBe('hashed:new-password');
});

test('update account profile rejects duplicate email or invalid current password', function () {
    $user = new User(
        id: 11,
        name: new UserName('Jane Candidate'),
        email: new Email('jane@example.com'),
        passwordHash: new PasswordHash('hashed:old-password'),
        role: UserRole::Jobseeker,
        createdAt: new DateTimeImmutable,
    );
    $otherUser = new User(
        id: 12,
        name: new UserName('Other User'),
        email: new Email('taken@example.com'),
        passwordHash: new PasswordHash('hashed:password'),
        role: UserRole::Employer,
        createdAt: new DateTimeImmutable,
    );
    $useCase = new UpdateAccountProfile(
        authUserRepository($user, $otherUser),
        authPasswordHasher(),
    );

    expect(fn () => $useCase->execute(new UpdateAccountProfileData(
        userId: 11,
        name: 'Jane Candidate',
        email: 'taken@example.com',
    )))->toThrow(EmailAlreadyRegistered::class);

    expect(fn () => $useCase->execute(new UpdateAccountProfileData(
        userId: 11,
        name: 'Jane Candidate',
        email: 'jane@example.com',
        currentPassword: 'wrong-password',
        newPassword: 'new-password',
    )))->toThrow(InvalidCredentials::class);
});
