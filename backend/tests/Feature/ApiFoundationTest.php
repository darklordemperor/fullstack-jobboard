<?php

test('protected api routes return the project json envelope when unauthenticated', function () {
    $this->getJson('/api/v1/auth/me')
        ->assertUnauthorized()
        ->assertJson([
            'success' => false,
            'data' => null,
            'message' => 'Unauthenticated.',
            'errors' => null,
        ]);
});

test('cors allows the next frontend origin with credentials', function () {
    $this->withHeaders([
        'Origin' => 'http://localhost:3000',
        'Access-Control-Request-Method' => 'GET',
        'Access-Control-Request-Headers' => 'Content-Type, X-CSRF-TOKEN, X-XSRF-TOKEN, Accept',
    ])->options('/api/v1/auth/me')
        ->assertNoContent()
        ->assertHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
        ->assertHeader('Access-Control-Allow-Credentials', 'true');
});
