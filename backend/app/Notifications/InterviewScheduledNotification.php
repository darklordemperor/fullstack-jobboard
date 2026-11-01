<?php

namespace App\Notifications;

use DateTimeImmutable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class InterviewScheduledNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly string $jobTitle,
        public readonly DateTimeImmutable $scheduledAt,
        public readonly string $timezone,
        public readonly string $location,
        public readonly bool $rescheduled = false,
    ) {}

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => $this->rescheduled ? 'Interview rescheduled' : 'Interview invitation',
            'message' => "An interview for {$this->jobTitle} was scheduled for {$this->scheduledAt->format('M j, Y g:i A')}.",
            'type' => 'interview_scheduled',
            'url' => '/jobseeker/interviews',
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $localTime = $this->scheduledAt
            ->setTimezone(new \DateTimeZone($this->timezone))
            ->format('M j, Y g:i A T');

        return (new MailMessage)
            ->subject(($this->rescheduled ? 'Interview rescheduled' : 'Interview invitation')." for {$this->jobTitle}")
            ->greeting($this->rescheduled ? 'Your interview was rescheduled' : 'You have an interview invitation')
            ->line("Role: {$this->jobTitle}")
            ->line("Time: {$localTime}")
            ->line("Location: {$this->location}")
            ->line('Sign in to the jobseeker portal to review and confirm the interview.');
    }
}
