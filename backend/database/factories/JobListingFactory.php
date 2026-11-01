<?php

namespace Database\Factories;

use App\Domain\JobListings\Enums\EmploymentType;
use App\Domain\JobListings\Enums\JobListingStatus;
use App\Models\JobListing;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<JobListing>
 */
class JobListingFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'employer_id' => User::factory()->state(['role' => 'employer']),
            'title' => fake()->jobTitle(),
            'description' => fake()->paragraphs(3, true),
            'location' => fake()->randomElement(['Bangkok', 'Chiang Mai', 'Nonthaburi', 'Pathum Thani', 'Remote']),
            'employment_type' => fake()->randomElement(EmploymentType::cases()),
            'category' => fake()->randomElement(['IT', 'Marketing', 'Finance', 'Design', 'Operations']),
            'salary_minimum' => $minimum = fake()->numberBetween(25000, 120000),
            'salary_maximum' => $minimum + fake()->numberBetween(10000, 80000),
            'currency' => 'THB',
            'status' => JobListingStatus::Draft,
            'published_at' => null,
        ];
    }

    public function published(): static
    {
        return $this->state(fn (): array => [
            'status' => JobListingStatus::Published,
            'published_at' => fake()->dateTimeBetween('-30 days'),
        ]);
    }

    public function closed(): static
    {
        return $this->state(fn (): array => [
            'status' => JobListingStatus::Closed,
            'published_at' => fake()->dateTimeBetween('-60 days', '-31 days'),
        ]);
    }
}
