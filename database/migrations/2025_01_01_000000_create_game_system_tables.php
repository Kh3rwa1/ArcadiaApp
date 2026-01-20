<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('games', function (Blueprint $blueprint) {
            $blueprint->id();
            $blueprint->uuid('uuid')->unique();
            $blueprint->string('title');
            $blueprint->string('slug')->unique();
            $blueprint->text('description')->nullable();
            $blueprint->string('thumbnail_url')->nullable();
            $blueprint->boolean('is_active')->default(true);
            $blueprint->json('settings')->nullable(); // orientation, aspect_ratio, etc.
            $blueprint->timestamps();
            $blueprint->softDeletes();
        });

        Schema::create('game_versions', function (Blueprint $blueprint) {
            $blueprint->id();
            $blueprint->foreignId('game_id')->constrained()->onDelete('cascade');
            $blueprint->string('version_tag'); // e.g., v1.0.2
            $blueprint->string('folder_path'); // games/{uuid}/{version}
            $blueprint->string('entry_point')->default('index.html');
            $blueprint->boolean('is_published')->default(false);
            $blueprint->timestamps();
        });

        Schema::create('game_analytics', function (Blueprint $blueprint) {
            $blueprint->id();
            $blueprint->foreignId('game_id')->constrained();
            $blueprint->string('user_uuid')->index(); // Android device ID or Auth UUID
            $blueprint->enum('event_type', ['impression', 'start', 'end', 'completion']);
            $blueprint->unsignedInteger('duration_ms')->default(0);
            $blueprint->json('metadata')->nullable();
            $blueprint->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_analytics');
        Schema::dropIfExists('game_versions');
        Schema::dropIfExists('games');
    }
};
