<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class InterviewStatusChangedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly string $jobTitle,
        public readonly string $participantName,
        public readonly string $status,
    ) {}

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        $role = $notifiable->role ?? null;
        $url = $role === 'employer' ? '/employer/interviews' : '/jobseeker/interviews';

        return [
            'title' => "Interview {$this->status}",
            'message' => "The interview with {$this->participantName} for {$this->jobTitle} is now {$this->status}.",
            'type' => 'interview_status_changed',
            'url' => $url,
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Interview {$this->status} for {$this->jobTitle}")
            ->greeting('Interview update')
            ->line("The interview for {$this->jobTitle} is now {$this->status}.")
            ->line("Participant: {$this->participantName}")
            ->line('Sign in to the dashboard to review the current interview details.');
    }
}
