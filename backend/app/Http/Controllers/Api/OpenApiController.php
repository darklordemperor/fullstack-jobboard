<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Response;
use RuntimeException;

final class OpenApiController extends Controller
{
    public function __invoke(): Response
    {
        $document = file_get_contents(resource_path('openapi.json'));

        if ($document === false) {
            throw new RuntimeException('The OpenAPI document could not be read.');
        }

        return response($document, 200, [
            'Content-Type' => 'application/vnd.oai.openapi+json',
            'Cache-Control' => 'public, max-age=300',
        ]);
    }
}
