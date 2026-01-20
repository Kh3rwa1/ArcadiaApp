<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('game_progress', function (Blueprint $table) {
            $table->id();
            $table->string('user_uuid')->index();
            $table->foreignId('game_id')->constrained()->onDelete('cascade');
            $table->integer('current_level')->default(1);
            $table->integer('high_score')->default(0);
            $table->integer('total_score')->default(0);
            $table->json('state')->nullable(); // Game-specific save data (coins, unlocks, etc.)
            $table->integer('play_count')->default(0);
            $table->integer('total_time_ms')->default(0);
            $table->timestamp('last_played_at')->nullable();
            $table->timestamps();

            $table->unique(['user_uuid', 'game_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_progress');
    }
};
