<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class JobApplicationWithdrawnNotification extends Notification implements ShouldQueue
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
            'title' => 'Application withdrawn',
            'message' => "{$this->applicantName} withdrew their application for {$this->jobTitle}.",
            'type' => 'application_withdrawn',
            'url' => '/employer/jobs',
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Application withdrawn for {$this->jobTitle}")
            ->greeting('Candidate update')
            ->line("{$this->applicantName} withdrew their application for {$this->jobTitle}.")
            ->line('The applicant pipeline has been updated automatically.');
    }
}
