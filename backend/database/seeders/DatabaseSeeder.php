<?php

namespace Database\Seeders;

use App\Models\JobListing;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::firstOrCreate([
            'email' => 'admin@jobboard.com',
        ], [
            'name' => 'Admin User',
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);

        $employer = User::firstOrCreate([
            'email' => 'employer@jobboard.com',
        ], [
            'name' => 'Employer User',
            'password' => bcrypt('password'),
            'role' => 'employer',
        ]);

        User::firstOrCreate([
            'email' => 'seeker@jobboard.com',
        ], [
            'name' => 'Seeker User',
            'password' => bcrypt('password'),
            'role' => 'jobseeker',
        ]);

        if ($employer->jobListings()->doesntExist()) {
            JobListing::factory()
                ->count(12)
                ->for($employer, 'employer')
                ->published()
                ->create();
        }
    }
}
