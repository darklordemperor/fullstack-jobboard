<?php

namespace Database\Seeders;

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
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@jobboard.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);

        User::create([
            'name' => 'Employer User',
            'email' => 'employer@jobboard.com',
            'password' => bcrypt('password'),
            'role' => 'employer',
        ]);

        User::create([
            'name' => 'Seeker User',
            'email' => 'seeker@jobboard.com',
            'password' => bcrypt('password'),
            'role' => 'jobseeker',
        ]);
    }
}
