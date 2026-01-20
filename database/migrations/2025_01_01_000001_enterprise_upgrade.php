<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 1. Challenges Table for Virality
        Schema::create('challenges', function (Blueprint $blueprint) {
            $blueprint->id();
            $blueprint->uuid('uuid')->unique();
            $blueprint->foreignId('game_id')->constrained();
            $blueprint->string('creator_uuid')->index();
            $blueprint->bigInteger('score');
            $blueprint->string('seed')->nullable(); // For deterministic game runs
            $blueprint->json('metadata')->nullable(); // screenshot overlay data, etc.
            $blueprint->timestamps();
        });

        // 2. Daily Drops
        Schema::create('daily_drops', function (Blueprint $blueprint) {
            $blueprint->id();
            $blueprint->date('drop_date')->unique();
            $blueprint->foreignId('game_id')->constrained();
            $blueprint->foreignId('challenge_game_id')->nullable()->constrained('games');
            $blueprint->string('fixed_seed')->nullable();
            $blueprint->timestamps();
        });

        // 3. High Scores for Ranking Quantiles
        Schema::create('game_scores', function (Blueprint $blueprint) {
            $blueprint->id();
            $blueprint->foreignId('game_id')->constrained();
            $blueprint->string('user_uuid')->index();
            $blueprint->bigInteger('score');
            $blueprint->timestamp('created_at')->useCurrent();
            $blueprint->index(['game_id', 'score']);
        });

        // 4. Game Health Metrics
        Schema::create('game_health_logs', function (Blueprint $blueprint) {
            $blueprint->id();
            $blueprint->foreignId('game_version_id')->constrained();
            $blueprint->enum('metric_type', ['crash', 'load_time', 'time_to_ready']);
            $blueprint->unsignedInteger('value'); // ms for time, 1 for crash
            $blueprint->timestamp('created_at')->useCurrent();
        });

        // Add health columns to game_versions for quick checks
        Schema::table('game_versions', function (Blueprint $table) {
            $table->float('crash_rate')->default(0);
            $table->unsignedInteger('avg_load_time')->default(0);
            $table->boolean('is_healthy')->default(true);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_health_logs');
        Schema::dropIfExists('game_scores');
        Schema::dropIfExists('daily_drops');
        Schema::dropIfExists('challenges');
        
        Schema::table('game_versions', function (Blueprint $table) {
            $table->dropColumn(['crash_rate', 'avg_load_time', 'is_healthy']);
        });
    }
};
