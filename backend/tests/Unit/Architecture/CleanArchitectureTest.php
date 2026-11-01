<?php

function phpFilesIn(string $directory): array
{
    $files = [];
    $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($directory));

    foreach ($iterator as $file) {
        if ($file->isFile() && $file->getExtension() === 'php') {
            $files[] = $file->getPathname();
        }
    }

    return $files;
}

test('domain layer has no outward dependencies', function () {
    $forbiddenNamespaces = [
        'App\\Application\\',
        'App\\Http\\',
        'App\\Infrastructure\\',
        'App\\Models\\',
        'Illuminate\\',
        'Laravel\\',
    ];

    foreach (phpFilesIn(dirname(__DIR__, 3).'/app/Domain') as $file) {
        $contents = file_get_contents($file);

        foreach ($forbiddenNamespaces as $namespace) {
            expect($contents)->not->toContain($namespace);
        }
    }
});

test('application layer depends only on application and domain code', function () {
    $forbiddenNamespaces = [
        'App\\Http\\',
        'App\\Infrastructure\\',
        'App\\Models\\',
        'Illuminate\\',
        'Laravel\\',
    ];

    foreach (phpFilesIn(dirname(__DIR__, 3).'/app/Application') as $file) {
        $contents = file_get_contents($file);

        foreach ($forbiddenNamespaces as $namespace) {
            expect($contents)->not->toContain($namespace);
        }
    }
});
