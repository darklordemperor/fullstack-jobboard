<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $perPage = min(50, max(1, $request->integer('perPage', 15)));

        $paginator = $user->notifications()
            ->latest()
            ->paginate($perPage);

        return ApiResponse::success([
            'items' => NotificationResource::collection($paginator->items())->resolve($request),
            'unreadCount' => $user->unreadNotifications()->count(),
            'pagination' => [
                'currentPage' => $paginator->currentPage(),
                'perPage' => $paginator->perPage(),
                'lastPage' => $paginator->lastPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function markAsRead(Request $request, string $notification): JsonResponse
    {
        $user = $request->user();
        $item = $user->notifications()->where('id', $notification)->first();

        if ($item === null) {
            throw new NotFoundHttpException('Notification not found.');
        }

        $item->markAsRead();

        return ApiResponse::success(
            NotificationResource::make($item)->resolve($request),
            'Notification marked as read.'
        );
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications()->update(['read_at' => now()]);

        return ApiResponse::success(null, 'All notifications marked as read.');
    }
}
