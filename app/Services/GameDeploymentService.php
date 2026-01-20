<?php

namespace App\Services;

use App\Models\Game;
use App\Models\GameVersion;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use ZipArchive;
use Exception;

class GameDeploymentService
{
    /**
     * @throws Exception
     */
    public function deploy(Game $game, UploadedFile $zipFile, string $versionTag): GameVersion
    {
        $zip = new ZipArchive();
        $res = $zip->open($zipFile->getRealPath());

        if ($res !== TRUE) {
            throw new Exception("Unable to open ZIP file.");
        }

        // 1. ZIP Validation: Check for index.html at root + Path traversal check
        $hasIndex = false;
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $stat = $zip->statIndex($i);
            $fileName = $stat['name'];

            // Security: Prevent Directory Traversal
            if (str_contains($fileName, '..') || str_starts_with($fileName, '/') || str_starts_with($fileName, '\\')) {
                $zip->close();
                throw new Exception("Security Error: Malicious path detected in ZIP: {$fileName}");
            }

            if (basename($fileName) === 'index.html') {
                $hasIndex = true;
            }
        }

        if (!$hasIndex) {
            $zip->close();
            throw new Exception("Security/Structure Error: index.html not found in root.");
        }

        // 2. Prepare Path
        $folderName = $versionTag;
        $relativePath = "games/{$game->uuid}/{$folderName}";
        $destinationPath = public_path($relativePath);

        // Security: Ensure the destination is within the games directory
        if (!str_starts_with(realpath($destinationPath) ?: $destinationPath, public_path('games'))) {
             throw new Exception("Security Error: Invalid deployment path.");
        }

        if (File::exists($destinationPath)) {
            File::deleteDirectory($destinationPath);
        }
        File::makeDirectory($destinationPath, 0755, true);

        // 3. Extraction with careful permissions
        $zip->extractTo($destinationPath);
        $zip->close();

        // 4. Force immutable permissions on extracted assets
        chmod($destinationPath, 0755);
        $files = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($destinationPath));
        foreach ($files as $file) {
            if (!$file->isDir()) {
                chmod($file->getPathname(), 0644);
            }
        }

        // 4. Persistence
        return $game->versions()->create([
            'version_tag' => $versionTag,
            'folder_path' => $relativePath,
            'entry_point' => 'index.html',
            'is_published' => true
        ]);
    }
}
