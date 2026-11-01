<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewJobApplicationNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly string $applicantName,
        public readonly string $jobTitle,
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
            'title' => 'New candidate application',
            'message' => "{$this->applicantName} submitted an application for {$this->jobTitle}.",
            'type' => 'new_application',
            'url' => '/employer/jobs',
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("New application for {$this->jobTitle}")
            ->greeting('A new candidate applied')
            ->line("{$this->applicantName} submitted an application for {$this->jobTitle}.")
            ->line('Open the employer portal to review the cover letter and resume.');
    }
}
