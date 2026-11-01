<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class JobApplicationStatusChangedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly string $jobTitle,
        public readonly string $status,
    ) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => "Application status updated: {$this->status}",
            'message' => "Your application for {$this->jobTitle} is now {$this->status}.",
            'type' => 'application_status_changed',
            'url' => '/jobseeker/applications',
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Application update for {$this->jobTitle}")
            ->greeting('Your application was updated')
            ->line("Your application for {$this->jobTitle} is now {$this->status}.")
            ->line('Sign in to the jobseeker portal to review your application history.');
    }
}
